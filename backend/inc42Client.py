import httpx
import asyncio
import time

API_URL = "https://datalabs-api.inc42.com/funding/new-search"

HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Origin": "https://inc42.com",
    "Referer": "https://inc42.com/",
    "Connection": "keep-alive",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
}


async def fetch_page_async(page_idx: int) -> dict:
    """Async version: Fetch a single page of data for the given page index."""
    payload = {
        "filter": {},
        "from": page_idx,
        "size": 25,
        "sortby": "funding_date",
        "sort": "desc",
    }
    retries = 0
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        while True:
            try:
                response = await client.post(API_URL, json=payload, headers=HEADERS)
                response.raise_for_status()
                return response.json()
            except (httpx.RequestError, httpx.HTTPStatusError, ValueError) as e:
                # Request failed or JSON couldn't be parsed; retry a few times
                retries += 1
                if retries > 3:
                    raise RuntimeError(f"Failed to fetch page index {page_idx} after 3 retries: {e}") from e
                wait_time = 0.5 * retries
                print(f"Error fetching page {page_idx}: {e}. Retrying in {wait_time} s ({retries}/3)…")
                await asyncio.sleep(wait_time)

def fetch_page(page_idx: int) -> dict:
    """Synchronous wrapper for backward compatibility."""
    return asyncio.run(fetch_page_async(page_idx))