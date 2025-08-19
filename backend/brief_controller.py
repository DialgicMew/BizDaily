from __future__ import annotations
from typing import List, Dict, Any, Optional
import asyncio
from fastapi import FastAPI, HTTPException, Query
from daily_brief_service import get_daily_brief, create_daily_brief
import datetime as _dt
app = FastAPI(title="Startup News – Daily Brief API")


@app.get("/daily-brief", response_model=List[Dict[str, Any]])
async def read_daily_brief(date: Optional[str] = Query(None, description="ISO date (YYYY-MM-DD). Defaults to today."), generate_if_missing: bool = Query(False, description="If true, generate the brief via LLM when not found.")):

    if date is None:
        date = _dt.date.today().isoformat()
        print(f"No date provided, using today's date: {date}")

    try:
        _dt.date.fromisoformat(date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    brief = await get_daily_brief(date)

    print(f'brief: {brief}')

    if not brief:
        raise HTTPException(status_code=500, detail="No brief found for the given date.")

    return brief