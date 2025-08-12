from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from funding_controller import app as funding_app
from brief_controller import app as brief_app
from company_detail_controller import app as company_detail_app

app = FastAPI(
    title="BizDaily API",
    description="Combined API for funding data, daily briefs, and company details",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/api/funding", funding_app)
app.mount("/api/brief", brief_app)
app.mount("/api/company", company_detail_app)

@app.get("/")
async def root():
    return {"message": "BizDaily API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
