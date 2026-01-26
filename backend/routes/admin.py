"""
Admin routes for TATVGYA
"""
import os
import secrets
import string
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient

from models import (
    UserBase, EducatorProfile, Subject, SubjectResponse, ModerationLog,
    UserResponse, EducatorProfileResponse, ArticleListResponse, PlatformStats
)
from utils.auth import hash_password, require_admin
from utils.email import send_educator_credentials

router = APIRouter(prefix="/admin", tags=["Admin"])

# Database connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


class CreateEducatorRequest(BaseModel):
    email: EmailStr
    name: str
    subject_ids: List[str]
    bio: Optional[str] = None


class UpdateEducatorRequest(BaseModel):
    name: Optional[str] = None
    subject_ids: Optional[List[str]] = None
    bio: Optional[str] = None
    is_approved: Optional[bool] = None
    is_active: Optional[bool] = None


class ArticleActionRequest(BaseModel):
    action: str  # approve, reject
    reason: Optional[str] = None


class ReportActionRequest(BaseModel):
    action: str  # resolve, dismiss
    note: Optional[str] = None


def generate_password(length: int = 12) -> str:
    """Generate a secure random password"""
    chars = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(secrets.choice(chars) for _ in range(length))


# Dashboard & Stats
@router.get("/stats", response_model=PlatformStats)
async def get_platform_stats(current_user: dict = Depends(require_admin)):
    """Get platform statistics"""
    total_articles = await db.articles.count_documents({"status": "published"})
    total_educators = await db.educator_profiles.count_documents({"is_approved": True})
    total_students = await db.student_profiles.count_documents({})
    
    # Sum all views
    pipeline = [
        {"$match": {"status": "published"}},
        {"$group": {"_id": None, "total": {"$sum": "$view_count"}}}
    ]
    views_result = await db.articles.aggregate(pipeline).to_list(1)
    total_views = views_result[0]["total"] if views_result else 0
    
    return PlatformStats(
        total_articles=total_articles,
        total_educators=total_educators,
        total_students=total_students,
        total_views=total_views
    )


@router.get("/dashboard")
async def get_dashboard_data(current_user: dict = Depends(require_admin)):
    """Get comprehensive dashboard data"""
    stats = await get_platform_stats(current_user)
    
    # Pending articles
    pending_articles = await db.articles.count_documents({"status": "pending"})
    
    # Flagged articles
    flagged_articles = await db.articles.count_documents({"is_flagged": True})
    
    # Pending reports
    pending_reports = await db.reports.count_documents({"status": "pending"})
    
    # Pending educator approvals
    pending_educators = await db.educator_profiles.count_documents({"is_approved": False})
    
    # Recent articles
    recent_articles = await db.articles.find(
        {"status": "published"},
        {"_id": 0}
    ).sort([("published_at", -1)]).limit(5).to_list(5)
    
    # Contact queries
    new_queries = await db.contact_queries.count_documents({"status": "new"})
    
    return {
        "stats": stats.model_dump(),
        "pending_articles": pending_articles,
        "flagged_articles": flagged_articles,
        "pending_reports": pending_reports,
        "pending_educators": pending_educators,
        "new_contact_queries": new_queries,
        "recent_articles": recent_articles
    }


# Educator Management
@router.post("/educators", response_model=dict)
async def create_educator(
    educator_data: CreateEducatorRequest,
    current_user: dict = Depends(require_admin)
):
    """Create a new educator account"""
    # Check if email already exists
    existing = await db.users.find_one({"email": educator_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Verify subjects exist
    for sub_id in educator_data.subject_ids:
        subject = await db.subjects.find_one({"subject_id": sub_id}, {"_id": 0})
        if not subject:
            raise HTTPException(status_code=400, detail=f"Invalid subject: {sub_id}")
    
    # Generate password
    password = generate_password()
    
    # Create user
    user = UserBase(
        email=educator_data.email,
        name=educator_data.name,
        password_hash=hash_password(password),
        role="educator"
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['updated_at'] = user_dict['updated_at'].isoformat()
    await db.users.insert_one(user_dict)
    
    # Create educator profile
    profile = EducatorProfile(
        user_id=user.user_id,
        bio=educator_data.bio,
        subject_ids=educator_data.subject_ids,
        is_approved=True  # Admin-created educators are auto-approved
    )
    
    profile_dict = profile.model_dump()
    profile_dict['created_at'] = profile_dict['created_at'].isoformat()
    profile_dict['updated_at'] = profile_dict['updated_at'].isoformat()
    await db.educator_profiles.insert_one(profile_dict)
    
    # Log action
    log = ModerationLog(
        admin_id=current_user["user_id"],
        action="create_educator",
        target_type="user",
        target_id=user.user_id,
        details={"email": educator_data.email, "name": educator_data.name}
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.moderation_logs.insert_one(log_dict)
    
    # Send credentials email (in production)
    await send_educator_credentials(educator_data.email, educator_data.name, password)
    
    return {
        "message": "Educator account created successfully",
        "user_id": user.user_id,
        "profile_id": profile.profile_id,
        "email": educator_data.email,
        "password": password  # Return password for demo purposes
    }


@router.get("/educators", response_model=List[EducatorProfileResponse])
async def list_educators(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    approved: Optional[bool] = None,
    current_user: dict = Depends(require_admin)
):
    """List all educators"""
    skip = (page - 1) * limit
    
    query = {}
    if approved is not None:
        query["is_approved"] = approved
    
    cursor = db.educator_profiles.find(query, {"_id": 0}).skip(skip).limit(limit)
    profiles = await cursor.to_list(limit)
    
    result = []
    for profile in profiles:
        user = await db.users.find_one({"user_id": profile["user_id"]}, {"_id": 0})
        if not user:
            continue
        
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


@router.put("/educators/{educator_id}")
async def update_educator(
    educator_id: str,
    update_data: UpdateEducatorRequest,
    current_user: dict = Depends(require_admin)
):
    """Update educator account"""
    profile = await db.educator_profiles.find_one(
        {"$or": [{"profile_id": educator_id}, {"user_id": educator_id}]},
        {"_id": 0}
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail="Educator not found")
    
    # Verify subjects if provided
    if update_data.subject_ids:
        for sub_id in update_data.subject_ids:
            subject = await db.subjects.find_one({"subject_id": sub_id}, {"_id": 0})
            if not subject:
                raise HTTPException(status_code=400, detail=f"Invalid subject: {sub_id}")
    
    # Update user
    user_update = {}
    if update_data.name:
        user_update["name"] = update_data.name
    if update_data.is_active is not None:
        user_update["is_active"] = update_data.is_active
    
    if user_update:
        user_update["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one(
            {"user_id": profile["user_id"]},
            {"$set": user_update}
        )
    
    # Update profile
    profile_update = {}
    if update_data.subject_ids is not None:
        profile_update["subject_ids"] = update_data.subject_ids
    if update_data.bio is not None:
        profile_update["bio"] = update_data.bio
    if update_data.is_approved is not None:
        profile_update["is_approved"] = update_data.is_approved
    
    if profile_update:
        profile_update["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.educator_profiles.update_one(
            {"profile_id": profile["profile_id"]},
            {"$set": profile_update}
        )
    
    # Log action
    log = ModerationLog(
        admin_id=current_user["user_id"],
        action="update_educator",
        target_type="user",
        target_id=profile["user_id"],
        details={"updates": {**user_update, **profile_update}}
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.moderation_logs.insert_one(log_dict)
    
    return {"message": "Educator updated successfully"}


@router.delete("/educators/{educator_id}")
async def delete_educator(educator_id: str, current_user: dict = Depends(require_admin)):
    """Delete educator account"""
    profile = await db.educator_profiles.find_one(
        {"$or": [{"profile_id": educator_id}, {"user_id": educator_id}]},
        {"_id": 0}
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail="Educator not found")
    
    # Delete profile
    await db.educator_profiles.delete_one({"profile_id": profile["profile_id"]})
    
    # Disable user account (don't fully delete)
    await db.users.update_one(
        {"user_id": profile["user_id"]},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Log action
    log = ModerationLog(
        admin_id=current_user["user_id"],
        action="delete_educator",
        target_type="user",
        target_id=profile["user_id"]
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.moderation_logs.insert_one(log_dict)
    
    return {"message": "Educator deleted successfully"}


# Article Management
@router.get("/articles")
async def list_articles_admin(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, regex="^(draft|pending|published|rejected)$"),
    flagged: Optional[bool] = None,
    current_user: dict = Depends(require_admin)
):
    """List articles for admin review"""
    skip = (page - 1) * limit
    
    query = {}
    if status:
        query["status"] = status
    if flagged is not None:
        query["is_flagged"] = flagged
    
    cursor = db.articles.find(query, {"_id": 0}).sort([("created_at", -1)]).skip(skip).limit(limit)
    articles = await cursor.to_list(limit)
    
    result = []
    for article in articles:
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
        
        result.append({
            **article,
            "author_name": user.get("name", "Unknown") if user else "Unknown",
            "subject_name": subject_doc.get("name", "General") if subject_doc else "General"
        })
    
    return result


@router.post("/articles/{article_id}/action")
async def article_action(
    article_id: str,
    action_data: ArticleActionRequest,
    current_user: dict = Depends(require_admin)
):
    """Approve or reject an article"""
    article = await db.articles.find_one({"article_id": article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    if action_data.action == "approve":
        await db.articles.update_one(
            {"article_id": article_id},
            {"$set": {
                "status": "published",
                "published_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Update subject article count
        await db.subjects.update_one(
            {"subject_id": article["subject_id"]},
            {"$inc": {"article_count": 1}}
        )
        
        message = "Article approved and published"
        
    elif action_data.action == "reject":
        await db.articles.update_one(
            {"article_id": article_id},
            {"$set": {
                "status": "rejected",
                "rejection_reason": action_data.reason,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        message = "Article rejected"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    # Log action
    log = ModerationLog(
        admin_id=current_user["user_id"],
        action=f"{action_data.action}_article",
        target_type="article",
        target_id=article_id,
        details={"reason": action_data.reason} if action_data.reason else None
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.moderation_logs.insert_one(log_dict)
    
    return {"message": message}


# Report Management
@router.get("/reports")
async def list_reports(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, regex="^(pending|reviewed|resolved|dismissed)$"),
    current_user: dict = Depends(require_admin)
):
    """List all reports"""
    skip = (page - 1) * limit
    
    query = {}
    if status:
        query["status"] = status
    
    cursor = db.reports.find(query, {"_id": 0}).sort([("created_at", -1)]).skip(skip).limit(limit)
    reports = await cursor.to_list(limit)
    
    # Enrich with article and reporter info
    for report in reports:
        article = await db.articles.find_one({"article_id": report["article_id"]}, {"_id": 0, "title": 1})
        reporter = await db.users.find_one({"user_id": report["reporter_id"]}, {"_id": 0, "name": 1, "email": 1})
        report["article_title"] = article.get("title") if article else "Unknown"
        report["reporter_name"] = reporter.get("name") if reporter else "Unknown"
        report["reporter_email"] = reporter.get("email") if reporter else "Unknown"
    
    return reports


@router.post("/reports/{report_id}/action")
async def report_action(
    report_id: str,
    action_data: ReportActionRequest,
    current_user: dict = Depends(require_admin)
):
    """Resolve or dismiss a report"""
    report = await db.reports.find_one({"report_id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if action_data.action == "resolve":
        await db.reports.update_one(
            {"report_id": report_id},
            {"$set": {
                "status": "resolved",
                "reviewed_by": current_user["user_id"],
                "resolution_note": action_data.note,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        message = "Report resolved"
        
    elif action_data.action == "dismiss":
        await db.reports.update_one(
            {"report_id": report_id},
            {"$set": {
                "status": "dismissed",
                "reviewed_by": current_user["user_id"],
                "resolution_note": action_data.note,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        message = "Report dismissed"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    # Log action
    log = ModerationLog(
        admin_id=current_user["user_id"],
        action=f"{action_data.action}_report",
        target_type="report",
        target_id=report_id,
        details={"note": action_data.note} if action_data.note else None
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.moderation_logs.insert_one(log_dict)
    
    return {"message": message}


# Contact Query Management
@router.get("/contact-queries")
async def list_contact_queries(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, regex="^(new|read|replied|closed)$"),
    current_user: dict = Depends(require_admin)
):
    """List contact queries"""
    skip = (page - 1) * limit
    
    query = {}
    if status:
        query["status"] = status
    
    cursor = db.contact_queries.find(query, {"_id": 0}).sort([("created_at", -1)]).skip(skip).limit(limit)
    queries = await cursor.to_list(limit)
    
    return queries


@router.put("/contact-queries/{query_id}")
async def update_contact_query(
    query_id: str,
    status: str = Query(..., regex="^(read|replied|closed)$"),
    current_user: dict = Depends(require_admin)
):
    """Update contact query status"""
    result = await db.contact_queries.update_one(
        {"query_id": query_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Query not found")
    
    return {"message": "Query status updated"}


# Moderation Logs
@router.get("/moderation-logs")
async def get_moderation_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(require_admin)
):
    """Get moderation logs"""
    skip = (page - 1) * limit
    
    cursor = db.moderation_logs.find({}, {"_id": 0}).sort([("created_at", -1)]).skip(skip).limit(limit)
    logs = await cursor.to_list(limit)
    
    # Enrich with admin names
    for log in logs:
        admin = await db.users.find_one({"user_id": log["admin_id"]}, {"_id": 0, "name": 1})
        log["admin_name"] = admin.get("name") if admin else "Unknown"
    
    return logs
