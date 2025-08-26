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
web: uvicorn main:app --host 0.0.0.0 --port $PORT
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
# Database
DATABASE_URL=postgresql://user:pass@host:port/dbname

# OpenAI API (if you're using it)
OPENAI_API_KEY=your_openai_api_key

# App settings
PORT=8000
ENVIRONMENT=production
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

### D. Optional: Migrate to PostgreSQL (Recommended)

Since Railway provides free PostgreSQL, you can migrate from SQLite:

**Add to requirements.txt**:
```
psycopg2-binary==2.9.9
```

**Update db_connection_manager.py** to support PostgreSQL:
```python
import os
import sqlite3
import psycopg2
from urllib.parse import urlparse

def init_funding_db(db_path: str = None) -> sqlite3.Connection:
    """Create/connect to the database and ensure the funding table exists."""
    
    # Check if we're using PostgreSQL (production) or SQLite (local)
    database_url = os.getenv('DATABASE_URL')
    
    if database_url:
        # Production: Use PostgreSQL
        return init_postgresql_db(database_url)
    else:
        # Local: Use SQLite
        db_file = db_path or "funding_data.db"
        conn = sqlite3.connect(db_file)
        # ... rest of your SQLite setup
        return conn

def init_postgresql_db(database_url: str):
    """Initialize PostgreSQL database."""
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    # Create funding table if not exists (adjust columns as needed)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS funding (
            funding_uuid INTEGER PRIMARY KEY,
            company_name TEXT NOT NULL,
            funding_stage TEXT,
            funding_amount TEXT,
            -- Add your other columns here
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    return conn
```

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

### C. Add environment variables

In Railway dashboard:
1. Go to "Variables" tab
2. Add:
   - `PORT=8000`
   - `OPENAI_API_KEY=your_key` (if using OpenAI)
   - Railway will auto-add `DATABASE_URL` for PostgreSQL

### D. Deploy

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
- ✅ Free PostgreSQL database (1GB)
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
