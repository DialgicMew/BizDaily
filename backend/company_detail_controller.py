from __future__ import annotations
from typing import Dict, Any
from fastapi import FastAPI, HTTPException, Path, Query
from pydantic import BaseModel
from company_detail_service import (
    get_company_details_by_funding_uuid,
)

app = FastAPI(title="Company Details API", version="1.0")


class CompanyDetailsResponse(BaseModel):
    funding_uuid: int
    company_name: str
    details: Dict[str, Any]
    generated_on: str | None = None
    exists_in_db: bool


@app.get("/company-details/{funding_uuid}", response_model=CompanyDetailsResponse)
async def get_company_details(
    funding_uuid: int = Path(..., description="The funding UUID to get details for", ge=1),
    generate_if_missing: bool = Query(True, description="Generate details if they don't exist")
):
    try:
        details = await get_company_details_by_funding_uuid(funding_uuid, generate_if_missing)
        
        if details is None:
            raise HTTPException(
                status_code=404, 
                detail=f"Company details not found for funding UUID {funding_uuid}"
            )
        
        return CompanyDetailsResponse(
            funding_uuid=funding_uuid,
            company_name=details.get("company_name", ""),
            details=details,
            generated_on=details.get("generated_on"),
            exists_in_db=True
        )
            
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
        
    except HTTPException:
        # Re-raise HTTPExceptions without wrapping them
        raise
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get company details: {str(e)}")

