#!/usr/bin/env python3
"""
Data Migration Script: SQLite → PostgreSQL
Migrates all data from local SQLite to Railway PostgreSQL
"""
import os
import sqlite3
import sys
from typing import List, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("❌ psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)

def get_sqlite_connection(db_path: str = "funding_data.db") -> sqlite3.Connection:
    """Connect to SQLite database."""
    if not os.path.exists(db_path):
        print(f"❌ SQLite database not found: {db_path}")
        sys.exit(1)
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # Makes rows dict-like
    return conn

def get_postgres_connection() -> psycopg2.connection:
    """Connect to PostgreSQL database."""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        print("   Make sure you're running this with Railway PostgreSQL configured")
        sys.exit(1)
    
    try:
        conn = psycopg2.connect(database_url)
        conn.cursor_factory = psycopg2.extras.RealDictCursor
        return conn
    except Exception as e:
        print(f"❌ Failed to connect to PostgreSQL: {e}")
        sys.exit(1)

def migrate_funding_data(sqlite_conn: sqlite3.Connection, postgres_conn: psycopg2.connection, dry_run: bool = True) -> int:
    """Migrate funding table data."""
    print(f"🔄 {'[DRY RUN] ' if dry_run else ''}Migrating funding data...")
    
    # Get all data from SQLite
    sqlite_cursor = sqlite_conn.cursor()
    sqlite_cursor.execute("SELECT * FROM funding ORDER BY funding_uuid")
    rows = sqlite_cursor.fetchall()
    
    if not rows:
        print("   ⚠️  No funding data to migrate")
        return 0
    
    print(f"   📊 Found {len(rows)} funding records")
    
    if not dry_run:
        postgres_cursor = postgres_conn.cursor()
        
        # Clear existing data (optional - comment out if you want to preserve)
        postgres_cursor.execute("DELETE FROM funding")
        print("   🗑️  Cleared existing funding data")
        
        # Insert data
        for i, row in enumerate(rows, 1):
            # Convert SQLite row to dict
            row_dict = dict(row)
            
            # Prepare INSERT statement
            columns = list(row_dict.keys())
            placeholders = ', '.join(['%s'] * len(columns))
            values = list(row_dict.values())
            
            insert_sql = f"""
                INSERT INTO funding ({', '.join(columns)}) 
                VALUES ({placeholders})
                ON CONFLICT (funding_uuid) DO NOTHING
            """
            
            postgres_cursor.execute(insert_sql, values)
            
            if i % 100 == 0:
                print(f"   📈 Migrated {i}/{len(rows)} records...")
        
        postgres_conn.commit()
        print(f"   ✅ Successfully migrated {len(rows)} funding records")
    
    return len(rows)

def migrate_company_details(sqlite_conn: sqlite3.Connection, postgres_conn: psycopg2.connection, dry_run: bool = True) -> int:
    """Migrate company_details table data."""
    print(f"🔄 {'[DRY RUN] ' if dry_run else ''}Migrating company details data...")
    
    # Get all data from SQLite
    sqlite_cursor = sqlite_conn.cursor()
    sqlite_cursor.execute("SELECT * FROM company_details ORDER BY id")
    rows = sqlite_cursor.fetchall()
    
    if not rows:
        print("   ⚠️  No company details to migrate")
        return 0
    
    print(f"   📊 Found {len(rows)} company detail records")
    
    if not dry_run:
        postgres_cursor = postgres_conn.cursor()
        
        # Clear existing data (optional)
        postgres_cursor.execute("DELETE FROM company_details")
        print("   🗑️  Cleared existing company details")
        
        # Insert data (exclude 'id' since PostgreSQL uses SERIAL)
        for i, row in enumerate(rows, 1):
            row_dict = dict(row)
            # Remove the SQLite 'id' field - PostgreSQL will auto-generate
            row_dict.pop('id', None)
            
            columns = list(row_dict.keys())
            placeholders = ', '.join(['%s'] * len(columns))
            values = list(row_dict.values())
            
            insert_sql = f"""
                INSERT INTO company_details ({', '.join(columns)}) 
                VALUES ({placeholders})
            """
            
            postgres_cursor.execute(insert_sql, values)
            
            if i % 50 == 0:
                print(f"   📈 Migrated {i}/{len(rows)} records...")
        
        postgres_conn.commit()
        print(f"   ✅ Successfully migrated {len(rows)} company detail records")
    
    return len(rows)

def verify_migration(postgres_conn: psycopg2.connection):
    """Verify the migration was successful."""
    print("🔍 Verifying migration...")
    
    cursor = postgres_conn.cursor()
    
    # Check funding table
    cursor.execute("SELECT COUNT(*) FROM funding")
    funding_count = cursor.fetchone()[0]
    print(f"   📊 PostgreSQL funding records: {funding_count}")
    
    # Check company_details table  
    cursor.execute("SELECT COUNT(*) FROM company_details")
    details_count = cursor.fetchone()[0]
    print(f"   📊 PostgreSQL company detail records: {details_count}")
    
    # Show sample data
    cursor.execute("SELECT company_name, funding_stage FROM funding LIMIT 3")
    samples = cursor.fetchall()
    if samples:
        print("   🔍 Sample funding records:")
        for sample in samples:
            print(f"     - {sample['company_name']} ({sample['funding_stage']})")

def main():
    print("🚀 BizDaily Data Migration: SQLite → PostgreSQL")
    print("=" * 50)
    
    # Get command line argument for dry run
    dry_run = True
    if len(sys.argv) > 1 and sys.argv[1] == '--execute':
        dry_run = False
        print("⚠️  EXECUTING MIGRATION (not a dry run)")
    else:
        print("🧪 DRY RUN MODE (no data will be changed)")
        print("   Use --execute flag to perform actual migration")
    
    print()
    
    # Connect to databases
    print("🔌 Connecting to databases...")
    sqlite_conn = get_sqlite_connection()
    postgres_conn = get_postgres_connection()
    print("   ✅ Connected to SQLite and PostgreSQL")
    
    try:
        # Migrate data
        funding_migrated = migrate_funding_data(sqlite_conn, postgres_conn, dry_run)
        details_migrated = migrate_company_details(sqlite_conn, postgres_conn, dry_run)
        
        if not dry_run:
            verify_migration(postgres_conn)
            
            print()
            print("🎉 MIGRATION COMPLETED SUCCESSFULLY!")
            print(f"   📊 Total records migrated: {funding_migrated + details_migrated}")
            print("   🐘 Your app now uses PostgreSQL in production")
        else:
            print()
            print("✅ DRY RUN COMPLETED")
            print(f"   📊 Ready to migrate: {funding_migrated + details_migrated} records")
            print("   🔄 Run with --execute flag to perform migration")
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        if not dry_run:
            postgres_conn.rollback()
        sys.exit(1)
    finally:
        sqlite_conn.close()
        postgres_conn.close()

if __name__ == "__main__":
    main()
