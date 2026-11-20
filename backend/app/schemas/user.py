from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.user import UserRole

class UserProfileRead(BaseModel):
    id: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    country_code: str
    preferred_language: str

    model_config = ConfigDict(from_attributes=True)

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    country_code: Optional[str] = None
    preferred_language: Optional[str] = None

class UserPreferenceRead(BaseModel):
    favorite_genres: List[str] = []
    preferred_languages: List[str] = ["Hindi", "English"]
    connected_platforms_filter: List[str] = []
    mood_tags: List[str] = []

    model_config = ConfigDict(from_attributes=True)

class UserPreferenceUpdate(BaseModel):
    favorite_genres: Optional[List[str]] = None
    preferred_languages: Optional[List[str]] = None
    connected_platforms_filter: Optional[List[str]] = None
    mood_tags: Optional[List[str]] = None

class WalletRead(BaseModel):
    balance_credits: int
    lifetime_earned: int
    lifetime_spent: int

    model_config = ConfigDict(from_attributes=True)

class UserRead(BaseModel):
    id: str
    email: EmailStr
    role: UserRole
    is_active: bool
    is_verified: bool
    profile: Optional[UserProfileRead] = None
    wallet: Optional[WalletRead] = None

    model_config = ConfigDict(from_attributes=True)

class DetailedUserRead(UserRead):
    preferences: Optional[UserPreferenceRead] = None
