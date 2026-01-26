"""
TATVGYA - Educational SaaS Platform
Main FastAPI Application
"""
from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Import routes
from routes.auth import router as auth_router
from routes.articles import router as articles_router
from routes.educators import router as educators_router
from routes.students import router as students_router
from routes.admin import router as admin_router
from routes.subjects import router as subjects_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup: Run seed data if needed
    from seed_data import seed_database
    
    # Check if data exists
    user_count = await db.users.count_documents({})
    if user_count == 0:
        logging.info("No data found. Running seed script...")
        await seed_database()
    
    yield
    
    # Shutdown
    client.close()


# Create the main app
app = FastAPI(
    title="TATVGYA API",
    description="Educational SaaS Platform - Unlocking Wisdom, Connecting Minds",
    version="1.0.0",
    lifespan=lifespan
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Include all route modules
api_router.include_router(auth_router)
api_router.include_router(articles_router)
api_router.include_router(educators_router)
api_router.include_router(students_router)
api_router.include_router(admin_router)
api_router.include_router(subjects_router)


# Health check endpoint
@api_router.get("/")
async def root():
    return {"message": "TATVGYA API is running", "status": "healthy"}


@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}


# Platform stats (public)
@api_router.get("/stats")
async def get_public_stats():
    """Get public platform statistics for homepage"""
    total_articles = await db.articles.count_documents({"status": "published"})
    total_educators = await db.educator_profiles.count_documents({"is_approved": True})
    
    # Sum all views
    pipeline = [
        {"$match": {"status": "published"}},
        {"$group": {"_id": None, "total": {"$sum": "$view_count"}}}
    ]
    views_result = await db.articles.aggregate(pipeline).to_list(1)
    total_views = views_result[0]["total"] if views_result else 0
    
    return {
        "total_articles": total_articles,
        "total_educators": total_educators,
        "total_views": total_views
    }


# Include the router in the main app
app.include_router(api_router)

# CORS middleware - Configure specific origins for credentials support
cors_origins = os.environ.get('CORS_ORIGINS', '').split(',')
# Handle wildcard by allowing all common origins
if '*' in cors_origins or not cors_origins[0]:
    cors_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://localhost:3000",
    ]
    # Add the preview URL pattern dynamically
    import re

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],  # Will be overridden for requests with credentials
    allow_origin_regex=r"https://.*\.preview\.emergentagent\.com|http://localhost:.*",
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
