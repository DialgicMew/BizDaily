import sqlite3


DB_FILE = "funding_data.db"

FUNDING_TABLE_SCHEMA = """
CREATE TABLE IF NOT EXISTS funding (
    funding_uuid          INTEGER PRIMARY KEY,
    company_uuid          TEXT,
    company_name          TEXT,
    funded_company_name   TEXT,
    company_location      TEXT,
    funded_city           TEXT,
    funded_state          TEXT,
    funded_country        TEXT,
    funding_name          TEXT,
    transaction_name      TEXT,
    funding_date          TEXT,
    funding_date_timestamp INTEGER,
    funding_amount        REAL,
    amount_raised         REAL,
    amount_raised_in_usd  REAL,
    currency              TEXT,
    funding_stage         TEXT,
    funding_type          TEXT,
    investment_stage      TEXT,
    investor_count        INTEGER,
    total_investor_count  INTEGER,
    investor_names        TEXT,
    lead_investors        TEXT,
    sector                TEXT,
    sub_sector            TEXT,
    article_url           TEXT,
    source                TEXT,
    data_created_date     TEXT,
    created_date          TEXT,
    document_updated_at   TEXT
);
"""

COMPANY_DETAILS_TABLE_SCHEMA = """
CREATE TABLE IF NOT EXISTS company_details (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    funding_uuid      INTEGER,
    company_name      TEXT,
    generated_on      TEXT,
    valuation         TEXT,
    funding_round     TEXT,
    use_of_funds      TEXT,
    why_problem       TEXT,
    what_solution     TEXT,
    how_execution     TEXT,
    customer_segment  TEXT,
    founders_team_dna TEXT,
    traction_snapshot TEXT,
    competitive_edge  TEXT,
    pivots            TEXT,
    key_risks_open_questions TEXT,
    sources           TEXT,
    created_at        TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
"""

def init_funding_db(db_path: str = DB_FILE) -> sqlite3.Connection:
    """Create/connect to the SQLite DB and ensure the `funding` table exists."""
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute(FUNDING_TABLE_SCHEMA)
    conn.execute(COMPANY_DETAILS_TABLE_SCHEMA)
    conn.commit()
    return conn