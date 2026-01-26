"""
Authentication routes for TATVGYA
"""
import os
import random
import string
import httpx
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Response, Request, Depends
from motor.motor_asyncio import AsyncIOMotorClient

from models import (
    UserBase, UserCreate, UserLogin, UserResponse, TokenResponse,
    StudentProfile, OTPVerification, UserSession
)
from utils.auth import (
    hash_password, verify_password, create_token, decode_token,
    get_current_user, get_optional_user
)
from utils.email import send_otp_email

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Database connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


def generate_otp() -> str:
    """Generate a 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))


@router.post("/register", response_model=dict)
async def register_student(user_data: UserCreate):
    """Register a new student account - sends OTP for verification"""
    # Check if email already exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate and save OTP
    otp_code = generate_otp()
    otp_doc = OTPVerification(
        email=user_data.email,
        otp_code=otp_code,
        purpose="signup",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)
    )
    
    # Store pending registration data
    pending_data = {
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "otp_id": otp_doc.otp_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.pending_registrations.delete_many({"email": user_data.email})
    await db.pending_registrations.insert_one(pending_data)
    
    # Save OTP
    otp_dict = otp_doc.model_dump()
    otp_dict['expires_at'] = otp_dict['expires_at'].isoformat()
    otp_dict['created_at'] = otp_dict['created_at'].isoformat()
    await db.otp_verifications.insert_one(otp_dict)
    
    # Send OTP email
    await send_otp_email(user_data.email, otp_code, "signup")
    
    return {"message": "OTP sent to your email. Please verify to complete registration.", "email": user_data.email}


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(email: str, otp_code: str, response: Response):
    """Verify OTP and complete registration"""
    # Find the OTP
    otp_doc = await db.otp_verifications.find_one(
        {"email": email, "otp_code": otp_code, "is_used": False, "purpose": "signup"},
        {"_id": 0}
    )
    
    if not otp_doc:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Check expiration
    expires_at = datetime.fromisoformat(otp_doc['expires_at'])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP has expired")
    
    # Mark OTP as used
    await db.otp_verifications.update_one(
        {"otp_id": otp_doc['otp_id']},
        {"$set": {"is_used": True}}
    )
    
    # Get pending registration
    pending = await db.pending_registrations.find_one({"email": email}, {"_id": 0})
    if not pending:
        raise HTTPException(status_code=400, detail="Registration data not found")
    
    # Create user
    user = UserBase(
        email=email,
        name=pending['name'],
        password_hash=pending['password_hash'],
        role="student"
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['updated_at'] = user_dict['updated_at'].isoformat()
    await db.users.insert_one(user_dict)
    
    # Create student profile
    student_profile = StudentProfile(
        user_id=user.user_id,
        email_verified=True
    )
    profile_dict = student_profile.model_dump()
    profile_dict['created_at'] = profile_dict['created_at'].isoformat()
    profile_dict['updated_at'] = profile_dict['updated_at'].isoformat()
    await db.student_profiles.insert_one(profile_dict)
    
    # Clean up
    await db.pending_registrations.delete_one({"email": email})
    
    # Create token
    token = create_token(user.user_id, user.role, user.email)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            user_id=user.user_id,
            email=user.email,
            name=user.name,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at
        )
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, response: Response):
    """Login with email and password"""
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user_doc.get('password_hash'):
        raise HTTPException(status_code=401, detail="Please use Google Sign-In")
    
    if not verify_password(credentials.password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user_doc.get('is_active', True):
        raise HTTPException(status_code=403, detail="Account is disabled")
    
    # Create token
    token = create_token(user_doc['user_id'], user_doc['role'], user_doc['email'])
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    # Parse dates
    created_at = user_doc.get('created_at')
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            user_id=user_doc['user_id'],
            email=user_doc['email'],
            name=user_doc['name'],
            role=user_doc['role'],
            is_active=user_doc.get('is_active', True),
            created_at=created_at
        )
    )


@router.post("/google-callback", response_model=TokenResponse)
async def google_callback(session_id: str, response: Response):
    """Handle Google OAuth callback via Emergent Auth"""
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            google_data = resp.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Auth service error: {str(e)}")
    
    email = google_data.get('email')
    name = google_data.get('name')
    picture = google_data.get('picture')
    google_id = google_data.get('id')
    
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google")
    
    # Check if user exists
    user_doc = await db.users.find_one({"email": email}, {"_id": 0})
    
    if user_doc:
        # Update existing user
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        user_id = user_doc['user_id']
        role = user_doc['role']
        
        # Update student profile photo
        await db.student_profiles.update_one(
            {"user_id": user_id},
            {"$set": {"profile_photo": picture, "google_id": google_id, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        # Create new student user
        user = UserBase(
            email=email,
            name=name,
            role="student"
        )
        user_dict = user.model_dump()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        user_dict['updated_at'] = user_dict['updated_at'].isoformat()
        await db.users.insert_one(user_dict)
        
        user_id = user.user_id
        role = user.role
        
        # Create student profile
        student_profile = StudentProfile(
            user_id=user_id,
            email_verified=True,
            google_id=google_id,
            profile_photo=picture
        )
        profile_dict = student_profile.model_dump()
        profile_dict['created_at'] = profile_dict['created_at'].isoformat()
        profile_dict['updated_at'] = profile_dict['updated_at'].isoformat()
        await db.student_profiles.insert_one(profile_dict)
    
    # Create token
    token = create_token(user_id, role, email)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    # Get user for response
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    created_at = user_doc.get('created_at')
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            user_id=user_id,
            email=email,
            name=name,
            role=role,
            is_active=True,
            created_at=created_at
        )
    )


@router.get("/me", response_model=UserResponse)
async def get_me(token_data: dict = Depends(get_current_user)):
    """Get current user info"""
    user_doc = await db.users.find_one({"user_id": token_data['user_id']}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    created_at = user_doc.get('created_at')
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    
    return UserResponse(
        user_id=user_doc['user_id'],
        email=user_doc['email'],
        name=user_doc['name'],
        role=user_doc['role'],
        is_active=user_doc.get('is_active', True),
        created_at=created_at
    )


@router.post("/logout")
async def logout(response: Response):
    """Logout user"""
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}


@router.post("/resend-otp")
async def resend_otp(email: str):
    """Resend OTP for registration"""
    # Check if there's a pending registration
    pending = await db.pending_registrations.find_one({"email": email}, {"_id": 0})
    if not pending:
        raise HTTPException(status_code=400, detail="No pending registration found")
    
    # Generate new OTP
    otp_code = generate_otp()
    otp_doc = OTPVerification(
        email=email,
        otp_code=otp_code,
        purpose="signup",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)
    )
    
    # Remove old OTPs
    await db.otp_verifications.delete_many({"email": email, "purpose": "signup"})
    
    # Save new OTP
    otp_dict = otp_doc.model_dump()
    otp_dict['expires_at'] = otp_dict['expires_at'].isoformat()
    otp_dict['created_at'] = otp_dict['created_at'].isoformat()
    await db.otp_verifications.insert_one(otp_dict)
    
    # Send OTP email
    await send_otp_email(email, otp_code, "signup")
    
    return {"message": "OTP resent successfully"}
