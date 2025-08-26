import os
import sqlite3
from typing import Union

# Import PostgreSQL adapter (only when needed)
try:
    import psycopg2
    import psycopg2.extras
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False

DB_FILE = "funding_data.db"

# SQLite schemas
FUNDING_TABLE_SCHEMA_SQLITE = """
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

COMPANY_DETAILS_TABLE_SCHEMA_SQLITE = """
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

# PostgreSQL schemas  
FUNDING_TABLE_SCHEMA_POSTGRES = """
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

COMPANY_DETAILS_TABLE_SCHEMA_POSTGRES = """
CREATE TABLE IF NOT EXISTS company_details (
    id                SERIAL PRIMARY KEY,
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
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

def init_funding_db(db_path: str = DB_FILE) -> Union[sqlite3.Connection, 'psycopg2.connection']:
    """Create/connect to database (PostgreSQL in production, SQLite locally) and ensure tables exist."""
    
    # Check for PostgreSQL DATABASE_URL (Railway provides this automatically)
    database_url = os.getenv('DATABASE_URL')
    
    if database_url and POSTGRES_AVAILABLE:
        print("🐘 Using PostgreSQL database")
        # Production: Use PostgreSQL
        conn = psycopg2.connect(database_url)
        # Use RealDictCursor for dict-like row access (similar to SQLite)
        conn.cursor_factory = psycopg2.extras.RealDictCursor
        
        # Create tables
        with conn.cursor() as cur:
            cur.execute(FUNDING_TABLE_SCHEMA_POSTGRES)
            cur.execute(COMPANY_DETAILS_TABLE_SCHEMA_POSTGRES)
        conn.commit()
        
        print("✅ PostgreSQL tables created/verified")
        return conn
    else:
        print("🗃️  Using SQLite database (local development)")
        # Local development: Use SQLite
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row  # Makes rows dict-like
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute(FUNDING_TABLE_SCHEMA_SQLITE)
        conn.execute(COMPANY_DETAILS_TABLE_SCHEMA_SQLITE)
        conn.commit()
        
        print("✅ SQLite tables created/verified")
        return conn