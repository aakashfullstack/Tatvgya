"""
Article routes for TATVGYA
"""
import os
import re
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query
from motor.motor_asyncio import AsyncIOMotorClient

from models import (
    Article, ArticleCreate, ArticleUpdate, ArticleResponse, ArticleListResponse,
    Like, Bookmark, View
)
from utils.auth import get_current_user, get_optional_user, require_educator
from utils.moderation import moderate_article

router = APIRouter(prefix="/articles", tags=["Articles"])

# Database connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


def create_slug(title: str) -> str:
    """Create URL-friendly slug from title"""
    slug = title.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')


def calculate_reading_time(content: str) -> int:
    """Calculate reading time in minutes"""
    word_count = len(content.split())
    return max(1, round(word_count / 200))


@router.get("/", response_model=List[ArticleListResponse])
async def get_articles(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    subject: Optional[str] = None,
    sort: Optional[str] = Query("recent", regex="^(recent|trending|views|likes)$"),
    search: Optional[str] = None,
    author: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """Get published articles with filters"""
    skip = (page - 1) * limit
    
    # Build query
    query = {"status": "published"}
    
    if subject:
        # Find subject by slug or id
        subject_doc = await db.subjects.find_one(
            {"$or": [{"slug": subject}, {"subject_id": subject}]},
            {"_id": 0}
        )
        if subject_doc:
            query["subject_id"] = subject_doc["subject_id"]
    
    if author:
        query["educator_id"] = author
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"excerpt": {"$regex": search, "$options": "i"}},
            {"tags": {"$elemMatch": {"$regex": search, "$options": "i"}}}
        ]
    
    # Build sort
    sort_options = {
        "recent": [("published_at", -1)],
        "trending": [("view_count", -1), ("published_at", -1)],
        "views": [("view_count", -1)],
        "likes": [("like_count", -1)]
    }
    
    sort_by = sort_options.get(sort, [("published_at", -1)])
    
    # Fetch articles
    cursor = db.articles.find(query, {"_id": 0}).sort(sort_by).skip(skip).limit(limit)
    articles = await cursor.to_list(limit)
    
    # Enrich with author and subject info
    result = []
    for article in articles:
        # Get educator profile
        educator = await db.educator_profiles.find_one(
            {"profile_id": article["educator_id"]},
            {"_id": 0}
        )
        user = await db.users.find_one(
            {"user_id": article["user_id"]},
            {"_id": 0}
        ) if educator else None
        
        # Get subject
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


@router.get("/{article_id_or_slug}", response_model=ArticleResponse)
async def get_article(
    article_id_or_slug: str,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """Get single article by ID or slug"""
    article = await db.articles.find_one(
        {"$or": [{"article_id": article_id_or_slug}, {"slug": article_id_or_slug}], "status": "published"},
        {"_id": 0}
    )
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Increment view count
    await db.articles.update_one(
        {"article_id": article["article_id"]},
        {"$inc": {"view_count": 1}}
    )
    
    # Record view
    view = View(
        article_id=article["article_id"],
        user_id=current_user.get("user_id") if current_user else None
    )
    view_dict = view.model_dump()
    view_dict['created_at'] = view_dict['created_at'].isoformat()
    await db.views.insert_one(view_dict)
    
    # Update educator stats
    await db.educator_profiles.update_one(
        {"profile_id": article["educator_id"]},
        {"$inc": {"total_views": 1}}
    )
    
    # Get educator and user info
    educator = await db.educator_profiles.find_one(
        {"profile_id": article["educator_id"]},
        {"_id": 0}
    )
    user = await db.users.find_one(
        {"user_id": article["user_id"]},
        {"_id": 0}
    ) if educator else None
    
    # Get subject
    subject_doc = await db.subjects.find_one(
        {"subject_id": article["subject_id"]},
        {"_id": 0}
    )
    
    # Check if user liked/bookmarked
    is_liked = False
    is_bookmarked = False
    if current_user:
        like = await db.likes.find_one(
            {"user_id": current_user["user_id"], "article_id": article["article_id"]},
            {"_id": 0}
        )
        is_liked = like is not None
        
        bookmark = await db.bookmarks.find_one(
            {"user_id": current_user["user_id"], "article_id": article["article_id"]},
            {"_id": 0}
        )
        is_bookmarked = bookmark is not None
    
    published_at = article.get('published_at')
    if isinstance(published_at, str):
        published_at = datetime.fromisoformat(published_at)
    
    created_at = article.get('created_at')
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    
    return ArticleResponse(
        article_id=article["article_id"],
        title=article["title"],
        slug=article["slug"],
        content=article["content"],
        excerpt=article.get("excerpt"),
        cover_image=article.get("cover_image"),
        educator_id=article["educator_id"],
        author_name=user.get("name", "Unknown") if user else "Unknown",
        author_photo=educator.get("profile_photo") if educator else None,
        subject=subject_doc or {"subject_id": "", "name": "General", "slug": "general"},
        tags=article.get("tags", []),
        status=article["status"],
        view_count=article.get("view_count", 0) + 1,
        like_count=article.get("like_count", 0),
        bookmark_count=article.get("bookmark_count", 0),
        reading_time=article.get("reading_time", 5),
        published_at=published_at,
        created_at=created_at,
        is_liked=is_liked,
        is_bookmarked=is_bookmarked
    )


@router.post("/{article_id}/like")
async def like_article(article_id: str, current_user: dict = Depends(get_current_user)):
    """Like an article"""
    article = await db.articles.find_one({"article_id": article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Check if already liked
    existing = await db.likes.find_one(
        {"user_id": current_user["user_id"], "article_id": article_id},
        {"_id": 0}
    )
    
    if existing:
        # Unlike
        await db.likes.delete_one({"like_id": existing["like_id"]})
        await db.articles.update_one(
            {"article_id": article_id},
            {"$inc": {"like_count": -1}}
        )
        await db.educator_profiles.update_one(
            {"profile_id": article["educator_id"]},
            {"$inc": {"total_likes": -1}}
        )
        return {"liked": False, "like_count": article.get("like_count", 1) - 1}
    else:
        # Like
        like = Like(user_id=current_user["user_id"], article_id=article_id)
        like_dict = like.model_dump()
        like_dict['created_at'] = like_dict['created_at'].isoformat()
        await db.likes.insert_one(like_dict)
        await db.articles.update_one(
            {"article_id": article_id},
            {"$inc": {"like_count": 1}}
        )
        await db.educator_profiles.update_one(
            {"profile_id": article["educator_id"]},
            {"$inc": {"total_likes": 1}}
        )
        return {"liked": True, "like_count": article.get("like_count", 0) + 1}


@router.post("/{article_id}/bookmark")
async def bookmark_article(article_id: str, current_user: dict = Depends(get_current_user)):
    """Bookmark an article"""
    article = await db.articles.find_one({"article_id": article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Check if already bookmarked
    existing = await db.bookmarks.find_one(
        {"user_id": current_user["user_id"], "article_id": article_id},
        {"_id": 0}
    )
    
    if existing:
        # Remove bookmark
        await db.bookmarks.delete_one({"bookmark_id": existing["bookmark_id"]})
        await db.articles.update_one(
            {"article_id": article_id},
            {"$inc": {"bookmark_count": -1}}
        )
        await db.educator_profiles.update_one(
            {"profile_id": article["educator_id"]},
            {"$inc": {"total_bookmarks": -1}}
        )
        return {"bookmarked": False, "bookmark_count": article.get("bookmark_count", 1) - 1}
    else:
        # Bookmark
        bookmark = Bookmark(user_id=current_user["user_id"], article_id=article_id)
        bookmark_dict = bookmark.model_dump()
        bookmark_dict['created_at'] = bookmark_dict['created_at'].isoformat()
        await db.bookmarks.insert_one(bookmark_dict)
        await db.articles.update_one(
            {"article_id": article_id},
            {"$inc": {"bookmark_count": 1}}
        )
        await db.educator_profiles.update_one(
            {"profile_id": article["educator_id"]},
            {"$inc": {"total_bookmarks": 1}}
        )
        return {"bookmarked": True, "bookmark_count": article.get("bookmark_count", 0) + 1}


@router.get("/related/{article_id}", response_model=List[ArticleListResponse])
async def get_related_articles(article_id: str, limit: int = Query(4, ge=1, le=10)):
    """Get related articles based on subject and tags"""
    article = await db.articles.find_one({"article_id": article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Find related articles by same subject or tags
    query = {
        "status": "published",
        "article_id": {"$ne": article_id},
        "$or": [
            {"subject_id": article["subject_id"]},
            {"tags": {"$in": article.get("tags", [])}}
        ]
    }
    
    cursor = db.articles.find(query, {"_id": 0}).sort([("like_count", -1)]).limit(limit)
    articles = await cursor.to_list(limit)
    
    result = []
    for art in articles:
        educator = await db.educator_profiles.find_one(
            {"profile_id": art["educator_id"]},
            {"_id": 0}
        )
        user = await db.users.find_one(
            {"user_id": art["user_id"]},
            {"_id": 0}
        ) if educator else None
        
        subject_doc = await db.subjects.find_one(
            {"subject_id": art["subject_id"]},
            {"_id": 0}
        )
        
        published_at = art.get('published_at')
        if isinstance(published_at, str):
            published_at = datetime.fromisoformat(published_at)
        
        result.append(ArticleListResponse(
            article_id=art["article_id"],
            title=art["title"],
            slug=art["slug"],
            excerpt=art.get("excerpt"),
            cover_image=art.get("cover_image"),
            author_name=user.get("name", "Unknown") if user else "Unknown",
            author_photo=educator.get("profile_photo") if educator else None,
            subject_name=subject_doc.get("name", "General") if subject_doc else "General",
            subject_slug=subject_doc.get("slug", "general") if subject_doc else "general",
            view_count=art.get("view_count", 0),
            like_count=art.get("like_count", 0),
            bookmark_count=art.get("bookmark_count", 0),
            reading_time=art.get("reading_time", 5),
            published_at=published_at
        ))
    
    return result
