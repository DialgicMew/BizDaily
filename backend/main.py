import os
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Import controllers with error handling
try:
    from funding_controller import app as funding_app
    FUNDING_APP_AVAILABLE = True
except Exception as e:
    print(f"⚠️  Warning: Could not import funding_controller: {e}")
    FUNDING_APP_AVAILABLE = False

try:
    from brief_controller import app as brief_app
    BRIEF_APP_AVAILABLE = True
except Exception as e:
    print(f"⚠️  Warning: Could not import brief_controller: {e}")
    BRIEF_APP_AVAILABLE = False

try:
    from company_detail_controller import app as company_detail_app
    COMPANY_APP_AVAILABLE = True
except Exception as e:
    print(f"⚠️  Warning: Could not import company_detail_controller: {e}")
    COMPANY_APP_AVAILABLE = False

app = FastAPI(
    title="BizDaily API",
    description="Combined API for funding data, daily briefs, and company details",
    version="1.0.0",
    # Enable concurrent processing
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS origins
def get_cors_origins() -> List[str]:
    """Get CORS origins from environment variable or use defaults."""
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "")
    if allowed_origins:
        origins = [origin.strip() for origin in allowed_origins.split(",")]
    else:
        # Default origins for development
        origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    print(f"🌐 CORS Origins: {origins}")
    return origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Mount controllers conditionally
if FUNDING_APP_AVAILABLE:
    app.mount("/api/funding", funding_app)
    print("✅ Funding API mounted")
else:
    print("❌ Funding API not available")

if BRIEF_APP_AVAILABLE:
    app.mount("/api/brief", brief_app)
    print("✅ Brief API mounted")
else:
    print("❌ Brief API not available")

if COMPANY_APP_AVAILABLE:
    app.mount("/api/company", company_detail_app)
    print("✅ Company API mounted")
else:
    print("❌ Company API not available")

@app.get("/")
async def root():
    return {"message": "BizDaily API is running", "status": "healthy"}

@app.get("/debug")
async def debug_info():
    """Debug endpoint to check app status without complex dependencies."""
    import os
    return {
        "message": "Debug endpoint working",
        "env_vars": {
            "ENVIRONMENT": os.getenv("ENVIRONMENT", "not_set"),
            "OPENAI_API_KEY": "set" if os.getenv("OPENAI_API_KEY") else "not_set",
            "DATABASE_URL": "set" if os.getenv("DATABASE_URL") else "not_set",
            "ALLOWED_ORIGINS": os.getenv("ALLOWED_ORIGINS", "not_set")
        },
        "services_loaded": {
            "funding": FUNDING_APP_AVAILABLE,
            "brief": BRIEF_APP_AVAILABLE,
            "company": COMPANY_APP_AVAILABLE
        }
    }

@app.get("/health")
async def health_check():
    """Simple health check that doesn't depend on external services."""
    import sys
    import os
    
    return {
        "status": "healthy",
        "python_version": sys.version.split()[0],  # Just version number
        "environment": os.getenv("ENVIRONMENT", "development"),
        "services": {
            "funding": FUNDING_APP_AVAILABLE,
            "brief": BRIEF_APP_AVAILABLE, 
            "company": COMPANY_APP_AVAILABLE
        },
        "api_endpoints": {
            "funding": "/api/funding" if FUNDING_APP_AVAILABLE else "unavailable",
            "brief": "/api/brief" if BRIEF_APP_AVAILABLE else "unavailable",
            "company": "/api/company" if COMPANY_APP_AVAILABLE else "unavailable"
        }
    }
