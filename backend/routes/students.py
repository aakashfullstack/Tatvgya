"""
Student routes for TATVGYA
"""
import os
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query
from motor.motor_asyncio import AsyncIOMotorClient

from models import ArticleListResponse, StudentProfileResponse, Report, ReportCreate
from utils.auth import get_current_user

router = APIRouter(prefix="/students", tags=["Students"])

# Database connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


@router.get("/me/profile", response_model=StudentProfileResponse)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """Get current student's profile"""
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can access this")
    
    profile = await db.student_profiles.find_one(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
    
    user = await db.users.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    
    # Get interest subjects
    interests = []
    for sub_id in profile.get("interests", []):
        sub = await db.subjects.find_one({"subject_id": sub_id}, {"_id": 0})
        if sub:
            interests.append({"subject_id": sub["subject_id"], "name": sub["name"], "slug": sub["slug"]})
    
    return StudentProfileResponse(
        profile_id=profile["profile_id"],
        user_id=profile["user_id"],
        name=user["name"],
        email=user["email"],
        interests=interests,
        email_verified=profile.get("email_verified", False),
        profile_photo=profile.get("profile_photo")
    )


@router.put("/me/interests")
async def update_interests(
    subject_ids: List[str],
    current_user: dict = Depends(get_current_user)
):
    """Update student's interests"""
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can access this")
    
    # Verify subjects exist
    for sub_id in subject_ids:
        subject = await db.subjects.find_one({"subject_id": sub_id}, {"_id": 0})
        if not subject:
            raise HTTPException(status_code=400, detail=f"Invalid subject: {sub_id}")
    
    await db.student_profiles.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"interests": subject_ids, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Interests updated successfully"}


@router.get("/me/liked", response_model=List[ArticleListResponse])
async def get_liked_articles(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get articles liked by current user"""
    skip = (page - 1) * limit
    
    # Get liked article IDs
    cursor = db.likes.find({"user_id": current_user["user_id"]}, {"_id": 0}).sort([("created_at", -1)]).skip(skip).limit(limit)
    likes = await cursor.to_list(limit)
    
    article_ids = [like["article_id"] for like in likes]
    
    if not article_ids:
        return []
    
    # Get articles
    result = []
    for article_id in article_ids:
        article = await db.articles.find_one({"article_id": article_id, "status": "published"}, {"_id": 0})
        if not article:
            continue
        
        educator = await db.educator_profiles.find_one(
            {"profile_id": article["educator_id"]},
            {"_id": 0}
        )
        user = await db.users.find_one(
            {"user_id": article["user_id"]},
            {"_id": 0}
        ) if educator else None
        
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
            author_photo=educator.get("profile_photo") if educator else None,
            subject_name=subject_doc.get("name", "General") if subject_doc else "General",
            subject_slug=subject_doc.get("slug", "general") if subject_doc else "general",
            view_count=article.get("view_count", 0),
            like_count=article.get("like_count", 0),
            bookmark_count=article.get("bookmark_count", 0),
            reading_time=article.get("reading_time", 5),
            published_at=published_at
        ))
    
    return result


@router.get("/me/bookmarked", response_model=List[ArticleListResponse])
async def get_bookmarked_articles(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get articles bookmarked by current user"""
    skip = (page - 1) * limit
    
    # Get bookmarked article IDs
    cursor = db.bookmarks.find({"user_id": current_user["user_id"]}, {"_id": 0}).sort([("created_at", -1)]).skip(skip).limit(limit)
    bookmarks = await cursor.to_list(limit)
    
    article_ids = [bm["article_id"] for bm in bookmarks]
    
    if not article_ids:
        return []
    
    # Get articles
    result = []
    for article_id in article_ids:
        article = await db.articles.find_one({"article_id": article_id, "status": "published"}, {"_id": 0})
        if not article:
            continue
        
        educator = await db.educator_profiles.find_one(
            {"profile_id": article["educator_id"]},
            {"_id": 0}
        )
        user = await db.users.find_one(
            {"user_id": article["user_id"]},
            {"_id": 0}
        ) if educator else None
        
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
            author_photo=educator.get("profile_photo") if educator else None,
            subject_name=subject_doc.get("name", "General") if subject_doc else "General",
            subject_slug=subject_doc.get("slug", "general") if subject_doc else "general",
            view_count=article.get("view_count", 0),
            like_count=article.get("like_count", 0),
            bookmark_count=article.get("bookmark_count", 0),
            reading_time=article.get("reading_time", 5),
            published_at=published_at
        ))
    
    return result


@router.get("/me/history", response_model=List[ArticleListResponse])
async def get_reading_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get reading history for current user"""
    skip = (page - 1) * limit
    
    # Get viewed article IDs (distinct, most recent first)
    pipeline = [
        {"$match": {"user_id": current_user["user_id"]}},
        {"$sort": {"created_at": -1}},
        {"$group": {"_id": "$article_id", "last_viewed": {"$first": "$created_at"}}},
        {"$sort": {"last_viewed": -1}},
        {"$skip": skip},
        {"$limit": limit}
    ]
    
    views = await db.views.aggregate(pipeline).to_list(limit)
    
    if not views:
        return []
    
    # Get articles
    result = []
    for view in views:
        article = await db.articles.find_one({"article_id": view["_id"], "status": "published"}, {"_id": 0})
        if not article:
            continue
        
        educator = await db.educator_profiles.find_one(
            {"profile_id": article["educator_id"]},
            {"_id": 0}
        )
        user = await db.users.find_one(
            {"user_id": article["user_id"]},
            {"_id": 0}
        ) if educator else None
        
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
            author_photo=educator.get("profile_photo") if educator else None,
            subject_name=subject_doc.get("name", "General") if subject_doc else "General",
            subject_slug=subject_doc.get("slug", "general") if subject_doc else "general",
            view_count=article.get("view_count", 0),
            like_count=article.get("like_count", 0),
            bookmark_count=article.get("bookmark_count", 0),
            reading_time=article.get("reading_time", 5),
            published_at=published_at
        ))
    
    return result


@router.post("/report", response_model=dict)
async def report_article(
    report_data: ReportCreate,
    current_user: dict = Depends(get_current_user)
):
    """Report an article for review"""
    # Verify article exists
    article = await db.articles.find_one({"article_id": report_data.article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Check if user already reported this article
    existing = await db.reports.find_one(
        {"reporter_id": current_user["user_id"], "article_id": report_data.article_id},
        {"_id": 0}
    )
    if existing:
        raise HTTPException(status_code=400, detail="You have already reported this article")
    
    report = Report(
        reporter_id=current_user["user_id"],
        article_id=report_data.article_id,
        reason=report_data.reason,
        description=report_data.description
    )
    
    report_dict = report.model_dump()
    report_dict['created_at'] = report_dict['created_at'].isoformat()
    report_dict['updated_at'] = report_dict['updated_at'].isoformat()
    await db.reports.insert_one(report_dict)
    
    return {"message": "Report submitted successfully", "report_id": report.report_id}
