from __future__ import annotations

import datetime as _dt
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Any, Tuple

from db_connection_manager import init_funding_db
from funding_manager import fetch_companies_funded_on_date
from llm_service import get_company_details
from company_detail_manager import (
    single_insert as single_insert_company_details,
    fetch_details_by_funding_uuid
)

# Create thread pools for async operations
brief_db_executor = ThreadPoolExecutor(max_workers=3, thread_name_prefix="brief_db")
# Separate pool for the per-company DB writes fanned out from get_multiple_company_details_async.
# Those run concurrently with the initial brief_db_executor lookup within the same request —
# sharing one pool between them would let concurrent /daily-brief requests starve each other
# once all slots are busy.
company_store_executor = ThreadPoolExecutor(max_workers=3, thread_name_prefix="company_store")


async def get_daily_brief(target_date: str | _dt.date) -> List[Dict[str, Any]]:
    if isinstance(target_date, _dt.date):
        target_date = target_date.isoformat()

    print(f"Fetching details for date: {target_date}")

    def lookup_companies() -> Tuple[List[Dict[str, Any]], Dict[str, int], List[str]]:
        """Fetch companies funded on this date and split into (has details, needs details).

        Runs in a thread since it's blocking psycopg2 I/O — nothing async here, so no
        nested event loop is needed (that pattern is what used to cause hangs).
        """
        funding_conn = init_funding_db()
        try:
            companies_funded_today_name_uuid = fetch_companies_funded_on_date(funding_conn, target_date)
            if not companies_funded_today_name_uuid:
                print("No funding records found in database")
                return [], {}, []

            print(f"Found {len(companies_funded_today_name_uuid)} companies funded on {target_date}")

            companies_with_existing_details = []
            companies_needing_details = []
            for company_name, funding_uuid in companies_funded_today_name_uuid.items():
                existing_detail = fetch_details_by_funding_uuid(funding_conn, funding_uuid)
                if existing_detail:
                    companies_with_existing_details.append(existing_detail)
                else:
                    companies_needing_details.append(company_name)

            return companies_with_existing_details, companies_funded_today_name_uuid, companies_needing_details
        finally:
            funding_conn.close()

    loop = asyncio.get_event_loop()
    companies_with_existing_details, companies_funded_today_name_uuid, companies_needing_details = (
        await loop.run_in_executor(brief_db_executor, lookup_companies)
    )

    if not companies_funded_today_name_uuid:
        return []

    new_details: List[Dict[str, Any]] = []
    if companies_needing_details:
        print(f"Fetching details for {len(companies_needing_details)} companies")
        new_details = await get_multiple_company_details_async(companies_needing_details, companies_funded_today_name_uuid)

    print(f"Existing details: {len(companies_with_existing_details)}")
    print(f"New details: {len(new_details)}")

    return companies_with_existing_details + new_details


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
            inserted_row = await loop.run_in_executor(company_store_executor, store_details)

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
