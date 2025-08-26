import os

# Import PostgreSQL adapter
try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    # This will be caught when the function is called, providing a clear error message
    psycopg2 = None

# Database schemas
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

def init_funding_db():
    """Create/connect to PostgreSQL database and ensure tables exist."""
    
    # Check if PostgreSQL adapter is available
    if psycopg2 is None:
        raise ImportError(
            "PostgreSQL adapter (psycopg2) is required. Install with: pip install psycopg2-binary"
        )
    
    # Get PostgreSQL DATABASE_URL (required)
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        raise ValueError(
            "DATABASE_URL environment variable is required for PostgreSQL connection. "
            "Please set DATABASE_URL to your PostgreSQL connection string."
        )
    
    print("🐘 Connecting to PostgreSQL database...")
    
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(database_url)
        # Use RealDictCursor for dict-like row access
        conn.cursor_factory = psycopg2.extras.RealDictCursor
        
        # Create tables
        with conn.cursor() as cur:
            cur.execute(FUNDING_TABLE_SCHEMA)
            cur.execute(COMPANY_DETAILS_TABLE_SCHEMA)
        conn.commit()
        
        print("✅ PostgreSQL database connected and tables verified")
        return conn
        
    except Exception as e:
        print(f"❌ Failed to connect to PostgreSQL database: {str(e)}")
        raise