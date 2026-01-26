"""
Subject and Contact routes for TATVGYA
"""
import os
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient

from models import Subject, SubjectResponse, ContactQuery, ContactQueryCreate
from utils.auth import require_admin
from utils.email import send_contact_notification

router = APIRouter(tags=["Subjects & Contact"])

# Database connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


# Subject Routes
@router.get("/subjects", response_model=List[SubjectResponse])
async def get_subjects():
    """Get all active subjects"""
    cursor = db.subjects.find({"is_active": True}, {"_id": 0}).sort([("name", 1)])
    subjects = await cursor.to_list(100)
    return subjects


@router.get("/subjects/{subject_id}", response_model=SubjectResponse)
async def get_subject(subject_id: str):
    """Get single subject by ID or slug"""
    subject = await db.subjects.find_one(
        {"$or": [{"subject_id": subject_id}, {"slug": subject_id}], "is_active": True},
        {"_id": 0}
    )
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    return subject


# Contact Routes
@router.post("/contact", response_model=dict)
async def submit_contact(query_data: ContactQueryCreate):
    """Submit a contact query"""
    query = ContactQuery(
        name=query_data.name,
        email=query_data.email,
        subject=query_data.subject,
        message=query_data.message
    )
    
    query_dict = query.model_dump()
    query_dict['created_at'] = query_dict['created_at'].isoformat()
    query_dict['updated_at'] = query_dict['updated_at'].isoformat()
    await db.contact_queries.insert_one(query_dict)
    
    # Send notification to admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@tatvgya.com")
    await send_contact_notification(admin_email, query_dict)
    
    return {"message": "Your query has been submitted successfully", "query_id": query.query_id}
