from __future__ import annotations

import datetime as _dt
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Any

from db_connection_manager import init_funding_db
from funding_manager import fetch_companies_funded_on_date, fetch_latest_funding_record
from llm_service import get_company_details
from company_detail_manager import (
    single_insert as single_insert_company_details,
    fetch_details_by_funding_uuid
)

# Create thread pools for async operations
brief_db_executor = ThreadPoolExecutor(max_workers=3, thread_name_prefix="brief_db")
brief_llm_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="brief_llm")


def create_daily_brief() -> List[Dict[str, Any]]:
    
    funding_conn = init_funding_db()
    
    try:
        # Get today's date in ISO format
        today_iso = _dt.date.today().isoformat()
        companies_funded_today_name_uuid = fetch_companies_funded_on_date(funding_conn, today_iso)

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

    def get_latest_funded_companies():
        funding_conn = init_funding_db()
        try:
            return _get_latest_funded_companies(funding_conn, target_date)
        finally:
            funding_conn.close()
    
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(brief_db_executor, get_latest_funded_companies)

def _get_latest_funded_companies(funding_conn, target_date: str) -> List[Dict[str, Any]]:

    # Step 1: Fetch companies funded today from funding_manager
    companies_funded_today_name_uuid = fetch_companies_funded_on_date(funding_conn, target_date)
    
    if not companies_funded_today_name_uuid:
        print(f"No funding entries for date: {target_date}, trying latest available date")
        latest_funding_record = fetch_latest_funding_record(funding_conn)
        if latest_funding_record:
            # Use the date from the latest funding record
            fallback_date = latest_funding_record['funding_date'][:10]  # Extract YYYY-MM-DD part
            print(f"Using fallback date: {fallback_date}")
            companies_funded_today_name_uuid = fetch_companies_funded_on_date(funding_conn, fallback_date)
        else:
            print("No funding records found in database")
            return []

    
    print(f"Found {len(companies_funded_today_name_uuid)} companies funded on {target_date}")
    
    # Step 2: Check which companies already have details in company_details table
    companies_with_existing_details = []
    companies_needing_details = []

    print(f"Fetching details for {companies_funded_today_name_uuid}")
    
    for company_name, funding_uuid in companies_funded_today_name_uuid.items():
        existing_detail = fetch_details_by_funding_uuid(funding_conn, funding_uuid)
        if existing_detail:
            companies_with_existing_details.append(existing_detail)
            print(f"Found existing details for {funding_uuid} - {company_name}")
        else:
            companies_needing_details.append(company_name)
            print(f"Need to fetch details for {funding_uuid} - {company_name}")
    
    # Step 3: For companies without existing details, call get_multiple_company_details
    companies_needing_details_result = []
    if companies_needing_details:
        print(f"Fetching details for {len(companies_needing_details)} companies")
        companies_needing_details_result = get_multiple_company_details(
            companies_needing_details, 
            funding_conn, 
            companies_funded_today_name_uuid
        )

    # print(f"New details produced: {companies_needing_details_result}")
    
    # Step 4: Compile all results
    all_results = companies_with_existing_details + companies_needing_details_result
    
    # print(f"Total results compiled: {all_results}")
    print(f"Existing details: {len(companies_with_existing_details)}")
    print(f"New details: {len(companies_needing_details_result)}")
    
    return all_results

def get_multiple_company_details(companies: List[str], funding_conn, companies_funded_today_name_uuid) -> List[Dict[str, Any]]:
    companies_detail = []
    for company in companies:
        company_name, company_detail = get_company_details(company)
        with funding_conn:
            inserted_row = single_insert_company_details(conn=funding_conn, detail=company_detail, name_to_uuid=companies_funded_today_name_uuid, company_name=company_name)
        companies_detail.append(inserted_row)
        print(f"Stored company details for {company}.")
    return companies_detail
