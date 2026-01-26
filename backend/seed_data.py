"""
Seed data script for TATVGYA
Creates admin, 20 educators, 8 subjects, and 100 demo articles
"""
import os
import asyncio
import random
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Import models and utilities
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import UserBase, EducatorProfile, StudentProfile, Subject, Article, generate_id
from utils.auth import hash_password

# Database connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Subjects data
SUBJECTS = [
    {"name": "Science", "slug": "science", "description": "Physics, Chemistry, Biology and more", "icon": "flask", "color": "#3B82F6"},
    {"name": "Technology", "slug": "technology", "description": "Computer Science, IT, Engineering", "icon": "cpu", "color": "#10B981"},
    {"name": "Arts", "slug": "arts", "description": "Fine Arts, Music, Literature", "icon": "palette", "color": "#F59E0B"},
    {"name": "Commerce", "slug": "commerce", "description": "Accounting, Business, Economics", "icon": "trending-up", "color": "#EF4444"},
    {"name": "Humanities", "slug": "humanities", "description": "History, Geography, Political Science", "icon": "globe", "color": "#8B5CF6"},
    {"name": "Law", "slug": "law", "description": "Legal Studies, Constitutional Law", "icon": "scale", "color": "#EC4899"},
    {"name": "Medicine", "slug": "medicine", "description": "Medical Sciences, Healthcare", "icon": "heart-pulse", "color": "#06B6D4"},
    {"name": "Others", "slug": "others", "description": "General Knowledge, Life Skills", "icon": "book-open", "color": "#71717A"}
]

# Educator data
EDUCATORS = [
    {"name": "Dr. Rajesh Kumar", "bio": "Ph.D. in Physics from IIT Delhi. 15 years of teaching experience.", "subjects": ["science"], "photo": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"},
    {"name": "Prof. Priya Sharma", "bio": "Computer Science professor at IIIT Hyderabad. Expert in AI and ML.", "subjects": ["technology"], "photo": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200"},
    {"name": "Dr. Amit Verma", "bio": "Renowned economist and former RBI advisor. Author of 5 books.", "subjects": ["commerce"], "photo": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200"},
    {"name": "Anita Desai", "bio": "Award-winning artist and art historian. Taught at JNU for 20 years.", "subjects": ["arts"], "photo": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200"},
    {"name": "Dr. Suresh Nair", "bio": "MBBS, MD from AIIMS. Specializes in Cardiology.", "subjects": ["medicine"], "photo": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200"},
    {"name": "Advocate Meera Joshi", "bio": "Senior Advocate at Supreme Court. Constitutional law expert.", "subjects": ["law"], "photo": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200"},
    {"name": "Prof. Vikram Singh", "bio": "History professor at Delhi University. Specializes in Ancient India.", "subjects": ["humanities"], "photo": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200"},
    {"name": "Dr. Kavita Menon", "bio": "Biotechnology researcher at IISc Bangalore.", "subjects": ["science", "technology"], "photo": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200"},
    {"name": "Rohit Agarwal", "bio": "Chartered Accountant and financial consultant. 12 years industry experience.", "subjects": ["commerce"], "photo": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200"},
    {"name": "Dr. Neha Gupta", "bio": "Ph.D. in Chemistry from IISc. Research on sustainable materials.", "subjects": ["science"], "photo": "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200"},
    {"name": "Prof. Arjun Reddy", "bio": "Software architect at major tech company. Open source contributor.", "subjects": ["technology"], "photo": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200"},
    {"name": "Sunita Krishnan", "bio": "Classical dancer and performing arts educator. Padma Shri awardee.", "subjects": ["arts"], "photo": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200"},
    {"name": "Dr. Prakash Iyer", "bio": "Orthopedic surgeon with 20+ years experience. Medical educator.", "subjects": ["medicine"], "photo": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200"},
    {"name": "Justice K. Ramaswamy (Retd.)", "bio": "Retired High Court Judge. Expert in Criminal Law.", "subjects": ["law"], "photo": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200"},
    {"name": "Dr. Lakshmi Rao", "bio": "Geography professor. Expert in Climate Studies and GIS.", "subjects": ["humanities"], "photo": "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=200"},
    {"name": "Sanjay Mehta", "bio": "Entrepreneur and business strategist. Founded 3 successful startups.", "subjects": ["commerce", "others"], "photo": "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200"},
    {"name": "Dr. Divya Nair", "bio": "Pediatric specialist at Apollo Hospitals. Child health advocate.", "subjects": ["medicine"], "photo": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200"},
    {"name": "Prof. Ramesh Chandra", "bio": "Mathematics professor at IIT Kanpur. Fields Medal nominee.", "subjects": ["science"], "photo": "https://images.unsplash.com/photo-1537511446984-935f663eb1f4?w=200"},
    {"name": "Aisha Khan", "bio": "Cybersecurity expert. Worked with major banks and govt agencies.", "subjects": ["technology"], "photo": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200"},
    {"name": "Dr. Venkat Raman", "bio": "Political scientist and author. Expert on Indian democracy.", "subjects": ["humanities", "law"], "photo": "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200"}
]

# Article templates per subject
ARTICLE_TEMPLATES = {
    "science": [
        ("Understanding Quantum Mechanics: A Beginner's Guide", "Explore the fascinating world of quantum physics and its implications for our understanding of reality."),
        ("The Chemistry of Everyday Life", "Discover how chemical reactions shape our daily experiences, from cooking to cleaning."),
        ("Evolution: From Darwin to Modern Genetics", "Trace the journey of evolutionary theory and its modern genetic foundations."),
        ("Climate Change: The Science Behind Global Warming", "A comprehensive look at the scientific evidence for climate change."),
        ("The Human Brain: Mysteries and Discoveries", "Explore the latest neuroscience findings about our most complex organ."),
    ],
    "technology": [
        ("Introduction to Machine Learning", "Learn the fundamentals of ML and how it's transforming industries."),
        ("Web Development in 2024: Essential Skills", "A guide to the most important web technologies to learn."),
        ("Cybersecurity Best Practices for Students", "Protect yourself online with these essential security tips."),
        ("The Rise of Cloud Computing", "Understanding how cloud technology is reshaping IT infrastructure."),
        ("Blockchain Beyond Cryptocurrency", "Explore the diverse applications of blockchain technology."),
    ],
    "arts": [
        ("The Renaissance: Art That Changed the World", "Explore the artistic revolution that shaped Western civilization."),
        ("Indian Classical Music: A Journey Through Ragas", "Understanding the rich tradition of Indian classical music."),
        ("Modern Art Movements and Their Legacy", "From Impressionism to Abstract Expressionism."),
        ("The Art of Storytelling: Narrative Techniques", "Master the fundamentals of compelling storytelling."),
        ("Photography as an Art Form", "Understanding composition, light, and visual narrative."),
    ],
    "commerce": [
        ("Understanding Financial Statements", "A beginner's guide to reading balance sheets and income statements."),
        ("The Basics of Stock Market Investing", "Learn how to start your investment journey wisely."),
        ("Entrepreneurship in India: Opportunities and Challenges", "Navigating the startup ecosystem in India."),
        ("Digital Marketing Fundamentals", "Master the basics of online marketing strategies."),
        ("GST Explained: A Complete Guide", "Understanding India's goods and services tax system."),
    ],
    "humanities": [
        ("The Indus Valley Civilization: Rediscovering Ancient India", "Explore one of the world's oldest urban civilizations."),
        ("Understanding Geopolitics: India's Role in the World", "Analyzing India's position in global politics."),
        ("The French Revolution and Its Global Impact", "How a revolution in France changed the world."),
        ("Cultural Diversity in India: Unity in Diversity", "Celebrating India's rich cultural tapestry."),
        ("Environmental Geography: Human Impact on Landscapes", "Understanding how humans shape the environment."),
    ],
    "law": [
        ("Indian Constitution: Fundamental Rights Explained", "A detailed look at the rights guaranteed to every citizen."),
        ("Contract Law Basics for Everyday Life", "Understanding the legal principles behind agreements."),
        ("Cyber Laws in India: A Comprehensive Guide", "Navigating the legal landscape of the digital world."),
        ("Environmental Law and Sustainable Development", "Legal frameworks for protecting our environment."),
        ("Consumer Rights: Know Your Legal Protections", "Understanding your rights as a consumer in India."),
    ],
    "medicine": [
        ("Preventive Healthcare: Better Than Cure", "Simple steps to maintain good health and prevent diseases."),
        ("Understanding Diabetes: Prevention and Management", "A comprehensive guide to managing diabetes."),
        ("Mental Health Awareness: Breaking the Stigma", "Promoting understanding and support for mental health."),
        ("First Aid Essentials Everyone Should Know", "Basic emergency response skills that can save lives."),
        ("Nutrition Science: Eating for Optimal Health", "Understanding the science behind healthy eating."),
    ],
    "others": [
        ("Time Management for Students", "Proven strategies to make the most of your study time."),
        ("Public Speaking: Overcoming Fear and Building Confidence", "Tips to become a better communicator."),
        ("Critical Thinking Skills for the Modern World", "Developing analytical abilities for better decision-making."),
        ("Financial Literacy for Young Adults", "Essential money management skills for students."),
        ("Career Planning: Finding Your Path", "Guidance for making informed career decisions."),
    ]
}

# Cover images for articles
COVER_IMAGES = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800",
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800",
    "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800",
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800",
    "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800",
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800",
    "https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=800"
]

# Sample article content
SAMPLE_CONTENT = """
<h2>Introduction</h2>
<p>This article explores the fundamental concepts and their practical applications in real-world scenarios. Understanding these principles is crucial for students and professionals alike.</p>

<h2>Key Concepts</h2>
<p>The subject matter we're discussing today has evolved significantly over the years. Let's break down the essential elements that form the foundation of this topic.</p>

<h3>Concept 1: Foundation</h3>
<p>Every great understanding begins with a solid foundation. In this section, we explore the basic principles that have stood the test of time and continue to guide modern practice.</p>

<h3>Concept 2: Application</h3>
<p>Theory without practice is incomplete. Here we discuss how these concepts are applied in real-world situations, with examples from Indian context.</p>

<h2>Historical Context</h2>
<p>Understanding the historical development of this subject helps us appreciate its current state. From ancient Indian scholars to modern researchers, many have contributed to our knowledge.</p>

<h2>Modern Developments</h2>
<p>The 21st century has brought unprecedented changes to this field. Technology, globalization, and new research methods have opened up exciting possibilities.</p>

<h2>Practical Applications</h2>
<p>For students preparing for competitive exams or professionals seeking to deepen their knowledge, understanding the practical applications is essential. Let's explore some real-world scenarios.</p>

<h2>Conclusion</h2>
<p>As we've seen, this subject is both fascinating and relevant to our daily lives. By understanding these concepts, we can make better decisions and contribute meaningfully to society.</p>

<h2>References</h2>
<p>For further reading, we recommend exploring academic journals, textbooks, and reputable online resources dedicated to this subject.</p>
"""


async def seed_database():
    """Main seeding function"""
    print("🌱 Starting database seeding...")
    
    # Clear existing data (for demo purposes)
    collections = ['users', 'educator_profiles', 'student_profiles', 'subjects', 'articles', 
                   'likes', 'bookmarks', 'views', 'reports', 'moderation_logs', 'contact_queries']
    for collection in collections:
        await db[collection].delete_many({})
    print("✓ Cleared existing data")
    
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.educator_profiles.create_index("user_id", unique=True)
    await db.educator_profiles.create_index("profile_id", unique=True)
    await db.student_profiles.create_index("user_id", unique=True)
    await db.subjects.create_index("slug", unique=True)
    await db.articles.create_index("slug", unique=True)
    await db.articles.create_index([("view_count", -1)])
    await db.articles.create_index([("like_count", -1)])
    await db.articles.create_index([("subject_id", 1)])
    await db.articles.create_index([("educator_id", 1)])
    await db.articles.create_index([("status", 1)])
    await db.articles.create_index([("is_flagged", 1)])
    await db.likes.create_index([("user_id", 1), ("article_id", 1)], unique=True)
    await db.bookmarks.create_index([("user_id", 1), ("article_id", 1)], unique=True)
    print("✓ Created indexes")
    
    # Create admin user
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@tatvgya.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@123456")
    
    admin_user = UserBase(
        email=admin_email,
        name="Admin",
        password_hash=hash_password(admin_password),
        role="admin"
    )
    admin_dict = admin_user.model_dump()
    admin_dict['created_at'] = admin_dict['created_at'].isoformat()
    admin_dict['updated_at'] = admin_dict['updated_at'].isoformat()
    await db.users.insert_one(admin_dict)
    print(f"✓ Created admin: {admin_email}")
    
    # Create subjects
    subject_map = {}  # slug -> subject_id
    for sub_data in SUBJECTS:
        subject = Subject(
            name=sub_data["name"],
            slug=sub_data["slug"],
            description=sub_data["description"],
            icon=sub_data["icon"],
            color=sub_data["color"]
        )
        sub_dict = subject.model_dump()
        sub_dict['created_at'] = sub_dict['created_at'].isoformat()
        await db.subjects.insert_one(sub_dict)
        subject_map[sub_data["slug"]] = subject.subject_id
    print(f"✓ Created {len(SUBJECTS)} subjects")
    
    # Create educators
    educator_profiles = []
    educator_credentials = []
    
    for i, edu_data in enumerate(EDUCATORS):
        # Generate password
        password = f"Educator@{i+1}23"
        
        # Create user
        user = UserBase(
            email=f"educator{i+1}@tatvgya.com",
            name=edu_data["name"],
            password_hash=hash_password(password),
            role="educator"
        )
        user_dict = user.model_dump()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        user_dict['updated_at'] = user_dict['updated_at'].isoformat()
        await db.users.insert_one(user_dict)
        
        # Map subject slugs to IDs
        subject_ids = [subject_map[slug] for slug in edu_data["subjects"]]
        
        # Create educator profile
        profile = EducatorProfile(
            user_id=user.user_id,
            bio=edu_data["bio"],
            profile_photo=edu_data["photo"],
            subject_ids=subject_ids,
            is_approved=True
        )
        profile_dict = profile.model_dump()
        profile_dict['created_at'] = profile_dict['created_at'].isoformat()
        profile_dict['updated_at'] = profile_dict['updated_at'].isoformat()
        await db.educator_profiles.insert_one(profile_dict)
        
        educator_profiles.append({
            "user_id": user.user_id,
            "profile_id": profile.profile_id,
            "subject_ids": subject_ids,
            "name": edu_data["name"],
            "photo": edu_data["photo"]
        })
        
        educator_credentials.append({
            "name": edu_data["name"],
            "email": f"educator{i+1}@tatvgya.com",
            "password": password
        })
    
    print(f"✓ Created {len(EDUCATORS)} educators")
    
    # Create articles (100 total, ~5-6 per subject across educators)
    article_count = 0
    subject_article_count = {slug: 0 for slug in subject_map.keys()}
    
    for subject_slug, templates in ARTICLE_TEMPLATES.items():
        subject_id = subject_map[subject_slug]
        
        # Find educators for this subject
        subject_educators = [e for e in educator_profiles if subject_id in e["subject_ids"]]
        
        if not subject_educators:
            continue
        
        # Create multiple articles per template
        for _ in range(3):  # 3 variations per template
            for title, excerpt in templates:
                if article_count >= 100:
                    break
                
                # Pick random educator
                educator = random.choice(subject_educators)
                
                # Create unique title
                variation = random.choice(["", " - Part 1", " - Complete Guide", " - Simplified", " - Advanced"])
                unique_title = f"{title}{variation}".strip()
                slug = f"{subject_slug}-{article_count + 1}"
                
                # Random stats
                view_count = random.randint(50, 5000)
                like_count = random.randint(10, min(500, view_count // 3))
                bookmark_count = random.randint(5, min(200, like_count))
                
                # Random published date (within last 6 months)
                days_ago = random.randint(1, 180)
                published_at = datetime.now(timezone.utc) - timedelta(days=days_ago)
                
                article = Article(
                    title=unique_title,
                    slug=slug,
                    content=SAMPLE_CONTENT,
                    excerpt=excerpt,
                    cover_image=random.choice(COVER_IMAGES),
                    educator_id=educator["profile_id"],
                    user_id=educator["user_id"],
                    subject_id=subject_id,
                    tags=[subject_slug, "education", "learning"],
                    status="published",
                    view_count=view_count,
                    like_count=like_count,
                    bookmark_count=bookmark_count,
                    reading_time=random.randint(5, 15),
                    originality_confirmed=True,
                    published_at=published_at
                )
                
                article_dict = article.model_dump()
                article_dict['created_at'] = article_dict['created_at'].isoformat()
                article_dict['updated_at'] = article_dict['updated_at'].isoformat()
                article_dict['published_at'] = article_dict['published_at'].isoformat()
                await db.articles.insert_one(article_dict)
                
                article_count += 1
                subject_article_count[subject_slug] = subject_article_count.get(subject_slug, 0) + 1
            
            if article_count >= 100:
                break
    
    print(f"✓ Created {article_count} articles")
    
    # Update subject article counts
    for slug, count in subject_article_count.items():
        await db.subjects.update_one(
            {"slug": slug},
            {"$set": {"article_count": count}}
        )
    
    # Update educator article counts
    pipeline = [
        {"$group": {"_id": "$educator_id", "count": {"$sum": 1}, "views": {"$sum": "$view_count"}, "likes": {"$sum": "$like_count"}, "bookmarks": {"$sum": "$bookmark_count"}}}
    ]
    educator_stats = await db.articles.aggregate(pipeline).to_list(100)
    
    for stat in educator_stats:
        await db.educator_profiles.update_one(
            {"profile_id": stat["_id"]},
            {"$set": {
                "total_articles": stat["count"],
                "total_views": stat["views"],
                "total_likes": stat["likes"],
                "total_bookmarks": stat["bookmarks"]
            }}
        )
    
    print("✓ Updated statistics")
    
    # Print credentials
    print("\n" + "="*60)
    print("EDUCATOR CREDENTIALS (for demo)")
    print("="*60)
    for cred in educator_credentials[:5]:  # Print first 5
        print(f"  {cred['name']}: {cred['email']} / {cred['password']}")
    print("  ... and 15 more educators")
    print("="*60)
    print(f"ADMIN: {admin_email} / {admin_password}")
    print("="*60)
    
    print("\n✅ Database seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_database())
