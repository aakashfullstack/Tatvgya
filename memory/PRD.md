# TATVGYA - Educational SaaS Platform PRD

## Original Problem Statement
Build TATVGYA - A high-performance, visually stunning, responsive SaaS web platform for educational content. Platform connects Educators (publish articles), Students (explore, read, like, bookmark), and Admin (manages users, content, moderation).

## User Personas
1. **Admin**: Platform administrator who manages educators, approves content, handles moderation
2. **Educator/Author**: Creates and publishes educational articles, manages their content
3. **Student/Learner**: Discovers, reads, likes, bookmarks educational content

## Core Requirements (Static)
- Role-based access control (Admin, Educator, Student)
- Article CMS with draft/pending/published workflow
- 8 subject categories with educator assignment
- Content moderation with keyword filtering
- Google OAuth + Email OTP authentication
- Like, bookmark, view tracking
- Admin dashboard with analytics

## What's Been Implemented (January 26, 2026)

### Backend (FastAPI + MongoDB)
- ✅ Complete authentication system (JWT + Google OAuth + Email OTP)
- ✅ 10 MongoDB collections with relational-like schema
- ✅ Full CRUD APIs for articles, educators, students, admin
- ✅ Content moderation with keyword-based filtering
- ✅ Indexed database for performance
- ✅ Seed data: 100 articles, 20 educators, 8 subjects
- ✅ Email service integration (Resend)
- ✅ Emergent Google Auth integration

### Frontend (React + Tailwind CSS + Framer Motion)
- ✅ Homepage with hero, metrics, article carousel, subjects grid
- ✅ Explore page with search, filters, pagination
- ✅ Article detail page with like/bookmark/share
- ✅ Educator profile pages
- ✅ Login/Signup with Google OAuth
- ✅ Student dashboard (liked, bookmarked, history)
- ✅ Educator CMS dashboard
- ✅ Admin dashboard with analytics
- ✅ About, Vision, Contact pages
- ✅ Glassmorphism design with Yellow-Orange/Black theme

### Design Features
- ✅ Parallax scrolling effects
- ✅ Scroll-triggered animations (Framer Motion)
- ✅ Glassmorphism cards
- ✅ Animated counters
- ✅ Responsive design
- ✅ TATVGYA logo integration

## Prioritized Backlog

### P0 (Critical - Next Sprint)
- [ ] Email verification flow end-to-end testing
- [ ] Resend API key configuration for production

### P1 (High Priority)
- [ ] Three.js subtle 3D hover effects on hero
- [ ] Article rich text editor (TinyMCE/QuillJS)
- [ ] Image upload for articles (S3/Cloudinary)
- [ ] Password reset functionality

### P2 (Medium Priority)
- [ ] Educator approval workflow
- [ ] Student reading progress tracking
- [ ] Article analytics dashboard for educators
- [ ] Comment system

### P3 (Future Features)
- [ ] Payment integration for premium content
- [ ] Subscription tiers
- [ ] Mobile app (React Native)
- [ ] Regional language support

## Credentials
- **Admin**: aakash10@tatvgya.com / Astatvgyafifa-10
- **Educators**: educator1@tatvgya.com to educator20@tatvgya.com / Educator@[1-20]23
