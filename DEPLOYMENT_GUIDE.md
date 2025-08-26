# 🚀 BizDaily Deployment Guide - Free Hosting

## 📋 Overview

This guide will help you deploy your BizDaily application for **FREE** using:
- **Backend (FastAPI)**: Railway.app (Free tier: 500 hours/month, PostgreSQL database)  
- **Frontend (React)**: Vercel (Unlimited free deployments)

## 🎯 Step 1: Prepare Backend for Deployment

### A. Add deployment files

Create these files in your `/backend` folder:

**1. `Procfile`** (for process definition):
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4 --limit-concurrency 100 --loop asyncio --http httptools
```

**2. `railway.toml`** (Railway configuration):
```toml
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

**3. `.env.example`** (Environment variables template):
```env
# OpenAI API (required for LLM features)
OPENAI_API_KEY=your_openai_api_key

# PostgreSQL Database (required)
DATABASE_URL=postgresql://username:password@host:port/database

# App settings
PORT=8000
ENVIRONMENT=production

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=https://your-frontend-app.vercel.app,http://localhost:3000
```

### B. Update CORS settings in main.py

Your CORS needs to allow the deployed frontend URL:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://your-frontend-app.vercel.app",  # Add this
        "https://*.vercel.app"  # Allow all Vercel subdomains
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### C. Add health check endpoint (if not exists)

```python
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### D. PostgreSQL Database Setup

Your application uses **PostgreSQL** as its primary database. This provides excellent performance, concurrent access, and reliability.

**Why PostgreSQL:**
- ✅ **Excellent concurrency** - handles 100+ concurrent users efficiently
- ✅ **Production-grade reliability** with ACID compliance
- ✅ **Advanced features** like indexes, constraints, and JSON support
- ✅ **Scales horizontally** when needed
- ✅ **Free PostgreSQL service** included with Railway

**Your application will automatically:**
- 🔌 **Connect to PostgreSQL** when `DATABASE_URL` is provided
- 🏗️ **Create all tables** on first startup
- 🔄 **Handle connection pooling** efficiently

## 🎯 Step 2: Deploy Backend to Railway

### A. Sign up and connect GitHub

1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Connect your GitHub repository

### B. Create new project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `BizDaily` repository
4. Select the `/backend` folder as root directory

### C. Add PostgreSQL Database

1. **In your Railway project, click "New Service"**
2. **Select "Database" → "PostgreSQL"**
3. **Railway creates PostgreSQL service automatically**

### D. Configure Backend Service

1. **Click on your backend service** (not the PostgreSQL service)
2. **Go to "Variables" tab**
3. **Add these environment variables:**
   - `OPENAI_API_KEY=your_openai_api_key` (required for LLM features)
   - `ALLOWED_ORIGINS=https://your-frontend-app.vercel.app` (update with your actual Vercel URL)
   - `ENVIRONMENT=production`
   - `DATABASE_URL=` Copy this from your PostgreSQL service (Variables tab)

### E. Link PostgreSQL to Backend

1. **Click your PostgreSQL service**
2. **Go to "Variables" tab**
3. **Copy the `DATABASE_URL` value**
4. **Go back to your backend service → "Variables" tab**
5. **Add `DATABASE_URL` with the copied PostgreSQL connection string**

**Note**: `PORT` is automatically set by Railway. Your app will automatically detect PostgreSQL and create tables on startup.

### F. Deploy

Railway will automatically detect FastAPI and deploy your backend!

**Your backend URL**: `https://your-app-name.railway.app`

## 🎯 Step 3: Deploy Frontend to Vercel

### A. Update API endpoints in frontend

Create `/frontend/.env.production`:
```env
REACT_APP_API_BASE_URL=https://your-backend-app.railway.app
```

Update your API calls to use environment variables:
```typescript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const fetchFundingData = async (page: number, pageSize: number = 20, searchQuery?: string) => {
  const response = await fetch(`${API_BASE_URL}/funding/search`, {
    // ... rest of your fetch logic
  });
};
```

### B. Sign up to Vercel

1. Go to [Vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your repository

### C. Configure build settings

1. **Framework Preset**: Create React App
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `build`

### D. Add environment variables

In Vercel dashboard:
1. Go to "Settings" → "Environment Variables"
2. Add `REACT_APP_API_BASE_URL=https://your-backend-app.railway.app`

### E. Deploy

Vercel will automatically build and deploy your React app!

**Your frontend URL**: `https://your-frontend-app.vercel.app`

## 🎯 Step 4: Update CORS (Final Step)

Update your backend's CORS settings with your actual Vercel URL:
```python
allow_origins=[
    "http://localhost:3000", 
    "https://your-actual-frontend.vercel.app"
]
```

Redeploy your backend on Railway.

## 📊 Free Tier Limits

### Railway (Backend)
- ✅ 500 execution hours/month
- ✅ 1GB RAM, 1 CPU
- ✅ Free PostgreSQL database (1GB storage)
- ✅ Custom domains

### Vercel (Frontend)
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Custom domains
- ✅ Automatic HTTPS

## 🔧 Alternative Free Options

### Backend Alternatives:
- **Render**: 750 hours/month free
- **Fly.io**: Good free tier
- **PythonAnywhere**: Python-specific hosting

### Frontend Alternatives:
- **Netlify**: Similar to Vercel
- **GitHub Pages**: For static sites only
- **Surge.sh**: Simple static hosting

## 🚀 Quick Deploy Commands

Once you've set up the accounts and added the files, deployment is automatic via git:

```bash
# Push to deploy both frontend and backend
git add .
git commit -m "Add deployment configuration"
git push origin main
```

Both Railway and Vercel will automatically redeploy on every git push!

## 🔗 Final Architecture

```
User → Vercel (React Frontend) → Railway (FastAPI Backend) → PostgreSQL Database
```

**Total Cost: $0/month** 🎉

## 🚀 Performance Optimizations Included

Your backend is now **production-ready** with:
- ✅ **4 worker processes** handling 100+ concurrent users
- ✅ **Async LLM operations** with OpenAI for non-blocking AI requests
- ✅ **Parallel company processing** for faster daily brief generation
- ✅ **Optimized thread pools** for database and external API calls
- ✅ **PostgreSQL optimization** for excellent concurrent access and reliability
