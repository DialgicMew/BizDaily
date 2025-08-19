"""database.py – structured storage helper for Inc42 funding data.

This module defines the SQLite schema for the `funding` table and provides
convenience functions to initialise the database and bulk-insert records that
come directly from the Inc42 API.
"""
from __future__ import annotations

from datetime import datetime, timezone
import sqlite3
from typing import Any, Dict, List


INSERT_SQL = """
INSERT OR IGNORE INTO funding (
    funding_uuid,
    company_uuid,
    company_name,
    funded_company_name,
    company_location,
    funded_city,
    funded_state,
    funded_country,
    funding_name,
    transaction_name,
    funding_date,
    funding_date_timestamp,
    funding_amount,
    amount_raised,
    amount_raised_in_usd,
    currency,
    funding_stage,
    funding_type,
    investment_stage,
    investor_count,
    total_investor_count,
    investor_names,
    lead_investors,
    sector,
    sub_sector,
    article_url,
    source,
    created_date,
    document_updated_at,
    data_created_date
) VALUES (
    ?,?,?,?,?,?,?,?,?,?,
    ?,?,?,?,?,?,?,?,?,?,
    ?,?,?,?,?,?,?,?,?,?
);
"""

def flatten_record(rec: Dict[str, Any]) -> List[Any]:
    """Extract ordered column values from a raw API record dict."""
    data_created_date = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%fZ')
    return [
        rec.get("funding_uuid"),
        rec.get("company_uuid"),
        rec.get("company_name"),
        rec.get("funded_company_name"),
        rec.get("company_location"),
        rec.get("funded_city"),
        rec.get("funded_state"),
        rec.get("funded_country"),
        rec.get("funding_name"),
        rec.get("transaction_name"),
        rec.get("funding_date"),
        rec.get("funding_date_timestamp"),
        rec.get("funding_amount"),
        rec.get("amount_raised"),
        rec.get("amount_raised_in_usd"),
        rec.get("currency"),
        rec.get("funding_stage"),
        rec.get("funding_type"),
        rec.get("investment_stage"),
        rec.get("investor_count"),
        rec.get("total_investor_count"),
        rec.get("investor_names"),
        rec.get("lead_investors"),
        rec.get("sector") or rec.get("company_sector"),
        rec.get("sub_sector"),
        rec.get("article_url"),
        rec.get("source"),
        rec.get("created_date"),
        rec.get("document_updated_at"),
        data_created_date
    ]


def save_records(conn, records: List[dict]):
    """Wrapper around bulk_insert from database.py for clarity."""
    bulk_insert(conn, records)
    
def bulk_insert(conn: sqlite3.Connection, records: List[Dict[str, Any]]) -> None:
    """Insert a list of funding dicts in one transaction (ignores duplicates)."""
    rows = [flatten_record(r) for r in records]
    with conn:
        conn.executemany(INSERT_SQL, rows)

def fetch_companies_funded_on_date(
    conn: sqlite3.Connection,
    target_date_iso: str,
) -> Dict[str, int]:
    
    print(target_date_iso)

    cur = conn.execute(
        """
        SELECT funding_uuid,
               IFNULL(company_name, funded_company_name) AS name
          FROM funding
         WHERE date(funding_date) = ?
        """,
        (target_date_iso,),
    )

    rows = cur.fetchall()

    name_to_uuid: Dict[str, int] = {}
    for funding_uuid, name in rows:
        if name:
            if name not in name_to_uuid or funding_uuid > name_to_uuid[name]:
                name_to_uuid[name] = funding_uuid

    return name_to_uuid

def fetch_latest_funding_record(conn: sqlite3.Connection) -> Dict[str, Any] | None:
    # Configure row factory for dict-like access
    conn.row_factory = sqlite3.Row  # type: ignore[assignment]
    
    cur = conn.execute(
        """
        SELECT *
          FROM funding
         ORDER BY funding_uuid DESC
         LIMIT 1
        """
    )
    
    row = cur.fetchone()
    return dict(row) if row else None
