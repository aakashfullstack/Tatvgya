"""
Authentication utilities for TATVGYA
"""
import os
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

JWT_SECRET = os.environ.get("JWT_SECRET", "default_secret_key")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_token(user_id: str, role: str, email: str) -> str:
    """Create a JWT token"""
    payload = {
        "user_id": user_id,
        "role": role,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


class JWTBearer(HTTPBearer):
    """Custom JWT Bearer authentication"""
    
    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)
    
    async def __call__(self, request: Request) -> Optional[dict]:
        # First try to get from cookies
        session_token = request.cookies.get("session_token")
        if session_token:
            return decode_token(session_token)
        
        # Then try Authorization header
        credentials: HTTPAuthorizationCredentials = await super(JWTBearer, self).__call__(request)
        if credentials:
            if credentials.scheme != "Bearer":
                raise HTTPException(status_code=403, detail="Invalid authentication scheme")
            return decode_token(credentials.credentials)
        
        raise HTTPException(status_code=403, detail="No valid credentials provided")


class OptionalJWTBearer(HTTPBearer):
    """Optional JWT Bearer authentication - returns None if not authenticated"""
    
    def __init__(self):
        super(OptionalJWTBearer, self).__init__(auto_error=False)
    
    async def __call__(self, request: Request) -> Optional[dict]:
        # First try to get from cookies
        session_token = request.cookies.get("session_token")
        if session_token:
            try:
                return decode_token(session_token)
            except HTTPException:
                return None
        
        # Then try Authorization header
        try:
            credentials: HTTPAuthorizationCredentials = await super(OptionalJWTBearer, self).__call__(request)
            if credentials and credentials.scheme == "Bearer":
                return decode_token(credentials.credentials)
        except Exception:
            pass
        
        return None


def require_role(allowed_roles: list):
    """Dependency to require specific roles"""
    async def role_checker(token_data: dict = Depends(JWTBearer())):
        if token_data.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required roles: {allowed_roles}"
            )
        return token_data
    return role_checker


# Dependency instances
get_current_user = JWTBearer()
get_optional_user = OptionalJWTBearer()
require_admin = require_role(["admin"])
require_educator = require_role(["admin", "educator"])
require_student = require_role(["admin", "educator", "student"])
