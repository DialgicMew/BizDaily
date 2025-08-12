# Built-in
import json
import time
from typing import List, Tuple, Dict, Any, Optional
from db_connection_manager import init_funding_db
from funding_manager import bulk_insert, save_records
from inc42Client import fetch_page


def fetch_funding_data_filter(filters: Optional[List[Tuple[str, List[str]]]] = None, 
                              page: int = 0, page_size: int = 25, order_by: Optional[List[Tuple[str, str]]] = None,) -> Dict[str, Any]:
    conn = init_funding_db()
    try:
        sql = "SELECT * FROM funding"
        count_sql = "SELECT COUNT(*) FROM funding"
        params: List[Any] = []
        count_params: List[Any] = []

        # List of valid column names (cache per connection)
        valid_cols = {row[1] for row in conn.execute("PRAGMA table_info(funding)")}

        if filters:
            clauses = []
            for col, values in filters:
                if col not in valid_cols:
                    raise ValueError(f"Unknown filter column '{col}'.")
                if not values:
                    return {"data": [], "total": 0, "page": page, "page_size": page_size}
                placeholders = ",".join(["?"] * len(values))
                clauses.append(f"{col} IN ({placeholders})")
                params.extend(values)
                count_params.extend(values)
            where_clause = " WHERE " + " AND ".join(clauses)
            sql += where_clause
            count_sql += where_clause

        # Get total count for pagination
        cur_count = conn.execute(count_sql, count_params if filters else [])
        total = cur_count.fetchone()[0]

        # Build ORDER BY clause
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
        sql += " LIMIT ? OFFSET ?"
        params.extend([page_size, page * page_size])

        cur = conn.execute(sql, params)
        columns = [desc[0] for desc in cur.description]
        rows = [dict(zip(columns, row)) for row in cur.fetchall()]

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

            cur.execute("SELECT 1 FROM funding WHERE funding_uuid = ? LIMIT 1;", (funding_uuid,))
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

            cur.execute("SELECT 1 FROM funding WHERE funding_uuid = ? LIMIT 1;", (funding_uuid,))
            if cur.fetchone() is None:
                new_records.append(rec)

        if new_records:
            save_records(conn, new_records)
            print(f"Inserted {len(new_records)} new funding record(s).")
        else:
            print("Database already up-to-date – no new funding records.")

    finally:
        conn.close()