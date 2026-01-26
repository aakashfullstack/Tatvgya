"""
MongoDB Models for TATVGYA Platform
Designed as a logical relational system on a document store
"""
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Literal
from datetime import datetime, timezone
import uuid


def generate_id(prefix: str = "") -> str:
    """Generate a unique ID with optional prefix"""
    return f"{prefix}{uuid.uuid4().hex[:12]}" if prefix else uuid.uuid4().hex[:12]


# ============== USER MODELS ==============

class UserBase(BaseModel):
    """Base user model for all roles"""
    model_config = ConfigDict(extra="ignore")
    
    user_id: str = Field(default_factory=lambda: generate_id("user_"))
    email: EmailStr
    name: str
    role: Literal["admin", "educator", "student"]
    password_hash: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: Literal["educator", "student"] = "student"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    email: str
    name: str
    role: str
    is_active: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============== EDUCATOR PROFILE ==============

class EducatorProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    profile_id: str = Field(default_factory=lambda: generate_id("edu_"))
    user_id: str  # Reference to users collection
    bio: Optional[str] = None
    profile_photo: Optional[str] = None
    subject_ids: List[str] = []  # References to subjects collection
    social_links: Optional[dict] = None
    is_approved: bool = False
    total_articles: int = 0
    total_views: int = 0
    total_likes: int = 0
    total_bookmarks: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EducatorProfileUpdate(BaseModel):
    bio: Optional[str] = None
    profile_photo: Optional[str] = None
    social_links: Optional[dict] = None


class EducatorProfileResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    profile_id: str
    user_id: str
    name: str
    email: str
    bio: Optional[str]
    profile_photo: Optional[str]
    subjects: List[dict] = []
    social_links: Optional[dict]
    is_approved: bool
    total_articles: int
    total_views: int
    total_likes: int
    total_bookmarks: int


# ============== STUDENT PROFILE ==============

class StudentProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    profile_id: str = Field(default_factory=lambda: generate_id("stu_"))
    user_id: str  # Reference to users collection
    interests: List[str] = []  # subject_ids
    email_verified: bool = False
    google_id: Optional[str] = None
    profile_photo: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StudentProfileResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    profile_id: str
    user_id: str
    name: str
    email: str
    interests: List[dict] = []
    email_verified: bool
    profile_photo: Optional[str]


# ============== SUBJECT MODELS ==============

class Subject(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    subject_id: str = Field(default_factory=lambda: generate_id("sub_"))
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    article_count: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SubjectResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    subject_id: str
    name: str
    slug: str
    description: Optional[str]
    icon: Optional[str]
    color: Optional[str]
    article_count: int


# ============== ARTICLE MODELS ==============

class Article(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    article_id: str = Field(default_factory=lambda: generate_id("art_"))
    title: str
    slug: str
    content: str  # Rich text/HTML content
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    educator_id: str  # Reference to educator_profiles
    user_id: str  # Reference to users (author)
    subject_id: str  # Reference to subjects
    tags: List[str] = []
    status: Literal["draft", "pending", "published", "rejected"] = "draft"
    rejection_reason: Optional[str] = None
    is_flagged: bool = False
    flag_reason: Optional[str] = None
    view_count: int = 0
    like_count: int = 0
    bookmark_count: int = 0
    reading_time: int = 5  # minutes
    originality_confirmed: bool = False
    published_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ArticleCreate(BaseModel):
    title: str
    content: str
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    subject_id: str
    tags: List[str] = []
    status: Literal["draft", "pending"] = "draft"
    originality_confirmed: bool = False


class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    subject_id: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[Literal["draft", "pending"]] = None
    originality_confirmed: Optional[bool] = None


class ArticleResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    article_id: str
    title: str
    slug: str
    content: str
    excerpt: Optional[str]
    cover_image: Optional[str]
    educator_id: str
    author_name: str
    author_photo: Optional[str]
    subject: dict
    tags: List[str]
    status: str
    view_count: int
    like_count: int
    bookmark_count: int
    reading_time: int
    published_at: Optional[datetime]
    created_at: datetime
    is_liked: bool = False
    is_bookmarked: bool = False


class ArticleListResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    article_id: str
    title: str
    slug: str
    excerpt: Optional[str]
    cover_image: Optional[str]
    author_name: str
    author_photo: Optional[str]
    subject_name: str
    subject_slug: str
    view_count: int
    like_count: int
    bookmark_count: int
    reading_time: int
    published_at: Optional[datetime]


# ============== INTERACTION MODELS ==============

class Like(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    like_id: str = Field(default_factory=lambda: generate_id("like_"))
    user_id: str
    article_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Bookmark(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    bookmark_id: str = Field(default_factory=lambda: generate_id("bm_"))
    user_id: str
    article_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class View(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    view_id: str = Field(default_factory=lambda: generate_id("view_"))
    user_id: Optional[str] = None  # Can be anonymous
    article_id: str
    session_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============== REPORT MODELS ==============

class Report(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    report_id: str = Field(default_factory=lambda: generate_id("rep_"))
    reporter_id: str  # user_id of reporter
    article_id: str
    reason: Literal["copyright", "abuse", "spam", "misinformation", "other"]
    description: Optional[str] = None
    status: Literal["pending", "reviewed", "resolved", "dismissed"] = "pending"
    reviewed_by: Optional[str] = None  # admin user_id
    resolution_note: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReportCreate(BaseModel):
    article_id: str
    reason: Literal["copyright", "abuse", "spam", "misinformation", "other"]
    description: Optional[str] = None


# ============== MODERATION LOG ==============

class ModerationLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    log_id: str = Field(default_factory=lambda: generate_id("mod_"))
    admin_id: str
    action: str  # approve_article, reject_article, flag_content, etc.
    target_type: str  # article, user, report
    target_id: str
    details: Optional[dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============== CONTACT QUERY ==============

class ContactQuery(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    query_id: str = Field(default_factory=lambda: generate_id("cq_"))
    name: str
    email: EmailStr
    subject: str
    message: str
    status: Literal["new", "read", "replied", "closed"] = "new"
    replied_by: Optional[str] = None
    reply_message: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ContactQueryCreate(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


# ============== SESSION MODELS ==============

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    session_id: str = Field(default_factory=lambda: generate_id("sess_"))
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class OTPVerification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    otp_id: str = Field(default_factory=lambda: generate_id("otp_"))
    email: EmailStr
    otp_code: str
    purpose: Literal["signup", "reset_password"]
    expires_at: datetime
    is_used: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============== ANALYTICS ==============

class PlatformStats(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    total_articles: int = 0
    total_educators: int = 0
    total_students: int = 0
    total_views: int = 0
