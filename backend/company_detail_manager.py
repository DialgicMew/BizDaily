"""company_detail_manager.py – helpers for the `company_details` table."""
from __future__ import annotations

import sqlite3
from typing import List, Dict, Any

INSERT_SQL = """
INSERT INTO company_details (
    funding_uuid,
    company_name,
    generated_on,
    valuation,
    funding_round,
    use_of_funds,
    why_problem,
    what_solution,
    how_execution,
    customer_segment,
    founders_team_dna,
    traction_snapshot,
    competitive_edge,
    pivots,
    key_risks_open_questions,
    sources
) VALUES (
    ?,?,?,?,?,?,?,?,?,?,
    ?,?,?,?,?,?
);
"""

def single_insert(
    conn: sqlite3.Connection,
    detail: Dict[str, Any],
    name_to_uuid: Dict[str, int],
) -> int:
    company_name = detail.get("CompanyName")
    if not company_name:
        return 0  # skip malformed
    
    print(f"Single insert for: {company_name}")

    funding_uuid = name_to_uuid.get(company_name)
    if funding_uuid is None:
        print(f"Warning: No funding_uuid found for company '{company_name}', skipping insert")
        return 0  # skip when no matching funding_uuid

    row = (
        funding_uuid,
        company_name,
        detail.get("generated_on"),
        detail.get("Valuation"),
        detail.get("FundingRound"),
        detail.get("UseOfFunds"),
        detail.get("WhyProblem"),
        detail.get("WhatSolution"),
        detail.get("HowExecution"),
        detail.get("CustomerSegment"),
        detail.get("FoundersTeamDNA"),
        detail.get("TractionSnapshot"),
        detail.get("CompetitiveEdge"),
        detail.get("Pivots"),
        detail.get("KeyRisksOpenQuestions"),
        detail.get("Sources")
    )

    with conn:
        conn.execute(INSERT_SQL, row)

    return 1

def bulk_insert(
    conn: sqlite3.Connection,
    details_list: List[Dict[str, Any]],
    name_to_uuid: Dict[str, int],
) -> int:
    rows: List[tuple] = []
    skipped_count = 0
    
    for d in details_list:
        company_name = d.get("CompanyName")
        if not company_name:
            continue  # skip malformed

        funding_uuid = name_to_uuid.get(company_name)
        if funding_uuid is None:
            print(f"Warning: No funding_uuid found for company '{company_name}', skipping insert")
            skipped_count += 1
            continue  # skip when no matching funding_uuid

        rows.append(
            (
                funding_uuid,
                company_name,
                d.get("generated_on"),
                d.get("Valuation"),
                d.get("FundingRound"),
                d.get("UseOfFunds"),
                d.get("WhyProblem"),
                d.get("WhatSolution"),
                d.get("HowExecution"),
                d.get("CustomerSegment"),
                d.get("FoundersTeamDNA"),
                d.get("TractionSnapshot"),
                d.get("CompetitiveEdge"),
                d.get("Pivots"),
                d.get("KeyRisksOpenQuestions"),
                d.get("Sources")
            )
        )

    if skipped_count > 0:
        print(f"Skipped {skipped_count} entries due to missing funding_uuid")

    if not rows:
        return 0

    with conn:
        conn.executemany(INSERT_SQL, rows)

    return len(rows)


def fetch_details_by_funding_uuid(conn: sqlite3.Connection, funding_uuid: int) -> Dict[str, Any] | None:
    """Return company detail row for the given funding_uuid, or None if not found."""
    
    # Configure row factory for dict-like access
    conn.row_factory = sqlite3.Row  # type: ignore[assignment]

    cur = conn.execute(
        """
        SELECT *
          FROM company_details
         WHERE funding_uuid = ?
         LIMIT 1
        """,
        (funding_uuid,),
    )

    row = cur.fetchone()
    return dict(row) if row else None


def get_company_name_by_funding_uuid(conn: sqlite3.Connection, funding_uuid: int) -> str | None:
    """Get company name from funding table by funding_uuid."""
    
    cur = conn.execute(
        """
        SELECT company_name
          FROM funding
         WHERE funding_uuid = ?
         LIMIT 1
        """,
        (funding_uuid,),
    )
    
    row = cur.fetchone()
    return row[0] if row else None


def store_company_details(conn: sqlite3.Connection, funding_uuid: int, company_name: str, details: Dict[str, Any]) -> bool:
    """Store company details in the database with current timestamp."""
    
    from datetime import datetime
    
    # Add current timestamp and company name to details
    details_with_metadata = {
        "funding_uuid": funding_uuid,
        "company_name": company_name,
        "generated_on": datetime.now().isoformat(),
        **details  # This will include all the LLM-generated sections
    }
    
    # Create a mapping for single_insert (it expects name_to_uuid mapping)
    name_to_uuid = {company_name: funding_uuid}

    print(f"mapping for: {name_to_uuid}")
    
    try:
        inserted_count = single_insert(conn, details_with_metadata, name_to_uuid)
        return inserted_count > 0
    except Exception as e:
        print(f"Error storing company details: {e}")
        return False 