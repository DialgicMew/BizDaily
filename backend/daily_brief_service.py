from __future__ import annotations

import datetime as _dt
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Any

from db_connection_manager import init_funding_db
from funding_manager import fetch_companies_funded_on_date
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

async def get_multiple_company_details_async(companies: List[str], companies_funded_today_name_uuid) -> List[Dict[str, Any]]:
    """Process multiple companies in parallel for maximum efficiency."""
    
    async def process_single_company(company: str) -> Dict[str, Any]:
        """Process a single company: get LLM details and store in database."""
        try:
            # Get LLM details (async)
            company_name, company_detail = await get_company_details(company)
            
            # Store in database (in thread pool)
            def store_details():
                conn = init_funding_db()
                try:
                    return single_insert_company_details(
                        conn=conn, 
                        detail=company_detail, 
                        name_to_uuid=companies_funded_today_name_uuid, 
                        company_name=company_name
                    )
                finally:
                    conn.close()
            
            loop = asyncio.get_event_loop()
            inserted_row = await loop.run_in_executor(brief_db_executor, store_details)
            
            print(f"✅ Processed and stored details for {company}")
            return inserted_row
            
        except Exception as e:
            print(f"❌ Failed to process {company}: {str(e)}")
            # Return a minimal record for failed companies
            return {
                "company_name": company,
                "error": f"Failed to process: {str(e)}",
                "generated_on": None
            }
    
    # Process all companies in parallel using asyncio.gather
    print(f"🚀 Processing {len(companies)} companies in parallel...")
    tasks = [process_single_company(company) for company in companies]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Filter out exceptions and return successful results
    companies_detail = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            print(f"❌ Exception processing {companies[i]}: {result}")
            # Add error record
            companies_detail.append({
                "company_name": companies[i],
                "error": str(result),
                "generated_on": None
            })
        else:
            companies_detail.append(result)
    
    print(f"✅ Completed processing {len(companies_detail)} companies")
    return companies_detail

# Backward compatibility wrapper
def get_multiple_company_details(companies: List[str], funding_conn, companies_funded_today_name_uuid) -> List[Dict[str, Any]]:
    """Synchronous wrapper for backward compatibility."""
    return asyncio.run(get_multiple_company_details_async(companies, companies_funded_today_name_uuid))
