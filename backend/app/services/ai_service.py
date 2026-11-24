import re
import uuid
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload

from app.models.content import Content, ContentType, Genre, ContentGenre, ContentPlatform, AvailabilityType
from app.models.platform import Platform
from app.models.watchlist import Watchlist, WatchlistItem, WatchlistStatus
from app.models.ai import Recommendation
from app.models.billing import CreditWallet, CreditTransaction, UsageRecord, TransactionType
from app.models.user import User
from app.schemas.ai import (
    AIMoodItem,
    AIRecommendRequest,
    AIRecommendationItem,
    AIRecommendResponse,
    AIChatMessage,
    AIChatRequest,
    AIChatResponse,
    RecommendationHistoryItem
)
from app.schemas.content import ContentPlatformRead
from app.core.logging import logger

# Pre-curated mood presets for instantaneous discovery
PRESET_MOODS: List[AIMoodItem] = [
    AIMoodItem(
        id="mind-bending",
        name="Mind-Bending & Mystery",
        icon="Brain",
        description="Complex storylines, psychological thrillers, and philosophical sci-fi puzzles.",
        gradient="from-indigo-600 via-purple-600 to-pink-500",
        sample_prompt="Show me mind-bending sci-fi movies that will keep me guessing until the end.",
        suggested_genres=["sci-fi", "thriller", "mystery", "drama"]
    ),
    AIMoodItem(
        id="adrenaline",
        name="High-Octane Adrenaline",
        icon="Zap",
        description="Fast-paced blockbusters, explosive car chases, and non-stop action sequences.",
        gradient="from-amber-500 via-red-500 to-rose-600",
        sample_prompt="Recommend intense high-octane action movies with heart-racing tension.",
        suggested_genres=["action", "thriller", "sci-fi"]
    ),
    AIMoodItem(
        id="chill",
        name="Late Night Chill & Lo-Fi",
        icon="Moon",
        description="Atmospheric soundscapes, smooth acoustic ballads, and relaxing night ambient.",
        gradient="from-blue-600 via-indigo-600 to-violet-800",
        sample_prompt="Give me chill lo-fi music and relaxing soundscapes for late-night vibes.",
        suggested_genres=["lo-fi", "pop", "ambient", "romance"]
    ),
    AIMoodItem(
        id="anime-epic",
        name="Epic Anime & Shonen",
        icon="Sparkles",
        description="Breathtaking sakuga animation, supernatural abilities, and emotional hero journeys.",
        gradient="from-orange-500 via-amber-500 to-red-600",
        sample_prompt="Top shonen anime with jaw-dropping fight scenes and emotional depth.",
        suggested_genres=["anime", "action", "animation"]
    ),
    AIMoodItem(
        id="deep-focus",
        name="Deep Focus & Mindset",
        icon="Headphones",
        description="Deep dive conversations on neuroscience, human potential, and high performance.",
        gradient="from-emerald-500 via-teal-600 to-cyan-600",
        sample_prompt="Inspiring science and health podcasts that elevate my mindset and focus.",
        suggested_genres=["podcast", "documentary"]
    ),
    AIMoodItem(
        id="binge-worthy",
        name="Masterpiece Binge Queue",
        icon="Flame",
        description="Critically acclaimed multi-season prestige television with unforgettable characters.",
        gradient="from-rose-600 via-purple-600 to-indigo-600",
        sample_prompt="Prestige drama series with incredible writing and 9+ IMDb ratings.",
        suggested_genres=["drama", "crime", "thriller"]
    )
]

def extract_query_entities(query: str, mood_id: Optional[str] = None) -> Dict[str, Any]:
    """Parse natural language query to extract intent, media type, runtime, platform, and mood."""
    text = (query or "").lower().strip()
    entities: Dict[str, Any] = {
        "media_type": None,
        "max_runtime": None,
        "min_rating": None,
        "platform_slug": None,
        "is_free_only": False,
        "mood_id": mood_id,
        "target_genres": [],
        "keywords": []
    }

    # 1. Media Type Extraction
    if re.search(r"\b(movie|movies|film|films|cinema|feature)\b", text):
        entities["media_type"] = ContentType.MOVIE
    elif re.search(r"\b(series|show|shows|tv|season|seasons|sitcom)\b", text):
        entities["media_type"] = ContentType.SERIES
    elif re.search(r"\b(song|songs|track|tracks|music|lo-fi|lofi|album|beats)\b", text):
        entities["media_type"] = ContentType.SONG
    elif re.search(r"\b(anime|animation|shonen|seinen|otaku)\b", text):
        entities["media_type"] = ContentType.ANIME
    elif re.search(r"\b(podcast|podcasts|audiobook|talk|interview|episode)\b", text):
        entities["media_type"] = ContentType.PODCAST
    elif re.search(r"\b(video|videos|creator|clip|youtube)\b", text):
        entities["media_type"] = ContentType.VIDEO

    # 2. Runtime Budget Extraction (e.g. "under 2 hours", "under 90 mins", "< 120m")
    hour_match = re.search(r"under\s+(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h\b)", text)
    if hour_match:
        entities["max_runtime"] = int(float(hour_match.group(1)) * 60)
    else:
        min_match = re.search(r"under\s+(\d+)\s*(?:minutes?|mins?|m\b)", text)
        if min_match:
            entities["max_runtime"] = int(min_match.group(1))

    # 3. Minimum Rating Extraction (e.g. "rated > 8", "above 8.5 rating")
    rating_match = re.search(r"(?:rated|rating)\s*(?:over|above|>|>=)\s*(\d+(?:\.\d+)?)", text)
    if rating_match:
        entities["min_rating"] = float(rating_match.group(1))

    # 4. Platform Specific Mention
    platform_keywords = {
        "netflix": "netflix",
        "prime": "prime-video",
        "prime video": "prime-video",
        "hotstar": "jiohotstar",
        "jiohotstar": "jiohotstar",
        "sony liv": "sony-liv",
        "sonyliv": "sony-liv",
        "zee5": "zee5",
        "crunchyroll": "crunchyroll",
        "spotify": "spotify",
        "youtube": "youtube",
        "youtube music": "youtube-music",
        "apple tv": "apple-tv-plus",
        "apple music": "apple-music",
        "soundcloud": "soundcloud",
        "jiosaavn": "jiosaavn"
    }
    for kw, p_slug in platform_keywords.items():
        if re.search(rf"\b{re.escape(kw)}\b", text):
            entities["platform_slug"] = p_slug
            break

    # 5. Free-only detection
    if re.search(r"\b(free|free only|no subscription|without paying|free tier)\b", text):
        entities["is_free_only"] = True

    # 6. Mood Detection if not provided
    if not entities["mood_id"]:
        if re.search(r"\b(mind-bending|twist|mystery|puzzle|philosophical|sci-fi|incept|complex)\b", text):
            entities["mood_id"] = "mind-bending"
        elif re.search(r"\b(adrenaline|fast|action|intense|high-octane|thrill|chase)\b", text):
            entities["mood_id"] = "adrenaline"
        elif re.search(r"\b(chill|relax|soothing|sleep|calm|late-night|lofi|lo-fi|peaceful)\b", text):
            entities["mood_id"] = "chill"
        elif re.search(r"\b(anime|shonen|demon|slayer|fight|manga)\b", text):
            entities["mood_id"] = "anime-epic"
        elif re.search(r"\b(focus|study|coding|science|brain|learn|huberman|think)\b", text):
            entities["mood_id"] = "deep-focus"
        elif re.search(r"\b(binge|masterpiece|addictive|breaking bad|best drama|award)\b", text):
            entities["mood_id"] = "binge-worthy"

    # Add suggested genres based on mood
    if entities["mood_id"]:
        for mood in PRESET_MOODS:
            if mood.id == entities["mood_id"]:
                entities["target_genres"].extend(mood.suggested_genres)
                break

    # Clean keywords
    tokens = re.findall(r"\w+", text)
    stopwords = {"a", "an", "the", "in", "on", "at", "for", "with", "about", "show", "me", "find", "recommend", "give", "i", "want", "like", "under", "streaming", "something", "good", "best"}
    entities["keywords"] = [t for t in tokens if t not in stopwords and len(t) > 2]

    return entities

def build_ai_reasoning(
    title: str,
    content_type: str,
    rating: float,
    match_score: float,
    streaming_names: List[str],
    matched_genres: List[str],
    mood_id: Optional[str] = None
) -> str:
    """Generate nuanced, contextual human-grade rationale for why this item was selected."""
    platforms_str = " & ".join(streaming_names[:2]) if streaming_names else "major streaming platforms"
    genres_str = ", ".join(matched_genres[:2]) if matched_genres else content_type.lower()

    if mood_id == "mind-bending":
        return f"🧠 {match_score:.1f}% Match: Acclaimed {genres_str} title holding a {rating}/10 rating. Delivers thought-provoking themes and layered narrative. Available on {platforms_str}."
    elif mood_id == "adrenaline":
        return f"⚡ {match_score:.1f}% Match: High-stakes {genres_str} with non-stop propulsion and intense set pieces. Available now on {platforms_str}."
    elif mood_id == "chill":
        return f"🌙 {match_score:.1f}% Match: Perfect relaxing atmosphere with {rating}/10 listener acclaim. Immersive audio textures streaming on {platforms_str}."
    elif mood_id == "anime-epic":
        return f"⚔️ {match_score:.1f}% Match: Masterpiece animation with stunning combat sequences and high emotional stakes ({rating}/10). Streaming on {platforms_str}."
    elif mood_id == "deep-focus":
        return f"🎧 {match_score:.1f}% Match: Deep-dive educational audio rated {rating}/10, packed with actionable science and focus enhancement. Stream on {platforms_str}."
    elif mood_id == "binge-worthy":
        return f"🔥 {match_score:.1f}% Match: Prestige storytelling with a stellar {rating}/10 rating. Unputdownable character drama available on {platforms_str}."
    else:
        return f"✨ {match_score:.1f}% Match: Highly recommended {genres_str} rated {rating}/10 matching your taste. Direct streaming available on {platforms_str}."

async def get_user_watchlist_profile(db: AsyncSession, user_id: str) -> Tuple[set, set]:
    """Extract preferred genres and already completed items from user's watchlist."""
    preferred_genres: set = set()
    completed_content_ids: set = set()

    stmt = (
        select(Watchlist)
        .where(Watchlist.user_id == user_id)
        .options(
            selectinload(Watchlist.items).selectinload(WatchlistItem.content).selectinload(Content.genres).selectinload(ContentGenre.genre)
        )
    )
    res = await db.execute(stmt)
    watchlists = res.scalars().all()

    for wl in watchlists:
        for item in wl.items:
            if item.status == WatchlistStatus.COMPLETED:
                completed_content_ids.add(item.content_id)
            if item.content and item.content.genres:
                for cg in item.content.genres:
                    if cg.genre:
                        preferred_genres.add(cg.genre.slug)

    return preferred_genres, completed_content_ids

async def deduct_ai_usage_credit(db: AsyncSession, user_id: str, feature_code: str = "AI_RECOMMENDATION") -> Optional[int]:
    """Deduct 1 credit from user's wallet for AI service usage and record usage audit."""
    wallet_stmt = select(CreditWallet).where(CreditWallet.user_id == user_id)
    res = await db.execute(wallet_stmt)
    wallet = res.scalar_one_or_none()

    if not wallet:
        return None

    credits_to_deduct = 1
    if wallet.balance_credits >= credits_to_deduct:
        wallet.balance_credits -= credits_to_deduct
        wallet.lifetime_spent += credits_to_deduct

        tx = CreditTransaction(
            id=str(uuid.uuid4()),
            wallet_id=wallet.id,
            amount=-credits_to_deduct,
            transaction_type=TransactionType.USAGE_DEDUCTION,
            description=f"AI Copilot Usage ({feature_code})",
            reference_id=str(uuid.uuid4())[:8]
        )
        db.add(tx)

        usage = UsageRecord(
            id=str(uuid.uuid4()),
            user_id=user_id,
            feature_code=feature_code,
            credits_deducted=credits_to_deduct,
            metadata_payload={"source": "copilot_engine"}
        )
        db.add(usage)
        await db.commit()
        await db.refresh(wallet)

    return wallet.balance_credits

async def get_ai_recommendations(
    db: AsyncSession,
    request: AIRecommendRequest,
    user: Optional[User] = None
) -> AIRecommendResponse:
    """Core recommendation pipeline: entity extraction, multi-dimensional scoring, reasoning synthesis."""
    entities = extract_query_entities(request.query or "", request.mood or entities_mood if (entities_mood := None) else request.mood)

    # Override with explicit request parameters if provided
    if request.content_type:
        try:
            entities["media_type"] = ContentType(request.content_type.upper())
        except ValueError:
            pass
    if request.platform_slug:
        entities["platform_slug"] = request.platform_slug.lower()
    if request.max_runtime:
        entities["max_runtime"] = request.max_runtime
    if request.min_rating:
        entities["min_rating"] = request.min_rating
    if request.is_free_only:
        entities["is_free_only"] = True

    # User personalization context
    user_preferred_genres: set = set()
    user_completed_ids: set = set()
    if user:
        user_preferred_genres, user_completed_ids = await get_user_watchlist_profile(db, user.id)

    # Query all available catalog content with eager loaded platforms & genres
    stmt = (
        select(Content)
        .options(
            selectinload(Content.genres).selectinload(ContentGenre.genre),
            selectinload(Content.platforms).selectinload(ContentPlatform.platform)
        )
    )
    res = await db.execute(stmt)
    all_content = res.scalars().all()

    scored_items: List[Tuple[float, Content, List[str], str]] = []

    for item in all_content:
        score = 0.0
        # 1. Base score from content rating (e.g. 8.8 -> 44 pts out of 50)
        score += min(float(item.rating) * 5.0, 50.0)

        item_genres = [cg.genre.slug for cg in item.genres if cg.genre] if item.genres else []
        streaming_platforms = [cp.platform.slug for cp in item.platforms if cp.platform] if item.platforms else []
        streaming_names = [cp.platform.name for cp in item.platforms if cp.platform] if item.platforms else []

        # 2. Media Type Match
        if entities["media_type"]:
            if item.content_type == entities["media_type"]:
                score += 25.0
            else:
                score -= 30.0 # Down-weight mismatched content type

        # 3. Platform Constraint Match
        if entities["platform_slug"]:
            if entities["platform_slug"] in streaming_platforms:
                score += 25.0
            else:
                score -= 20.0

        # 4. Free Availability Match
        if entities["is_free_only"]:
            if item.is_free or any(cp.availability_type == AvailabilityType.FREE for cp in item.platforms):
                score += 20.0
            else:
                score -= 35.0

        # 5. Runtime Constraint Match
        if entities["max_runtime"]:
            if item.duration_minutes <= entities["max_runtime"]:
                score += 15.0
            else:
                # Heavy penalty if exceeds requested duration
                score -= min(40.0, (item.duration_minutes - entities["max_runtime"]) * 0.5)

        # 6. Minimum Rating Match
        if entities["min_rating"]:
            if item.rating >= entities["min_rating"]:
                score += 15.0
            else:
                score -= 25.0

        # 7. Title Match & Keyword Similarity
        title_lower = item.title.lower()
        title_tokens = set(re.findall(r"\w+", title_lower))
        matched_title_tokens = [kw for kw in entities["keywords"] if kw in title_tokens]
        # Direct title match is highly significant
        score += len(matched_title_tokens) * 25.0

        # Description and text corpus similarity
        text_corpus = f"{item.description or ''} {' '.join(item_genres)}".lower()
        matched_desc_keywords = [kw for kw in entities["keywords"] if kw in text_corpus and kw not in title_tokens]
        score += len(matched_desc_keywords) * 8.0

        # 8. Mood & Genre Alignment Match
        matched_mood_genres = [g for g in item_genres if g in entities["target_genres"]]
        score += len(matched_mood_genres) * 12.0

        # 9. Personalization Boost (Watchlist overlap)
        if user_preferred_genres:
            overlap = [g for g in item_genres if g in user_preferred_genres]
            score += len(overlap) * 5.0

        if item.id in user_completed_ids:
            # Penalize items user already watched to discover new media
            score -= 25.0

        if item.is_featured:
            score += 5.0

        # Normalize score into percentage 55.0% - 99.5% smoothly
        normalized_score = max(50.0, min(99.5, 55.0 + (max(0.0, score) * 0.22)))

        # Build reasoning explanation
        reasoning = build_ai_reasoning(
            title=item.title,
            content_type=item.content_type.value,
            rating=item.rating,
            match_score=normalized_score,
            streaming_names=streaming_names,
            matched_genres=matched_mood_genres or item_genres,
            mood_id=entities["mood_id"]
        )

        scored_items.append((score, normalized_score, item, streaming_names, reasoning))

    # Sort descending by raw score first, breaking any ties accurately
    scored_items.sort(key=lambda x: (x[0], x[1]), reverse=True)
    top_candidates = scored_items[:request.limit]

    # Convert to response schema
    recommendation_items: List[AIRecommendationItem] = []
    for raw_score, match_score, item, _, reasoning in top_candidates:
        genre_names = [cg.genre.name for cg in item.genres if cg.genre] if item.genres else []
        streaming_options = [
            ContentPlatformRead(
                platform_name=cp.platform.name,
                platform_slug=cp.platform.slug,
                platform_logo=cp.platform.logo_url,
                availability_type=cp.availability_type,
                pricing_details=cp.pricing_details,
                stream_url=cp.stream_url
            )
            for cp in item.platforms
            if cp.platform
        ] if item.platforms else []

        rec_item = AIRecommendationItem(
            id=item.id,
            title=item.title,
            slug=item.slug,
            content_type=item.content_type.value,
            description=item.description,
            poster_url=item.poster_url,
            backdrop_url=item.backdrop_url,
            rating=item.rating,
            duration_minutes=item.duration_minutes,
            maturity_rating=item.maturity_rating,
            original_language=item.original_language,
            genres=genre_names,
            match_score=round(match_score, 1),
            reasoning=reasoning,
            algorithm_source="AI_SEMANTIC_COPILOT",
            streaming_options=streaming_options
        )
        recommendation_items.append(rec_item)

        # Persist recommendation in DB if user is authenticated
        if user:
            rec_record = Recommendation(
                id=str(uuid.uuid4()),
                user_id=user.id,
                content_id=item.id,
                score=round(match_score / 10.0, 2),
                reasoning=reasoning,
                algorithm_source="AI_SEMANTIC_COPILOT"
            )
            db.add(rec_record)

    # Deduct credit if user authenticated
    credits_remaining = None
    if user:
        credits_remaining = await deduct_ai_usage_credit(db, user.id, "AI_RECOMMENDATION")

    return AIRecommendResponse(
        success=True,
        query=request.query,
        detected_intent="RECOMMEND",
        detected_mood=entities["mood_id"],
        detected_filters={
            "media_type": entities["media_type"].value if entities["media_type"] else None,
            "max_runtime": entities["max_runtime"],
            "platform_slug": entities["platform_slug"],
            "is_free_only": entities["is_free_only"]
        },
        recommendations=recommendation_items,
        total_results=len(recommendation_items),
        credits_used=1 if user else 0,
        credits_remaining=credits_remaining
    )

async def generate_copilot_chat(
    db: AsyncSession,
    request: AIChatRequest,
    user: Optional[User] = None
) -> AIChatResponse:
    """Conversational Copilot multi-turn engine: returns assistant response, content cards, and follow-ups."""
    latest_msg = request.messages[-1].content if request.messages else "What should I watch?"
    
    # Run recommendation pipeline
    rec_req = AIRecommendRequest(
        query=latest_msg,
        mood=request.mood,
        limit=3
    )
    rec_response = await get_ai_recommendations(db, rec_req, user=user)

    top_titles = [f"**{r.title}** ({r.content_type})" for r in rec_response.recommendations]
    titles_summary = ", ".join(top_titles) if top_titles else "great catalog picks"

    # Conversational response synthesis
    if rec_response.detected_mood == "mind-bending":
        chat_content = (
            f"I found {len(rec_response.recommendations)} mind-bending titles that match your request. "
            f"If you're looking for high intellect and reality-warping twists, check out {titles_summary}. "
            f"Each card below includes official direct deep links so you can start watching right away."
        )
        followups = [
            "Find mind-bending movies under 2 hours",
            "Show me similar titles streaming on Netflix",
            "Give me series with unexpected season finales"
        ]
    elif rec_response.detected_mood == "adrenaline":
        chat_content = (
            f"Ready for high-octane thrills! Here are {len(rec_response.recommendations)} adrenaline-pumping picks "
            f"featuring {titles_summary}. Click any platform badge below to launch official streaming instantly."
        )
        followups = [
            "Show me action anime with epic battles",
            "Find high-rated action movies on Prime Video",
            "Add top pick to my Watchlist"
        ]
    elif rec_response.detected_mood == "chill":
        chat_content = (
            f"Here are soothing selections to help you unwind: {titles_summary}. "
            f"Featuring smooth textures, lo-fi beats, and relaxing atmosphere available on Spotify and YouTube."
        )
        followups = [
            "Show me more lo-fi music on Spotify",
            "Find calming science podcasts for night listening",
            "Filter by free streaming only"
        ]
    elif rec_response.detected_mood == "deep-focus":
        chat_content = (
            f"For deep focus and intellectual growth, I recommend diving into {titles_summary}. "
            f"These provide cutting-edge neuroscience, health strategies, and thought leadership."
        )
        followups = [
            "Find podcasts about focus and brain health",
            "Show me episodes under 60 minutes",
            "Explore related video talks on YouTube"
        ]
    else:
        chat_content = (
            f"Based on your entertainment inquiry, I've curated {len(rec_response.recommendations)} top recommendations: "
            f"{titles_summary}. You can bookmark them to your private Watchlist or stream directly via official verified links below."
        )
        followups = [
            "Show me options streaming free without subscription",
            "Recommend series with ratings above 8.5",
            "Show me anime recommendations"
        ]

    return AIChatResponse(
        role="assistant",
        content=chat_content,
        detected_intent="RECOMMEND",
        recommendations=rec_response.recommendations,
        suggested_followups=followups,
        credits_remaining=rec_response.credits_remaining
    )

async def get_user_recommendation_history(
    db: AsyncSession,
    user_id: str,
    limit: int = 15
) -> List[RecommendationHistoryItem]:
    """Retrieve persistent past recommendations generated for user."""
    stmt = (
        select(Recommendation)
        .where(Recommendation.user_id == user_id)
        .order_by(desc(Recommendation.created_at))
        .options(selectinload(Recommendation.content))
        .limit(limit)
    )
    res = await db.execute(stmt)
    records = res.scalars().all()

    history: List[RecommendationHistoryItem] = []
    for r in records:
        if r.content:
            history.append(
                RecommendationHistoryItem(
                    id=r.id,
                    content_id=r.content_id,
                    content_title=r.content.title,
                    content_type=r.content.content_type.value,
                    poster_url=r.content.poster_url,
                    score=r.score,
                    reasoning=r.reasoning,
                    created_at=str(r.created_at)
                )
            )
    return history
