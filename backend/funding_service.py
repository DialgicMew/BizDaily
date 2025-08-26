# Built-in
import json
import time
from typing import List, Tuple, Dict, Any, Optional
from db_connection_manager import init_funding_db
from funding_manager import bulk_insert, save_records
from inc42Client import fetch_page

# No parameter conversion needed - using PostgreSQL natively


def format_funding_row(row: Dict[str, Any]) -> Dict[str, Any]:
    """Format a raw database row for frontend consumption."""
    formatted = row.copy()
    
    # Handle null values - replace None with empty string or appropriate defaults
    for key, value in formatted.items():
        if value is None:
            formatted[key] = ""
    
    # Format currency amounts
    if 'amount_raised_in_usd' in formatted and formatted['amount_raised_in_usd']:
        try:
            amount = float(formatted['amount_raised_in_usd'])
            if amount >= 1_000_000:
                formatted['amount_raised_in_usd'] = f"${amount/1_000_000:.1f}M"
            elif amount >= 1_000:
                formatted['amount_raised_in_usd'] = f"${amount/1_000:.0f}K"
            else:
                formatted['amount_raised_in_usd'] = f"${amount:.0f}"
        except (ValueError, TypeError):
            formatted['amount_raised_in_usd'] = "N/A"
    
    # Format funding_date to ensure proper date format
    if 'funding_date' in formatted and formatted['funding_date']:
        try:
            # Ensure date is in YYYY-MM-DD format
            date_str = str(formatted['funding_date'])
            if len(date_str) >= 10:  # Basic validation
                formatted['funding_date'] = date_str[:10]  # Take first 10 chars (YYYY-MM-DD)
        except:
            formatted['funding_date'] = ""
    
    return formatted


def fetch_funding_data_filter(filters: Optional[List[Tuple[str, List[str]]]] = None, 
                              page: int = 0, page_size: int = 25, order_by: Optional[List[Tuple[str, str]]] = None,
                              search_query: Optional[str] = None) -> Dict[str, Any]:
    conn = init_funding_db()
    try:
        # Search fields for fuzzy matching
        search_fields = [
            'company_name', 'funded_company_name', 'sector', 'sub_sector',
            'investor_names', 'lead_investors', 'funding_stage', 'funding_type',
            'company_location', 'funded_city', 'funded_state', 'funded_country'
        ]
        
        # Build base queries with search relevance scoring
        if search_query and search_query.strip():
            # Build relevance score SQL for sorting - CASE INSENSITIVE
            relevance_parts = []
            search_term = f"%{search_query.strip().lower()}%"
            
            for field in search_fields:
                relevance_parts.append(f"CASE WHEN LOWER({field}) LIKE %s THEN 1 ELSE 0 END")
            
            relevance_sql = " + ".join(relevance_parts)
            sql = f"SELECT *, ({relevance_sql}) AS relevance_score FROM funding"
            count_sql = "SELECT COUNT(*) FROM funding"
        else:
            sql = "SELECT * FROM funding"
            count_sql = "SELECT COUNT(*) FROM funding"
        
        params: List[Any] = []
        count_params: List[Any] = []

        # List of valid column names - PostgreSQL version
        with conn.cursor() as cur:
            cur.execute(
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'funding'"
            )
            rows = cur.fetchall()
            
            # Extract column names safely
            if rows and hasattr(rows[0], 'keys'):
                # It's a dict-like object (RealDictRow)
                valid_cols = {row['column_name'] for row in rows}
            elif rows:
                # It's a tuple/list
                valid_cols = {row[0] for row in rows}
            else:
                valid_cols = set()

        # IMPORTANT: Add relevance score parameters FIRST (for SELECT clause)
        if search_query and search_query.strip():
            search_term = f"%{search_query.strip().lower()}%"
            # Add relevance score parameters for main query FIRST
            for _ in search_fields:
                params.append(search_term)

        # Build WHERE clauses
        where_clauses = []
        
        # Add search conditions
        if search_query and search_query.strip():
            search_term = f"%{search_query.strip().lower()}%"
            search_conditions = []
            
            for field in search_fields:
                # Case insensitive search
                search_conditions.append(f"LOWER({field}) LIKE %s")
                params.append(search_term)  # Add WHERE clause parameters AFTER relevance
                count_params.append(search_term)
            
            where_clauses.append(f"({' OR '.join(search_conditions)})")

        # Add filter conditions
        if filters:
            for col, values in filters:
                if col not in valid_cols:
                    raise ValueError(f"Unknown filter column '{col}'.")
                if not values:
                    return {"data": [], "total": 0, "page": page, "page_size": page_size}
                placeholders = ",".join(["%s"] * len(values))
                where_clauses.append(f"{col} IN ({placeholders})")
                params.extend(values)
                count_params.extend(values)

        # Apply WHERE clause if any conditions exist
        if where_clauses:
            where_clause = " WHERE " + " AND ".join(where_clauses)
            sql += where_clause
            count_sql += where_clause

        # Get total count for pagination
        with conn.cursor() as cur_count:
            cur_count.execute(count_sql, count_params)
            count_result = cur_count.fetchone()
            # PostgreSQL with RealDictCursor returns dict-like objects
            if hasattr(count_result, 'keys'):
                total = count_result['count']
            else:
                total = count_result[0]

        # Build ORDER BY clause
        if search_query and search_query.strip():
            # When search query is present, order by relevance first
            if order_by:
                # Basic validation: ensure ASC/DESC only
                parts = ["relevance_score DESC"]
                for col, direction in order_by:
                    direction_up = direction.upper()
                    if direction_up not in ("ASC", "DESC"):
                        raise ValueError(f"Invalid sort direction '{direction}'. Use 'ASC' or 'DESC'.")
                    parts.append(f"{col} {direction_up}")
                sql += " ORDER BY " + ", ".join(parts)
            else:
                sql += " ORDER BY relevance_score DESC, funding_date DESC, funding_uuid DESC"
        else:
            # No search query, use regular ordering
            if order_by:
                # Basic validation: ensure ASC/DESC only
                parts = []
                for col, direction in order_by:
                    direction_up = direction.upper()
                    if direction_up not in ("ASC", "DESC"):
                        raise ValueError(f"Invalid sort direction '{direction}'. Use 'ASC' or 'DESC'.")
                    parts.append(f"{col} {direction_up}")
                sql += " ORDER BY " + ", ".join(parts)
            else:
                sql += " ORDER BY funding_date DESC, funding_uuid DESC"

        # Add pagination to query
        sql += " LIMIT %s OFFSET %s"
        params.extend([page_size, page * page_size])

        with conn.cursor() as cur:
            cur.execute(sql, params)
            # RealDictCursor already returns dict-like objects, just convert to regular dicts
            raw_rows = [dict(row) for row in cur.fetchall()]

        # Format data for frontend consumption
        rows = []
        for row in raw_rows:
            formatted_row = format_funding_row(row)
            rows.append(formatted_row)

        # Remove relevance_score from results if it exists (used only for sorting)
        if search_query and search_query.strip():
            for row in rows:
                row.pop('relevance_score', None)

        return {
            "data": rows,
            "total": total,
            "page": page,
            "page_size": page_size
        }
    finally:
        conn.close()

def bulk_save_funding_data():
    conn = init_funding_db()
    cur = conn.cursor()
    page_idx = 0
    total_pages = 399
    count_of_no_updates = 0

    while True:
        api_response = fetch_page(page_idx)

        # Ensure we got a JSON object/dict
        if not isinstance(api_response, dict):
            print(f"Unexpected API response type {type(api_response)} at page {page_idx}. Skipping page.")
            page_idx += 1
            continue

        # Extract data records safely, handling malformed structures
        try:
            response_section = api_response.get("response")
            if not isinstance(response_section, dict):
                raise ValueError("'response' field is not a dict")
            records = response_section.get("data", [])
        except Exception as e:
            print(f"Error extracting records at page {page_idx}: {e}")
            # Print first 1000 chars of the full API response for inspection
            print("Offending api_response snippet:", json.dumps(api_response)[:1000])
            page_idx += 1
            time.sleep(2)
            continue
        
        new_records = []
        for rec in records:
            funding_uuid = rec.get("funding_uuid")
            if funding_uuid is None:
                continue

            cur.execute("SELECT 1 FROM funding WHERE funding_uuid = %s LIMIT 1;", (funding_uuid,))
            if cur.fetchone() is None:
                new_records.append(rec)
                
        if new_records:
            save_records(conn, new_records)
            print(f"Inserted {len(new_records)} new funding record(s).")
            count_of_no_updates = 0
        else:
            print("Database already up-to-date – no new funding records.")
            count_of_no_updates += 1

        if count_of_no_updates > 10:
            print("No updates for 10 pages in a row. Stopping.")
            break

        print(f"Fetched and saved page {page_idx}/{total_pages}")

        page_idx += 1
        if page_idx >= total_pages:
            print("Fetched all pages.")
            break

        # Be nice to the API – wait 2 seconds between each request to avoid rate-limiting
        time.sleep(0.2)

    conn.close()
    print("Database created/updated successfully.")

def check_updates_to_funding_data():
    conn = init_funding_db()
    try:
        api_response = fetch_page(0)
        if not isinstance(api_response, dict):
            print("Malformed API response when checking updates – aborting.")
            return

        response_section = api_response.get("response", {})
        records = response_section.get("data", []) if isinstance(response_section, dict) else []

        if not records:
            print("No records found in latest API response – nothing to update.")
            return

        cur = conn.cursor()
        new_records = []
        for rec in records:
            funding_uuid = rec.get("funding_uuid")
            if funding_uuid is None:
                continue

            cur.execute("SELECT 1 FROM funding WHERE funding_uuid = %s LIMIT 1;", (funding_uuid,))
            if cur.fetchone() is None:
                new_records.append(rec)

        if new_records:
            save_records(conn, new_records)
            print(f"Inserted {len(new_records)} new funding record(s).")
        else:
            print("Database already up-to-date – no new funding records.")

    finally:
        conn.close()