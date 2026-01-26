"""
Educator routes for TATVGYA
"""
import os
import re
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query
from motor.motor_asyncio import AsyncIOMotorClient

from models import (
    Article, ArticleCreate, ArticleUpdate, ArticleListResponse,
    EducatorProfile, EducatorProfileUpdate, EducatorProfileResponse
)
from utils.auth import get_current_user, require_educator
from utils.moderation import moderate_article

router = APIRouter(prefix="/educators", tags=["Educators"])

# Database connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


def create_slug(title: str, suffix: str = "") -> str:
    """Create URL-friendly slug from title"""
    slug = title.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    if suffix:
        slug = f"{slug}-{suffix}"
    return slug


def calculate_reading_time(content: str) -> int:
    """Calculate reading time in minutes"""
    word_count = len(content.split())
    return max(1, round(word_count / 200))


@router.get("/", response_model=List[EducatorProfileResponse])
async def get_educators(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    subject: Optional[str] = None
):
    """Get all approved educators"""
    skip = (page - 1) * limit
    
    query = {"is_approved": True}
    
    if subject:
        subject_doc = await db.subjects.find_one(
            {"$or": [{"slug": subject}, {"subject_id": subject}]},
            {"_id": 0}
        )
        if subject_doc:
            query["subject_ids"] = subject_doc["subject_id"]
    
    cursor = db.educator_profiles.find(query, {"_id": 0}).skip(skip).limit(limit)
    profiles = await cursor.to_list(limit)
    
    result = []
    for profile in profiles:
        user = await db.users.find_one({"user_id": profile["user_id"]}, {"_id": 0})
        if not user:
            continue
        
        # Get subjects
        subjects = []
        for sub_id in profile.get("subject_ids", []):
            sub = await db.subjects.find_one({"subject_id": sub_id}, {"_id": 0})
            if sub:
                subjects.append({"subject_id": sub["subject_id"], "name": sub["name"], "slug": sub["slug"]})
        
        result.append(EducatorProfileResponse(
            profile_id=profile["profile_id"],
            user_id=profile["user_id"],
            name=user["name"],
            email=user["email"],
            bio=profile.get("bio"),
            profile_photo=profile.get("profile_photo"),
            subjects=subjects,
            social_links=profile.get("social_links"),
            is_approved=profile["is_approved"],
            total_articles=profile.get("total_articles", 0),
            total_views=profile.get("total_views", 0),
            total_likes=profile.get("total_likes", 0),
            total_bookmarks=profile.get("total_bookmarks", 0)
        ))
    
    return result


@router.get("/{educator_id}", response_model=EducatorProfileResponse)
async def get_educator(educator_id: str):
    """Get single educator profile"""
    profile = await db.educator_profiles.find_one(
        {"$or": [{"profile_id": educator_id}, {"user_id": educator_id}]},
        {"_id": 0}
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail="Educator not found")
    
    user = await db.users.find_one({"user_id": profile["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get subjects
    subjects = []
    for sub_id in profile.get("subject_ids", []):
        sub = await db.subjects.find_one({"subject_id": sub_id}, {"_id": 0})
        if sub:
            subjects.append({"subject_id": sub["subject_id"], "name": sub["name"], "slug": sub["slug"]})
    
    return EducatorProfileResponse(
        profile_id=profile["profile_id"],
        user_id=profile["user_id"],
        name=user["name"],
        email=user["email"],
        bio=profile.get("bio"),
        profile_photo=profile.get("profile_photo"),
        subjects=subjects,
        social_links=profile.get("social_links"),
        is_approved=profile["is_approved"],
        total_articles=profile.get("total_articles", 0),
        total_views=profile.get("total_views", 0),
        total_likes=profile.get("total_likes", 0),
        total_bookmarks=profile.get("total_bookmarks", 0)
    )


@router.get("/{educator_id}/articles", response_model=List[ArticleListResponse])
async def get_educator_articles(
    educator_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query("published", regex="^(draft|pending|published|rejected|all)$")
):
    """Get articles by educator"""
    skip = (page - 1) * limit
    
    profile = await db.educator_profiles.find_one(
        {"$or": [{"profile_id": educator_id}, {"user_id": educator_id}]},
        {"_id": 0}
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail="Educator not found")
    
    query = {"educator_id": profile["profile_id"]}
    if status != "all":
        query["status"] = status
    
    cursor = db.articles.find(query, {"_id": 0}).sort([("created_at", -1)]).skip(skip).limit(limit)
    articles = await cursor.to_list(limit)
    
    user = await db.users.find_one({"user_id": profile["user_id"]}, {"_id": 0})
    
    result = []
    for article in articles:
        subject_doc = await db.subjects.find_one(
            {"subject_id": article["subject_id"]},
            {"_id": 0}
        )
        
        published_at = article.get('published_at')
        if isinstance(published_at, str):
            published_at = datetime.fromisoformat(published_at)
        
        result.append(ArticleListResponse(
            article_id=article["article_id"],
            title=article["title"],
            slug=article["slug"],
            excerpt=article.get("excerpt"),
            cover_image=article.get("cover_image"),
            author_name=user.get("name", "Unknown") if user else "Unknown",
            author_photo=profile.get("profile_photo"),
            subject_name=subject_doc.get("name", "General") if subject_doc else "General",
            subject_slug=subject_doc.get("slug", "general") if subject_doc else "general",
            view_count=article.get("view_count", 0),
            like_count=article.get("like_count", 0),
            bookmark_count=article.get("bookmark_count", 0),
            reading_time=article.get("reading_time", 5),
            published_at=published_at
        ))
    
    return result


# CMS Routes for Educators
@router.get("/me/profile", response_model=EducatorProfileResponse)
async def get_my_profile(current_user: dict = Depends(require_educator)):
    """Get current educator's profile"""
    profile = await db.educator_profiles.find_one(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail="Educator profile not found")
    
    user = await db.users.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    
    # Get subjects
    subjects = []
    for sub_id in profile.get("subject_ids", []):
        sub = await db.subjects.find_one({"subject_id": sub_id}, {"_id": 0})
        if sub:
            subjects.append({"subject_id": sub["subject_id"], "name": sub["name"], "slug": sub["slug"]})
    
    return EducatorProfileResponse(
        profile_id=profile["profile_id"],
        user_id=profile["user_id"],
        name=user["name"],
        email=user["email"],
        bio=profile.get("bio"),
        profile_photo=profile.get("profile_photo"),
        subjects=subjects,
        social_links=profile.get("social_links"),
        is_approved=profile["is_approved"],
        total_articles=profile.get("total_articles", 0),
        total_views=profile.get("total_views", 0),
        total_likes=profile.get("total_likes", 0),
        total_bookmarks=profile.get("total_bookmarks", 0)
    )


@router.put("/me/profile", response_model=EducatorProfileResponse)
async def update_my_profile(
    update_data: EducatorProfileUpdate,
    current_user: dict = Depends(require_educator)
):
    """Update current educator's profile"""
    profile = await db.educator_profiles.find_one(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail="Educator profile not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.educator_profiles.update_one(
        {"profile_id": profile["profile_id"]},
        {"$set": update_dict}
    )
    
    return await get_my_profile(current_user)


@router.get("/me/articles", response_model=List[ArticleListResponse])
async def get_my_articles(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query("all", regex="^(draft|pending|published|rejected|all)$"),
    current_user: dict = Depends(require_educator)
):
    """Get current educator's articles"""
    profile = await db.educator_profiles.find_one(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail="Educator profile not found")
    
    return await get_educator_articles(profile["profile_id"], page, limit, status)


@router.post("/me/articles", response_model=dict)
async def create_article(
    article_data: ArticleCreate,
    current_user: dict = Depends(require_educator)
):
    """Create a new article"""
    profile = await db.educator_profiles.find_one(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail="Educator profile not found")
    
    if not profile.get("is_approved"):
        raise HTTPException(status_code=403, detail="Your profile is not yet approved")
    
    # Verify subject exists and educator is assigned to it
    subject = await db.subjects.find_one({"subject_id": article_data.subject_id}, {"_id": 0})
    if not subject:
        raise HTTPException(status_code=400, detail="Invalid subject")
    
    if article_data.subject_id not in profile.get("subject_ids", []):
        raise HTTPException(status_code=403, detail="You are not assigned to this subject")
    
    # Create slug
    slug = create_slug(article_data.title)
    existing = await db.articles.find_one({"slug": slug}, {"_id": 0})
    if existing:
        import uuid
        slug = create_slug(article_data.title, uuid.uuid4().hex[:6])
    
    # Moderate content
    moderation_result = moderate_article(
        article_data.title,
        article_data.content,
        article_data.excerpt or ""
    )
    
    article = Article(
        title=article_data.title,
        slug=slug,
        content=article_data.content,
        excerpt=article_data.excerpt,
        cover_image=article_data.cover_image,
        educator_id=profile["profile_id"],
        user_id=current_user["user_id"],
        subject_id=article_data.subject_id,
        tags=article_data.tags,
        status=article_data.status,
        reading_time=calculate_reading_time(article_data.content),
        originality_confirmed=article_data.originality_confirmed,
        is_flagged=moderation_result["is_flagged"],
        flag_reason=moderation_result["reason"]
    )
    
    article_dict = article.model_dump()
    article_dict['created_at'] = article_dict['created_at'].isoformat()
    article_dict['updated_at'] = article_dict['updated_at'].isoformat()
    if article_dict.get('published_at'):
        article_dict['published_at'] = article_dict['published_at'].isoformat()
    
    await db.articles.insert_one(article_dict)
    
    # Update educator article count
    await db.educator_profiles.update_one(
        {"profile_id": profile["profile_id"]},
        {"$inc": {"total_articles": 1}}
    )
    
    return {
        "message": "Article created successfully",
        "article_id": article.article_id,
        "status": article.status,
        "is_flagged": moderation_result["is_flagged"],
        "moderation_note": moderation_result["reason"] if moderation_result["is_flagged"] else None
    }


@router.put("/me/articles/{article_id}", response_model=dict)
async def update_article(
    article_id: str,
    update_data: ArticleUpdate,
    current_user: dict = Depends(require_educator)
):
    """Update an article"""
    article = await db.articles.find_one(
        {"article_id": article_id, "user_id": current_user["user_id"]},
        {"_id": 0}
    )
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    if article["status"] == "published":
        raise HTTPException(status_code=400, detail="Cannot edit published articles. Contact admin.")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    # If subject changed, verify assignment
    if "subject_id" in update_dict:
        profile = await db.educator_profiles.find_one(
            {"user_id": current_user["user_id"]},
            {"_id": 0}
        )
        if update_dict["subject_id"] not in profile.get("subject_ids", []):
            raise HTTPException(status_code=403, detail="You are not assigned to this subject")
    
    # Re-moderate if content changed
    if "content" in update_dict or "title" in update_dict:
        moderation_result = moderate_article(
            update_dict.get("title", article["title"]),
            update_dict.get("content", article["content"]),
            update_dict.get("excerpt", article.get("excerpt", ""))
        )
        update_dict["is_flagged"] = moderation_result["is_flagged"]
        update_dict["flag_reason"] = moderation_result["reason"]
    
    if "content" in update_dict:
        update_dict["reading_time"] = calculate_reading_time(update_dict["content"])
    
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.articles.update_one(
        {"article_id": article_id},
        {"$set": update_dict}
    )
    
    return {"message": "Article updated successfully", "article_id": article_id}


@router.delete("/me/articles/{article_id}")
async def delete_article(article_id: str, current_user: dict = Depends(require_educator)):
    """Delete a draft article"""
    article = await db.articles.find_one(
        {"article_id": article_id, "user_id": current_user["user_id"]},
        {"_id": 0}
    )
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    if article["status"] == "published":
        raise HTTPException(status_code=400, detail="Cannot delete published articles")
    
    await db.articles.delete_one({"article_id": article_id})
    
    # Update educator article count
    profile = await db.educator_profiles.find_one(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    )
    if profile:
        await db.educator_profiles.update_one(
            {"profile_id": profile["profile_id"]},
            {"$inc": {"total_articles": -1}}
        )
    
    return {"message": "Article deleted successfully"}


@router.get("/me/stats")
async def get_my_stats(current_user: dict = Depends(require_educator)):
    """Get current educator's statistics"""
    profile = await db.educator_profiles.find_one(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail="Educator profile not found")
    
    # Get article counts by status
    draft_count = await db.articles.count_documents({"educator_id": profile["profile_id"], "status": "draft"})
    pending_count = await db.articles.count_documents({"educator_id": profile["profile_id"], "status": "pending"})
    published_count = await db.articles.count_documents({"educator_id": profile["profile_id"], "status": "published"})
    rejected_count = await db.articles.count_documents({"educator_id": profile["profile_id"], "status": "rejected"})
    
    return {
        "total_articles": profile.get("total_articles", 0),
        "total_views": profile.get("total_views", 0),
        "total_likes": profile.get("total_likes", 0),
        "total_bookmarks": profile.get("total_bookmarks", 0),
        "draft_count": draft_count,
        "pending_count": pending_count,
        "published_count": published_count,
        "rejected_count": rejected_count
    }
