"""funding_controller.py – HTTP layer for querying funding data.

Run with:
    uvicorn funding_controller:app --reload

The POST /funding/filter endpoint accepts a JSON payload:
{
  "filters": {
      "funding_stage": ["Series A", "Seed Stage"],
      "sector": ["Fintech"]
  },
  "search_query": "fintech startup",
  "page": 0,
  "page_size": 25,
  "order_by": ["funding_date DESC", "funding_uuid DESC"]
}

All fields are optional.
- search_query: Searches across company names, sectors, investors, funding stages using LIKE queries.
  Results are ordered by match relevance when search is present.
"""
from __future__ import annotations

import asyncio
from typing import Dict, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from funding_service import fetch_funding_data_filter

# Thread pool for database operations
funding_db_executor = ThreadPoolExecutor(max_workers=3, thread_name_prefix="funding_db")

app = FastAPI(title="Funding API", version="1.0")

class FilterRequest(BaseModel):
    filters: Optional[Dict[str, List[str]]] = None
    search_query: Optional[str] = None  # Search across company names, sectors, investors, etc.
    page: int = 0
    page_size: int = 25
    order_by: Optional[List[str]] = None  # e.g. ["funding_date DESC", "funding_amount ASC"]

class FilterResponse(BaseModel):
    data: List[Dict[str, object]]
    total: int
    page: int
    page_size: int


def _parse_order_by(ob_list: Optional[List[str]]) -> Optional[List[Tuple[str, str]]]:
    """Convert list of "col DIR" strings to list[tuple]."""
    if not ob_list:
        return None
    parsed: List[Tuple[str, str]] = []
    for item in ob_list:
        parts = item.strip().split()
        if len(parts) == 1:
            col, dir_ = parts[0], "ASC"
        elif len(parts) == 2:
            col, dir_ = parts
        else:
            raise ValueError(f"Invalid order_by element: '{item}'")
        parsed.append((col, dir_))
    return parsed


@app.post("/funding/filter", response_model=FilterResponse)
async def funding_filter(payload: FilterRequest):
    try:
        order_by_tuples = _parse_order_by(payload.order_by)
        filter_tuples = (
            [(k, v) for k, v in payload.filters.items()] if payload.filters else None
        )
        
        # Run database operation in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            funding_db_executor,
            fetch_funding_data_filter,
            filter_tuples,
            payload.page,
            payload.page_size,
            order_by_tuples,
            payload.search_query,
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error") from e 