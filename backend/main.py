import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create a minimal app that will definitely start
app = FastAPI(
    title="BizDaily API - Minimal",
    description="Minimal version to test Railway deployment",
    version="1.0.0"
)

# Simple CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "BizDaily API is running on Railway!",
        "status": "healthy",
        "url": "bizdaily-production.up.railway.app"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "production"),
        "railway_url": "bizdaily-production.up.railway.app"
    }

@app.get("/test")
async def test_endpoint():
    return {
        "message": "Test endpoint working!",
        "env_check": {
            "ENVIRONMENT": os.getenv("ENVIRONMENT", "not_set"),
            "PORT": os.getenv("PORT", "not_set"),
            "OPENAI_API_KEY": "set" if os.getenv("OPENAI_API_KEY") else "not_set"
        }
    }
