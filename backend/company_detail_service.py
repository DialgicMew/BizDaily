"""
Company Detail Service - Business logic for fetching and generating company details.

This service handles the logic of:
1. Checking if company details exist in the database
2. If not, generating them using the LLM service
3. Storing the generated details in the database
4. Returning the company details
"""
from __future__ import annotations
from typing import Dict, Any, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor
from db_connection_manager import init_funding_db
from company_detail_manager import (
    fetch_details_by_funding_uuid,
    get_company_name_by_funding_uuid,
    store_company_details
)
from llm_service import get_company_details

# Create a thread pool for database operations
db_executor = ThreadPoolExecutor(max_workers=5, thread_name_prefix="db_worker")
llm_executor = ThreadPoolExecutor(max_workers=3, thread_name_prefix="llm_worker")

def _db_operation(func, *args, **kwargs):
    """Execute a database operation in a thread."""
    return func(*args, **kwargs)

def _llm_operation(func, *args, **kwargs):
    """Execute an LLM operation in a thread."""
    return func(*args, **kwargs)

async def get_company_details_by_funding_uuid(funding_uuid: int, generate_if_missing: bool = True) -> Dict[str, Any] | None:
    """
    Async version of get_company_details_by_funding_uuid that runs database and LLM operations
    in separate threads to avoid blocking the FastAPI event loop.
    """
    
    # Step 1: Check if details already exist (run in thread pool)
    loop = asyncio.get_event_loop()
    
    def check_existing_details():
        conn = init_funding_db()
        try:
            return fetch_details_by_funding_uuid(conn, funding_uuid)
        finally:
            conn.close()
    
    existing_details = await loop.run_in_executor(db_executor, check_existing_details)
    
    if existing_details:
        print(f"Found existing company details for funding_uuid: {funding_uuid}")
        return existing_details
        
    # Step 2: If details don't exist and generation not requested, return None
    if not generate_if_missing:
        print(f"No existing details found for funding_uuid: {funding_uuid}, generation not requested")
        return None
        
    # Step 3: Get company name from funding table (run in thread pool)
    def get_company_name():
        conn = init_funding_db()
        try:
            return get_company_name_by_funding_uuid(conn, funding_uuid)
        finally:
            conn.close()
    
    company_name = await loop.run_in_executor(db_executor, get_company_name)
    
    if not company_name:
        raise ValueError(f"Funding UUID {funding_uuid} not found in funding table")
        
    print(f"No existing details found. Generating details for company: {company_name}")
    
    # Step 4: Generate details using LLM service (run in thread pool)
    print(f"Generating details for company: {company_name}, funding_uuid: {funding_uuid}")
    try:
        llm_details = await loop.run_in_executor(
            llm_executor, 
            _llm_operation, 
            get_company_details, 
            company_name
        )
        
        if not llm_details:
            raise Exception("LLM service returned empty details")
            
    except Exception as e:
        raise Exception(f"Failed to generate company details using LLM: {str(e)}")
    
    # Step 5: Store generated details in database (run in thread pool)
    print(f"Storing details for company: {company_name}, funding_uuid: {funding_uuid}")
    
    def store_details():
        conn = init_funding_db()
        try:
            return store_company_details(conn, funding_uuid, company_name, llm_details)
        finally:
            conn.close()
    
    storage_success = await loop.run_in_executor(db_executor, store_details)
    
    if not storage_success:
        raise Exception("Failed to store company details in database")
        
    print(f"Successfully generated and stored company details for: {company_name}")
    
    # Step 6: Fetch and return the stored details (run in thread pool)
    def fetch_stored_details():
        conn = init_funding_db()
        try:
            return fetch_details_by_funding_uuid(conn, funding_uuid)
        finally:
            conn.close()
    
    stored_details = await loop.run_in_executor(db_executor, fetch_stored_details)
    
    if not stored_details:
        raise Exception("Failed to retrieve stored company details")
        
    return stored_details