"""
Comprehensive Database Seed Data for NEXPLAY
Contains 40+ entertainment platforms across 6 categories, subscription plans, default genres, and sample catalog items.
"""
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.platform import (
    PlatformCategory,
    Platform,
    PlatformPricingType,
    PlatformIntegrationType,
    PlatformIntegration
)
from app.models.billing import SubscriptionPlan
from app.models.content import Genre, Content, ContentType, ContentGenre, ContentPlatform, AvailabilityType
from app.core.logging import logger

CATEGORIES_DATA = [
    {
        "name": "OTT & Movies",
        "slug": "ott",
        "icon": "Film",
        "description": "Premium streaming services for movies, web series, and exclusive originals.",
        "display_order": 1,
    },
    {
        "name": "Music & Audio",
        "slug": "music",
        "icon": "Music",
        "description": "High-fidelity music streaming, global chart toppers, and curated playlists.",
        "display_order": 2,
    },
    {
        "name": "Video & Creators",
        "slug": "video",
        "icon": "Video",
        "description": "On-demand video, live streams, educational talks, and creator broadcasts.",
        "display_order": 3,
    },
    {
        "name": "Anime & Animation",
        "slug": "anime",
        "icon": "Sparkles",
        "description": "Simulcast anime, Japanese animation classics, and Asian entertainment.",
        "display_order": 4,
    },
    {
        "name": "Audiobooks & Podcasts",
        "slug": "podcasts-audio",
        "icon": "Headphones",
        "description": "Narrated books, investigative audio podcasts, and live radio channels.",
        "display_order": 5,
    },
    {
        "name": "Personal Media",
        "slug": "personal-media",
        "icon": "HardDrive",
        "description": "Self-hosted media libraries, personal streaming servers, and home hubs.",
        "display_order": 6,
    },
]

PLATFORMS_DATA = [
    # 1. OTT & Movies (17 platforms)
    {
        "name": "Netflix",
        "slug": "netflix",
        "category_slug": "ott",
        "logo_url": "https://assets.nflxext.com/ffe/siteui/common/icons/nficon2016.ico",
        "official_url": "https://www.netflix.com",
        "description": "World's leading subscription streaming service featuring award-winning series, films, and documentaries.",
        "pricing_type": PlatformPricingType.SUBSCRIPTION,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 100,
        "supported_features": {"deep_linking": True, "search_redirect": True, "watch_history": False},
    },
    {
        "name": "Amazon Prime Video",
        "slug": "prime-video",
        "category_slug": "ott",
        "logo_url": "https://m.media-amazon.com/images/G/01/digital/video/web/logo-min-valhalla.png",
        "official_url": "https://www.primevideo.com",
        "description": "Stream exclusive Amazon Originals, blockbuster movies, live sports, and premium channel add-ons.",
        "pricing_type": PlatformPricingType.SUBSCRIPTION,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 98,
        "supported_features": {"deep_linking": True, "search_redirect": True, "rent_buy": True},
    },
    {
        "name": "JioHotstar",
        "slug": "jiohotstar",
        "category_slug": "ott",
        "logo_url": "https://www.hotstar.com/assets/c0e3a479b4a7d65b.png",
        "official_url": "https://www.hotstar.com",
        "description": "India's premier streaming platform for Disney, HBO, live cricket, Indian blockbusters, and Specials.",
        "pricing_type": PlatformPricingType.FREEMIUM,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 96,
        "supported_features": {"deep_linking": True, "search_redirect": True, "free_tier": True},
    },
    {
        "name": "Sony LIV",
        "slug": "sony-liv",
        "category_slug": "ott",
        "logo_url": "https://images.sonyliv.com/UI_icons/sonyliv_new_avatar.png",
        "official_url": "https://www.sonyliv.com",
        "description": "Acclaimed Indian drama series, international cinema, UEFA Champions League, and WWE action.",
        "pricing_type": PlatformPricingType.FREEMIUM,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 92,
        "supported_features": {"deep_linking": True, "search_redirect": True},
    },
    {
        "name": "Zee5",
        "slug": "zee5",
        "category_slug": "ott",
        "logo_url": "https://www.zee5.com/images/ZEE5_logo.svg",
        "official_url": "https://www.zee5.com",
        "description": "Expansive multilingual entertainment catalog across Hindi, Tamil, Telugu, Bangla, and Marathi.",
        "pricing_type": PlatformPricingType.FREEMIUM,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 90,
        "supported_features": {"deep_linking": True, "search_redirect": True, "free_tier": True},
    },
    {
        "name": "Apple TV+",
        "slug": "apple-tv-plus",
        "category_slug": "ott",
        "logo_url": "https://tv.apple.com/favicon.ico",
        "official_url": "https://tv.apple.com",
        "description": "Apple Original drama, sci-fi masterworks, and comedy series produced with cinema-grade fidelity.",
        "pricing_type": PlatformPricingType.SUBSCRIPTION,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 88,
        "supported_features": {"deep_linking": True, "search_redirect": True},
    },
    {
        "name": "Disney+",
        "slug": "disney-plus",
        "category_slug": "ott",
        "logo_url": "https://static-assets.bamgrid.com/product/disneyplus/favicons/favicon.ico",
        "official_url": "https://www.disneyplus.com",
        "description": "The dedicated streaming home for movies and shows from Disney, Pixar, Marvel, Star Wars, and Nat Geo.",
        "pricing_type": PlatformPricingType.SUBSCRIPTION,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 86,
        "supported_features": {"deep_linking": True, "search_redirect": True},
    },
    {
        "name": "Hulu",
        "slug": "hulu",
        "category_slug": "ott",
        "logo_url": "https://www.hulu.com/favicon.ico",
        "official_url": "https://www.hulu.com",
        "description": "Leading US streaming hub offering current-season TV episodes, original series, and hit movies.",
        "pricing_type": PlatformPricingType.SUBSCRIPTION,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 82,
        "supported_features": {"deep_linking": True, "search_redirect": True},
    },
    {
        "name": "Max (HBO)",
        "slug": "max-hbo",
        "category_slug": "ott",
        "logo_url": "https://www.max.com/favicon.ico",
        "official_url": "https://www.max.com",
        "description": "Warner Bros. Discovery streaming platform presenting HBO Originals, DC Universe, and Harry Potter.",
        "pricing_type": PlatformPricingType.SUBSCRIPTION,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 80,
        "supported_features": {"deep_linking": True, "search_redirect": True},
    },
    {
        "name": "Paramount+",
        "slug": "paramount-plus",
        "category_slug": "ott",
        "logo_url": "https://www.paramountplus.com/favicon.ico",
        "official_url": "https://www.paramountplus.com",
        "description": "A mountain of entertainment from CBS, Showtime, MTV, BET, Paramount Pictures, and Nickelodeon.",
        "pricing_type": PlatformPricingType.SUBSCRIPTION,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 78,
        "supported_features": {"deep_linking": True, "search_redirect": True},
    },
    {
        "name": "Peacock",
        "slug": "peacock",
        "category_slug": "ott",
        "logo_url": "https://www.peacocktv.com/favicon.ico",
        "official_url": "https://www.peacocktv.com",
        "description": "NBCUniversal's streaming home with iconic comedies, live Premier League action, and Universal cinema.",
        "pricing_type": PlatformPricingType.SUBSCRIPTION,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 76,
        "supported_features": {"deep_linking": True, "search_redirect": True},
    },
    {
        "name": "Lionsgate Play",
        "slug": "lionsgate-play",
        "category_slug": "ott",
        "logo_url": "https://lionsgateplay.com/favicon.ico",
        "official_url": "https://lionsgateplay.com",
        "description": "Hollywood action blockbusters, John Wick franchise, acclaimed drama series, and indie cinema.",
        "pricing_type": PlatformPricingType.SUBSCRIPTION,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 74,
        "supported_features": {"deep_linking": True, "search_redirect": True},
    },
    {
        "name": "Sun NXT",
        "slug": "sun-nxt",
        "category_slug": "ott",
        "logo_url": "https://www.sunnxt.net/favicon.ico",
        "official_url": "https://www.sunnxt.net",
        "description": "South Indian streaming powerhouse featuring Tamil, Telugu, Malayalam, and Kannada cinema & TV.",
        "pricing_type": PlatformPricingType.SUBSCRIPTION,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 72,
        "supported_features": {"deep_linking": True, "search_redirect": True},
    },
    {
        "name": "aha",
        "slug": "aha",
        "category_slug": "ott",
        "logo_url": "https://www.aha.video/favicon.ico",
        "official_url": "https://www.aha.video",
        "description": "100% Telugu & Tamil entertainment with exclusive talk shows, blockbuster releases, and web series.",
        "pricing_type": PlatformPricingType.SUBSCRIPTION,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 70,
        "supported_features": {"deep_linking": True, "search_redirect": True},
    },
    {
        "name": "Hoichoi",
        "slug": "hoichoi",
        "category_slug": "ott",
        "logo_url": "https://www.hoichoi.tv/favicon.ico",
        "official_url": "https://www.hoichoi.tv",
        "description": "The premier Bengali entertainment platform with 600+ Bengali films, web series, and music.",
        "pricing_type": PlatformPricingType.SUBSCRIPTION,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 68,
        "supported_features": {"deep_linking": True, "search_redirect": True},
    },
    {
        "name": "Eros Now",
        "slug": "eros-now",
        "category_slug": "ott",
        "logo_url": "https://erosnow.com/favicon.ico",
        "official_url": "https://erosnow.com",
        "description": "Classic and modern Bollywood film library, music tracks, and Hindi web serials.",
        "pricing_type": PlatformPricingType.SUBSCRIPTION,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 66,
        "supported_features": {"deep_linking": True, "search_redirect": True},
    },
    {
        "name": "MX Player",
        "slug": "mx-player",
        "category_slug": "ott",
        "logo_url": "https://www.mxplayer.in/favicon.ico",
        "official_url": "https://www.mxplayer.in",
        "description": "Free ad-supported streaming of Indian web series, Korean dramas in Hindi, and regional movies.",
        "pricing_type": PlatformPricingType.FREE,
        "integration_type": PlatformIntegrationType.FREE_CONTENT,
        "display_priority": 65,
        "supported_features": {"deep_linking": True, "search_redirect": True, "free_tier": True},
    },

    # 2. Music & Audio (9 platforms)
    {
        "name": "Spotify",
        "slug": "spotify",
        "category_slug": "music",
        "logo_url": "https://open.spotifycdn.com/cdn/images/favicon32.b64ecc03.png",
        "official_url": "https://open.spotify.com",
        "description": "World's largest music and audio streaming service with 100M+ songs, personalized mixes, and podcasts.",
        "pricing_type": PlatformPricingType.FREEMIUM,
        "integration_type": PlatformIntegrationType.OAUTH,
        "display_priority": 95,
        "supported_features": {"oauth_ready": True, "web_player_embed": True, "search_redirect": True},
    },
    {
        "name": "YouTube Music",
        "slug": "youtube-music",
        "category_slug": "music",
        "logo_url": "https://music.youtube.com/img/favicon_144.png",
        "official_url": "https://music.youtube.com",
        "description": "Music platform powered by YouTube, offering official songs, live performances, covers, and remixes.",
        "pricing_type": PlatformPricingType.FREEMIUM,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 94,
        "supported_features": {"deep_linking": True, "search_redirect": True},
    },
    {
        "name": "Apple Music",
        "slug": "apple-music",
        "category_slug": "music",
        "logo_url": "https://music.apple.com/assets/favicon/favicon.ico",
        "official_url": "https://music.apple.com",
        "description": "Lossless spatial audio music streaming with Apple Digital Masters and curated artist radio stations.",
        "pricing_type": PlatformPricingType.SUBSCRIPTION,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 90,
        "supported_features": {"deep_linking": True, "search_redirect": True},
    },
    {
        "name": "Amazon Music",
        "slug": "amazon-music",
        "category_slug": "music",
        "logo_url": "https://music.amazon.com/favicon.ico",
        "official_url": "https://music.amazon.com",
        "description": "High definition music and podcast ecosystem integrated with Alexa and Prime membership.",
        "pricing_type": PlatformPricingType.SUBSCRIPTION,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 86,
        "supported_features": {"deep_linking": True, "search_redirect": True},
    },
    {
        "name": "SoundCloud",
        "slug": "soundcloud",
        "category_slug": "music",
        "logo_url": "https://a-v2.sndcdn.com/assets/images/sc-icons/favicon-2cadd14bdb.ico",
        "official_url": "https://soundcloud.com",
        "description": "Global open audio community where artists upload tracks, indie remixes, DJ sets, and demos.",
        "pricing_type": PlatformPricingType.FREEMIUM,
        "integration_type": PlatformIntegrationType.OFFICIAL_API,
        "display_priority": 84,
        "supported_features": {"embed_player": True, "free_tier": True, "search_redirect": True},
    },
    {
        "name": "Deezer",
        "slug": "deezer",
        "category_slug": "music",
        "logo_url": "https://www.deezer.com/favicon.ico",
        "official_url": "https://www.deezer.com",
        "description": "French music platform renowned for Flow smart mixes, SongCatcher, and HiFi FLAC audio.",
        "pricing_type": PlatformPricingType.FREEMIUM,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 80,
        "supported_features": {"deep_linking": True, "search_redirect": True},
    },
    {
        "name": "Tidal",
        "slug": "tidal",
        "category_slug": "music",
        "logo_url": "https://tidal.com/favicon.ico",
        "official_url": "https://tidal.com",
        "description": "Artist-first streaming service providing bit-perfect HiRes FLAC, Dolby Atmos, and curated editorial.",
        "pricing_type": PlatformPricingType.SUBSCRIPTION,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 78,
        "supported_features": {"deep_linking": True, "search_redirect": True},
    },
    {
        "name": "JioSaavn",
        "slug": "jiosaavn",
        "category_slug": "music",
        "logo_url": "https://static.jiosaavn.com/web/favicon.ico",
        "official_url": "https://www.jiosaavn.com",
        "description": "India's homegrown music streaming engine with Bollywood, regional languages, and English hits.",
        "pricing_type": PlatformPricingType.FREEMIUM,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 76,
        "supported_features": {"free_tier": True, "deep_linking": True},
    },
    {
        "name": "Gaana",
        "slug": "gaana",
        "category_slug": "music",
        "logo_url": "https://gaana.com/favicon.ico",
        "official_url": "https://gaana.com",
        "description": "Popular Indian commercial music catalog featuring retro Bollywood, Punjabi pop, and devotional tracks.",
        "pricing_type": PlatformPricingType.SUBSCRIPTION,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 74,
        "supported_features": {"deep_linking": True, "search_redirect": True},
    },

    # 3. Video & Creators (5 platforms)
    {
        "name": "YouTube",
        "slug": "youtube",
        "category_slug": "video",
        "logo_url": "https://www.youtube.com/s/desktop/9ef2e1bb/img/favicon_144x144.png",
        "official_url": "https://www.youtube.com",
        "description": "Global video platform spanning user uploads, educational content, independent studios, and film rentals.",
        "pricing_type": PlatformPricingType.FREEMIUM,
        "integration_type": PlatformIntegrationType.OFFICIAL_API,
        "display_priority": 100,
        "supported_features": {"official_embed": True, "free_tier": True, "search_redirect": True},
    },
    {
        "name": "Vimeo",
        "slug": "vimeo",
        "category_slug": "video",
        "logo_url": "https://f.vimeocdn.com/images_v6/favicon.ico",
        "official_url": "https://vimeo.com",
        "description": "High-definition video platform for filmmakers, creative professionals, short films, and visual arts.",
        "pricing_type": PlatformPricingType.FREEMIUM,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 82,
        "supported_features": {"official_embed": True, "free_tier": True},
    },
    {
        "name": "Twitch",
        "slug": "twitch",
        "category_slug": "video",
        "logo_url": "https://static.twitchcdn.net/assets/favicon-32-e29e246c157142c94346.png",
        "official_url": "https://www.twitch.tv",
        "description": "Leading live streaming platform for gaming, esports broadcasts, live coding, and creator talk shows.",
        "pricing_type": PlatformPricingType.FREEMIUM,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 80,
        "supported_features": {"embed_stream": True, "free_tier": True},
    },
    {
        "name": "Dailymotion",
        "slug": "dailymotion",
        "category_slug": "video",
        "logo_url": "https://static1.dmcdn.net/images/neon/favicons/favicon.ico",
        "official_url": "https://www.dailymotion.com",
        "description": "European video sharing website with news channels, sports highlights, and user creations.",
        "pricing_type": PlatformPricingType.FREE,
        "integration_type": PlatformIntegrationType.FREE_CONTENT,
        "display_priority": 75,
        "supported_features": {"embed_player": True, "free_tier": True},
    },
    {
        "name": "TED",
        "slug": "ted",
        "category_slug": "video",
        "logo_url": "https://www.ted.com/favicon.ico",
        "official_url": "https://www.ted.com",
        "description": "Ideas worth spreading: influential talks from leading thinkers in technology, science, and humanities.",
        "pricing_type": PlatformPricingType.FREE,
        "integration_type": PlatformIntegrationType.FREE_CONTENT,
        "display_priority": 70,
        "supported_features": {"embed_talks": True, "free_tier": True},
    },

    # 4. Anime & Animation (4 platforms)
    {
        "name": "Crunchyroll",
        "slug": "crunchyroll",
        "category_slug": "anime",
        "logo_url": "https://www.crunchyroll.com/build/assets/img/favicons/favicon-v2-32x32.png",
        "official_url": "https://www.crunchyroll.com",
        "description": "The destination for anime fans with the largest library of subbed & dubbed Japanese anime series.",
        "pricing_type": PlatformPricingType.FREEMIUM,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 90,
        "supported_features": {"deep_linking": True, "search_redirect": True},
    },
    {
        "name": "Bilibili",
        "slug": "bilibili",
        "category_slug": "anime",
        "logo_url": "https://www.bilibili.tv/favicon.ico",
        "official_url": "https://www.bilibili.tv",
        "description": "Leading Asian animation and pop culture video platform with Southeast Asian & regional catalog.",
        "pricing_type": PlatformPricingType.FREEMIUM,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 80,
        "supported_features": {"deep_linking": True, "search_redirect": True},
    },
    {
        "name": "Anime-Planet",
        "slug": "anime-planet",
        "category_slug": "anime",
        "logo_url": "https://www.anime-planet.com/favicon.ico",
        "official_url": "https://www.anime-planet.com",
        "description": "Fan-driven anime and manga recommendation database with legal streaming partnerships.",
        "pricing_type": PlatformPricingType.FREE,
        "integration_type": PlatformIntegrationType.FREE_CONTENT,
        "display_priority": 75,
        "supported_features": {"catalog_links": True, "free_tier": True},
    },
    {
        "name": "RetroCrush",
        "slug": "retrocrush",
        "category_slug": "anime",
        "logo_url": "https://www.retrocrush.tv/favicon.ico",
        "official_url": "https://www.retrocrush.tv",
        "description": "Dedicated home for vintage anime from the golden era of the 1970s, 80s, and 90s.",
        "pricing_type": PlatformPricingType.FREE,
        "integration_type": PlatformIntegrationType.FREE_CONTENT,
        "display_priority": 70,
        "supported_features": {"deep_linking": True, "free_tier": True},
    },

    # 5. Audiobooks & Podcasts (5 platforms)
    {
        "name": "Audible",
        "slug": "audible",
        "category_slug": "podcasts-audio",
        "logo_url": "https://m.media-amazon.com/images/G/01/Audible/en_US/images/global/favicon.ico",
        "official_url": "https://www.audible.in",
        "description": "Premier destination for narrated audiobooks, podcasts, and exclusive audio entertainment.",
        "pricing_type": PlatformPricingType.SUBSCRIPTION,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 90,
        "supported_features": {"deep_linking": True, "search_redirect": True},
    },
    {
        "name": "Pocket Casts",
        "slug": "pocket-casts",
        "category_slug": "podcasts-audio",
        "logo_url": "https://pocketcasts.com/favicon.ico",
        "official_url": "https://play.pocketcasts.com",
        "description": "Award-winning podcast player with smart trimming, cloud sync, and cross-platform playback.",
        "pricing_type": PlatformPricingType.FREEMIUM,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 85,
        "supported_features": {"deep_linking": True, "free_tier": True},
    },
    {
        "name": "Apple Podcasts",
        "slug": "apple-podcasts",
        "category_slug": "podcasts-audio",
        "logo_url": "https://podcasts.apple.com/favicon.ico",
        "official_url": "https://podcasts.apple.com",
        "description": "Millions of free shows across news, true crime, tech, comedy, and audio documentaries.",
        "pricing_type": PlatformPricingType.FREE,
        "integration_type": PlatformIntegrationType.FREE_CONTENT,
        "display_priority": 84,
        "supported_features": {"deep_linking": True, "free_tier": True},
    },
    {
        "name": "TuneIn Radio",
        "slug": "tunein",
        "category_slug": "podcasts-audio",
        "logo_url": "https://tunein.com/favicon.ico",
        "official_url": "https://tunein.com",
        "description": "Stream 100,000+ real radio stations, breaking news, sports talk, and global music stations.",
        "pricing_type": PlatformPricingType.FREEMIUM,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 80,
        "supported_features": {"web_player": True, "free_tier": True},
    },
    {
        "name": "iHeartRadio",
        "slug": "iheart",
        "category_slug": "podcasts-audio",
        "logo_url": "https://www.iheart.com/favicon.ico",
        "official_url": "https://www.iheart.com",
        "description": "Free broadcast radio stations, custom artist stations, and top podcast networks.",
        "pricing_type": PlatformPricingType.FREE,
        "integration_type": PlatformIntegrationType.FREE_CONTENT,
        "display_priority": 78,
        "supported_features": {"web_player": True, "free_tier": True},
    },

    # 6. Personal Media (3 platforms)
    {
        "name": "Plex",
        "slug": "plex",
        "category_slug": "personal-media",
        "logo_url": "https://app.plex.tv/favicon.ico",
        "official_url": "https://app.plex.tv",
        "description": "Organize your personal video, music, and photo collections, plus stream free live TV channels.",
        "pricing_type": PlatformPricingType.FREEMIUM,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 90,
        "supported_features": {"server_connect": True, "free_tier": True},
    },
    {
        "name": "Jellyfin",
        "slug": "jellyfin",
        "category_slug": "personal-media",
        "logo_url": "https://jellyfin.org/images/logo.svg",
        "official_url": "https://jellyfin.org",
        "description": "The Free Software media system that puts you in control of managing and streaming your media.",
        "pricing_type": PlatformPricingType.FREE,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 88,
        "supported_features": {"open_source": True, "self_hosted": True},
    },
    {
        "name": "Kodi",
        "slug": "kodi",
        "category_slug": "personal-media",
        "logo_url": "https://kodi.tv/images/kodi-logo.svg",
        "official_url": "https://kodi.tv",
        "description": "Award-winning open source home theater software and entertainment hub for digital media.",
        "pricing_type": PlatformPricingType.FREE,
        "integration_type": PlatformIntegrationType.OFFICIAL_LINK,
        "display_priority": 80,
        "supported_features": {"open_source": True, "self_hosted": True},
    },
]

SUBSCRIPTION_PLANS_DATA = [
    {
        "name": "Free",
        "slug": "free",
        "price_inr": 0.0,
        "billing_cycle": "FREE",
        "credit_allowance": 50,
        "features": {
            "account_creation": "Included",
            "entertainment_discovery": "Unlimited",
            "platform_directory": "40+ Platforms",
            "external_platform_links": "Unlimited",
            "basic_recommendations": "Included",
            "usage_dashboard": "Basic",
            "ai_credits": 50
        }
    },
    {
        "name": "Starter",
        "slug": "starter",
        "price_inr": 49.0,
        "billing_cycle": "MONTHLY",
        "credit_allowance": 250,
        "features": {
            "account_creation": "Included",
            "entertainment_discovery": "Unlimited",
            "platform_directory": "40+ Platforms",
            "external_platform_links": "Unlimited",
            "personalized_dashboard": "Enabled",
            "custom_watchlists": "Up to 5",
            "ai_assistant_queries": "Included",
            "ai_credits": 250
        }
    },
    {
        "name": "Plus",
        "slug": "plus",
        "price_inr": 149.0,
        "billing_cycle": "MONTHLY",
        "credit_allowance": 750,
        "features": {
            "everything_in_starter": True,
            "advanced_discovery": "Semantic AI Search",
            "ai_copilot_assistant": "High Priority",
            "usage_tracking": "Full Analytics",
            "automated_reminders": "Enabled",
            "ai_credits": 750
        }
    },
    {
        "name": "Pro",
        "slug": "pro",
        "price_inr": 299.0,
        "billing_cycle": "MONTHLY",
        "credit_allowance": 2000,
        "features": {
            "everything_in_plus": True,
            "maximum_ai_usage": "2000 Monthly Credits",
            "mcp_server_access": "Full External Access",
            "playwright_link_audits": "Scheduled Automations",
            "early_beta_features": "Included",
            "ai_credits": 2000
        }
    }
]

GENRES_DATA = [
    {"name": "Action", "slug": "action", "category_type": "MOVIE"},
    {"name": "Sci-Fi", "slug": "sci-fi", "category_type": "MOVIE"},
    {"name": "Thriller", "slug": "thriller", "category_type": "MOVIE"},
    {"name": "Comedy", "slug": "comedy", "category_type": "MOVIE"},
    {"name": "Drama", "slug": "drama", "category_type": "MOVIE"},
    {"name": "Romance", "slug": "romance", "category_type": "MOVIE"},
    {"name": "Animation", "slug": "animation", "category_type": "ANIME"},
    {"name": "Pop", "slug": "pop", "category_type": "MUSIC"},
    {"name": "Lo-Fi", "slug": "lo-fi", "category_type": "MUSIC"},
    {"name": "Hip Hop", "slug": "hip-hop", "category_type": "MUSIC"},
    {"name": "Documentary", "slug": "documentary", "category_type": "VIDEO"},
    {"name": "Anime", "slug": "anime", "category_type": "ANIME"},
    {"name": "Horror", "slug": "horror", "category_type": "MOVIE"},
    {"name": "Podcast", "slug": "podcast", "category_type": "AUDIO"},
]

SAMPLE_CONTENT_DATA = [
    {
        "title": "Interstellar",
        "slug": "interstellar",
        "content_type": ContentType.MOVIE,
        "description": "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
        "poster_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop",
        "backdrop_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop",
        "release_date": "2014-11-07",
        "duration_minutes": 169,
        "rating": 8.7,
        "maturity_rating": "PG-13",
        "original_language": "en",
        "is_featured": True,
        "is_free": False,
        "genres": ["sci-fi", "drama"],
        "streaming": [
            {"platform_slug": "prime-video", "type": AvailabilityType.SUBSCRIPTION, "pricing": "Included with Prime", "url": "https://www.primevideo.com/search/ref=atv_nb_sr?phrase=Interstellar"},
            {"platform_slug": "netflix", "type": AvailabilityType.SUBSCRIPTION, "pricing": "Subscription", "url": "https://www.netflix.com/search?q=Interstellar"}
        ]
    },
    {
        "title": "Pushpa 2: The Rule",
        "slug": "pushpa-2-the-rule",
        "content_type": ContentType.MOVIE,
        "description": "The clash between Pushpa Raj and Bhanwar Singh Shekhawat escalates into an all-out war.",
        "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop",
        "backdrop_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop",
        "release_date": "2024-12-05",
        "duration_minutes": 200,
        "rating": 8.1,
        "maturity_rating": "U/A 16+",
        "original_language": "te",
        "is_featured": True,
        "is_free": False,
        "genres": ["action", "thriller"],
        "streaming": [
            {"platform_slug": "netflix", "type": AvailabilityType.SUBSCRIPTION, "pricing": "Streaming on Netflix", "url": "https://www.netflix.com/search?q=Pushpa%202"}
        ]
    },
    {
        "title": "Stranger Things",
        "slug": "stranger-things",
        "content_type": ContentType.SERIES,
        "description": "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
        "poster_url": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop",
        "backdrop_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop",
        "release_date": "2016-07-15",
        "duration_minutes": 50,
        "rating": 8.7,
        "maturity_rating": "16+",
        "original_language": "en",
        "is_featured": True,
        "is_free": False,
        "genres": ["sci-fi", "horror", "drama"],
        "streaming": [
            {"platform_slug": "netflix", "type": AvailabilityType.SUBSCRIPTION, "pricing": "Streaming on Netflix", "url": "https://www.netflix.com/search?q=Stranger%20Things"}
        ]
    },
    {
        "title": "Panchayat",
        "slug": "panchayat",
        "content_type": ContentType.SERIES,
        "description": "An engineering graduate takes up an administrative job in a remote Indian village called Phulera.",
        "poster_url": "https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=600&auto=format&fit=crop",
        "backdrop_url": "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=1200&auto=format&fit=crop",
        "release_date": "2020-04-03",
        "duration_minutes": 35,
        "rating": 8.9,
        "maturity_rating": "U/A",
        "original_language": "hi",
        "is_featured": True,
        "is_free": False,
        "genres": ["comedy", "drama"],
        "streaming": [
            {"platform_slug": "prime-video", "type": AvailabilityType.SUBSCRIPTION, "pricing": "Included with Prime", "url": "https://www.primevideo.com/search/ref=atv_nb_sr?phrase=Panchayat"}
        ]
    },
    {
        "title": "Scam 1992: The Harshad Mehta Story",
        "slug": "scam-1992",
        "content_type": ContentType.SERIES,
        "description": "Set in 1980s and 90s Bombay, it follows the life of Harshad Mehta, a stockbroker who took the stock market to dizzying heights.",
        "poster_url": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop",
        "backdrop_url": "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&auto=format&fit=crop",
        "release_date": "2020-10-09",
        "duration_minutes": 55,
        "rating": 9.3,
        "maturity_rating": "16+",
        "original_language": "hi",
        "is_featured": True,
        "is_free": False,
        "genres": ["thriller", "drama"],
        "streaming": [
            {"platform_slug": "sony-liv", "type": AvailabilityType.SUBSCRIPTION, "pricing": "Sony LIV Premium", "url": "https://www.sonyliv.com/search?query=Scam%201992"}
        ]
    },
    {
        "title": "Attack on Titan: Final Season",
        "slug": "attack-on-titan",
        "content_type": ContentType.ANIME,
        "description": "After his hometown is destroyed and his mother is killed, young Eren Jaeger vows to cleanse the earth of the giant humanoid Titans.",
        "poster_url": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop",
        "backdrop_url": "https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop",
        "release_date": "2013-04-07",
        "duration_minutes": 24,
        "rating": 9.1,
        "maturity_rating": "18+",
        "original_language": "ja",
        "is_featured": True,
        "is_free": False,
        "genres": ["anime", "action", "animation"],
        "streaming": [
            {"platform_slug": "crunchyroll", "type": AvailabilityType.SUBSCRIPTION, "pricing": "Stream on Crunchyroll", "url": "https://www.crunchyroll.com/search?q=Attack%20on%20Titan"},
            {"platform_slug": "netflix", "type": AvailabilityType.SUBSCRIPTION, "pricing": "Streaming on Netflix", "url": "https://www.netflix.com/search?q=Attack%20on%20Titan"}
        ]
    },
    {
        "title": "Demon Slayer: Kimetsu no Yaiba",
        "slug": "demon-slayer",
        "content_type": ContentType.ANIME,
        "description": "A family is attacked by demons and only two members survive - Tanjiro and his sister Nezuko, who is turning into a demon herself.",
        "poster_url": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop",
        "backdrop_url": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop",
        "release_date": "2019-04-06",
        "duration_minutes": 24,
        "rating": 8.7,
        "maturity_rating": "16+",
        "original_language": "ja",
        "is_featured": True,
        "is_free": False,
        "genres": ["anime", "action", "animation"],
        "streaming": [
            {"platform_slug": "crunchyroll", "type": AvailabilityType.SUBSCRIPTION, "pricing": "Stream on Crunchyroll", "url": "https://www.crunchyroll.com/search?q=Demon%20Slayer"},
            {"platform_slug": "netflix", "type": AvailabilityType.SUBSCRIPTION, "pricing": "Streaming on Netflix", "url": "https://www.netflix.com/search?q=Demon%20Slayer"}
        ]
    },
    {
        "title": "Midnight Chill Lo-Fi Sessions",
        "slug": "midnight-chill-lo-fi-sessions",
        "content_type": ContentType.SONG,
        "description": "Relaxing lo-fi beats, ambient piano chords, and soothing night rain textures.",
        "poster_url": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop",
        "backdrop_url": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop",
        "release_date": "2024-01-10",
        "duration_minutes": 4,
        "rating": 9.2,
        "maturity_rating": "All",
        "original_language": "en",
        "is_featured": True,
        "is_free": True,
        "genres": ["lo-fi", "pop"],
        "streaming": [
            {"platform_slug": "spotify", "type": AvailabilityType.FREE, "pricing": "Free with Ads / Premium", "url": "https://open.spotify.com/search/lo-fi%20sessions"},
            {"platform_slug": "youtube-music", "type": AvailabilityType.FREE, "pricing": "Free to Stream", "url": "https://music.youtube.com/search?q=lo-fi%20sessions"},
            {"platform_slug": "soundcloud", "type": AvailabilityType.FREE, "pricing": "Free Stream", "url": "https://soundcloud.com/search?q=lofi"}
        ]
    },
    {
        "title": "Arijit Singh: Live Acoustic Sessions",
        "slug": "arijit-singh-live-acoustic",
        "content_type": ContentType.SONG,
        "description": "Soul-stirring romantic acoustic performances and live orchestral ballads.",
        "poster_url": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop",
        "backdrop_url": "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop",
        "release_date": "2023-11-15",
        "duration_minutes": 5,
        "rating": 9.4,
        "maturity_rating": "All",
        "original_language": "hi",
        "is_featured": True,
        "is_free": True,
        "genres": ["pop", "romance"],
        "streaming": [
            {"platform_slug": "spotify", "type": AvailabilityType.FREE, "pricing": "Free / Spotify Premium", "url": "https://open.spotify.com/search/Arijit%20Singh"},
            {"platform_slug": "apple-music", "type": AvailabilityType.SUBSCRIPTION, "pricing": "Apple Music", "url": "https://music.apple.com/search?term=Arijit%20Singh"},
            {"platform_slug": "jiosaavn", "type": AvailabilityType.FREE, "pricing": "Free to Stream", "url": "https://www.jiosaavn.com/search/Arijit%20Singh"}
        ]
    },
    {
        "title": "The Ranveer Show (TRS)",
        "slug": "the-ranveer-show",
        "content_type": ContentType.PODCAST,
        "description": "India's smartest podcast featuring conversations on science, spirituality, cinema, geopolitics, and human potential.",
        "poster_url": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop",
        "backdrop_url": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200&auto=format&fit=crop",
        "release_date": "2019-12-01",
        "duration_minutes": 75,
        "rating": 8.8,
        "maturity_rating": "U/A",
        "original_language": "hi",
        "is_featured": True,
        "is_free": True,
        "genres": ["podcast", "documentary"],
        "streaming": [
            {"platform_slug": "spotify", "type": AvailabilityType.FREE, "pricing": "Free Stream", "url": "https://open.spotify.com/search/The%20Ranveer%20Show"},
            {"platform_slug": "youtube", "type": AvailabilityType.FREE, "pricing": "Free on YouTube", "url": "https://www.youtube.com/results?search_query=The+Ranveer+Show"}
        ]
    },
    {
        "title": "Huberman Lab: Science of Focus & Sleep",
        "slug": "huberman-lab",
        "content_type": ContentType.PODCAST,
        "description": "Dr. Andrew Huberman discusses neuroscience: how our brain and its connections with the organs of our body control our perceptions, our behaviors, and our health.",
        "poster_url": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop",
        "backdrop_url": "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1200&auto=format&fit=crop",
        "release_date": "2021-01-04",
        "duration_minutes": 90,
        "rating": 9.5,
        "maturity_rating": "All",
        "original_language": "en",
        "is_featured": True,
        "is_free": True,
        "genres": ["podcast", "documentary"],
        "streaming": [
            {"platform_slug": "spotify", "type": AvailabilityType.FREE, "pricing": "Free on Spotify", "url": "https://open.spotify.com/search/Huberman%20Lab"},
            {"platform_slug": "youtube", "type": AvailabilityType.FREE, "pricing": "Free on YouTube", "url": "https://www.youtube.com/results?search_query=Huberman+Lab"}
        ]
    },
    {
        "title": "Kurzgesagt – In a Nutshell: Time & Universe",
        "slug": "kurzgesagt-time-universe",
        "content_type": ContentType.VIDEO,
        "description": "Videos explaining things with optimistic nihilism. We are a small team who want to make science look beautiful.",
        "poster_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop",
        "backdrop_url": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop",
        "release_date": "2013-07-11",
        "duration_minutes": 12,
        "rating": 9.6,
        "maturity_rating": "All",
        "original_language": "en",
        "is_featured": True,
        "is_free": True,
        "genres": ["documentary", "sci-fi"],
        "streaming": [
            {"platform_slug": "youtube", "type": AvailabilityType.FREE, "pricing": "Free 4K Stream", "url": "https://www.youtube.com/c/inanutshell"}
        ]
    }
]

def seed_database(db: Session):
    """Seed categories, platforms, plans, genres, and sample content."""
    logger.info("Starting NEXPLAY database seed...")

    # 1. Seed Categories
    category_map = {}
    for cat_data in CATEGORIES_DATA:
        existing = db.execute(select(PlatformCategory).where(PlatformCategory.slug == cat_data["slug"])).scalar_one_or_none()
        if not existing:
            cat = PlatformCategory(
                id=str(uuid.uuid4()),
                name=cat_data["name"],
                slug=cat_data["slug"],
                icon=cat_data["icon"],
                description=cat_data["description"],
                display_order=cat_data["display_order"]
            )
            db.add(cat)
            db.flush()
            category_map[cat_data["slug"]] = cat.id
            logger.info(f"Seeded category: {cat.name}")
        else:
            category_map[cat_data["slug"]] = existing.id

    # 2. Seed Platforms (40+)
    platform_map = {}
    for p_data in PLATFORMS_DATA:
        existing = db.execute(select(Platform).where(Platform.slug == p_data["slug"])).scalar_one_or_none()
        category_id = category_map.get(p_data["category_slug"])
        if not existing and category_id:
            plat = Platform(
                id=str(uuid.uuid4()),
                category_id=category_id,
                name=p_data["name"],
                slug=p_data["slug"],
                logo_url=p_data["logo_url"],
                official_url=p_data["official_url"],
                description=p_data["description"],
                pricing_type=p_data["pricing_type"],
                integration_type=p_data["integration_type"],
                supported_features=p_data["supported_features"],
                is_active=True,
                region_availability=["IN", "GLOBAL"],
                display_priority=p_data["display_priority"]
            )
            db.add(plat)
            db.flush()
            platform_map[p_data["slug"]] = plat.id
        elif existing:
            platform_map[p_data["slug"]] = existing.id

    # 3. Seed Subscription Plans
    for plan_data in SUBSCRIPTION_PLANS_DATA:
        existing = db.execute(select(SubscriptionPlan).where(SubscriptionPlan.slug == plan_data["slug"])).scalar_one_or_none()
        if not existing:
            plan = SubscriptionPlan(
                id=str(uuid.uuid4()),
                name=plan_data["name"],
                slug=plan_data["slug"],
                price_inr=plan_data["price_inr"],
                billing_cycle=plan_data["billing_cycle"],
                credit_allowance=plan_data["credit_allowance"],
                features=plan_data["features"],
                is_active=True
            )
            db.add(plan)
            logger.info(f"Seeded subscription plan: {plan.name}")

    # 4. Seed Genres
    genre_map = {}
    for g_data in GENRES_DATA:
        existing = db.execute(select(Genre).where(Genre.slug == g_data["slug"])).scalar_one_or_none()
        if not existing:
            g = Genre(
                id=str(uuid.uuid4()),
                name=g_data["name"],
                slug=g_data["slug"],
                category_type=g_data["category_type"]
            )
            db.add(g)
            db.flush()
            genre_map[g_data["slug"]] = g.id
        else:
            genre_map[g_data["slug"]] = existing.id

    # 5. Seed Sample Content & Streaming Links
    for c_data in SAMPLE_CONTENT_DATA:
        existing = db.execute(select(Content).where(Content.slug == c_data["slug"])).scalar_one_or_none()
        if not existing:
            content = Content(
                id=str(uuid.uuid4()),
                title=c_data["title"],
                slug=c_data["slug"],
                content_type=c_data["content_type"],
                description=c_data["description"],
                poster_url=c_data["poster_url"],
                backdrop_url=c_data["backdrop_url"],
                release_date=c_data["release_date"],
                duration_minutes=c_data["duration_minutes"],
                rating=c_data["rating"],
                maturity_rating=c_data["maturity_rating"],
                original_language=c_data["original_language"],
                is_featured=c_data["is_featured"],
                is_free=c_data["is_free"],
            )
            db.add(content)
            db.flush()

            # Genres mapping
            for g_slug in c_data["genres"]:
                g_id = genre_map.get(g_slug)
                if g_id:
                    cg = ContentGenre(content_id=content.id, genre_id=g_id)
                    db.add(cg)

            # Platforms mapping
            for st in c_data["streaming"]:
                plat_id = platform_map.get(st["platform_slug"])
                if plat_id:
                    cp = ContentPlatform(
                        id=str(uuid.uuid4()),
                        content_id=content.id,
                        platform_id=plat_id,
                        availability_type=st["type"],
                        pricing_details=st["pricing"],
                        stream_url=st["url"],
                        region="IN"
                    )
                    db.add(cp)
            logger.info(f"Seeded content: {content.title}")

    db.commit()
    logger.info("NEXPLAY database seed completed successfully!")
