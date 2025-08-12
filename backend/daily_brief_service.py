from __future__ import annotations

import datetime as _dt
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Any

from db_connection_manager import init_funding_db
from funding_manager import fetch_companies_funded_today
from llm_service import get_company_details
from company_detail_manager import (
    bulk_insert as bulk_insert_company_details,
    single_insert as single_insert_company_details,
    fetch_details_for_date as _fetch_details_for_date,
)

# Create thread pools for async operations
brief_db_executor = ThreadPoolExecutor(max_workers=3, thread_name_prefix="brief_db")
brief_llm_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="brief_llm")


def create_daily_brief() -> List[Dict[str, Any]]:
    
    funding_conn = init_funding_db()
    
    try:
        # Get today's date in ISO format
        today_iso = _dt.date.today().isoformat()
        companies_funded_today_name_uuid = fetch_companies_funded_today(funding_conn, today_iso)

        if not companies_funded_today_name_uuid:
            print("[daily_brief] No new funding entries for today – skipping brief generation.")
            return []

        companies: List[str] = list(companies_funded_today_name_uuid.keys())

        details_list: List[Dict[str, Any]] = get_multiple_company_details(companies, funding_conn, companies_funded_today_name_uuid)

        return details_list

    finally:    
        funding_conn.close()


async def get_daily_brief(target_date: str | _dt.date) -> List[Dict[str, Any]]:
    """Async version of get_daily_brief"""
    
    if isinstance(target_date, _dt.date):
        target_date = target_date.isoformat()

    print(f"Fetching details for date: {target_date}")

    def fetch_details():
        funding_conn = init_funding_db()
        try:
            return _fetch_details_for_date(funding_conn, target_date)
        finally:
            funding_conn.close()
    
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(brief_db_executor, fetch_details)

def get_multiple_company_details(companies: List[str], funding_conn, companies_funded_today_name_uuid) -> List[Dict[str, Any]]:
    companies_detail = []
    for company in companies:
        company_detail = get_company_details(company)
        with funding_conn:
            single_insert_company_details(conn=funding_conn, detail=company_detail, name_to_uuid=companies_funded_today_name_uuid)
        companies_detail.append(company_detail)
        print(f"Stored company details for {company}.")
    return companies_detail
