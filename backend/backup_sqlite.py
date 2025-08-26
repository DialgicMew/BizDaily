#!/usr/bin/env python3
"""
SQLite Backup Script
Creates a timestamped backup of your SQLite database
"""
import os
import shutil
import sqlite3
from datetime import datetime

def backup_sqlite_data():
    """Create backup of SQLite database with timestamp."""
    db_file = "funding_data.db"
    
    if not os.path.exists(db_file):
        print(f"❌ Database file not found: {db_file}")
        return False
    
    # Create backup filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"funding_data_backup_{timestamp}.db"
    
    try:
        # Copy the database file
        shutil.copy2(db_file, backup_file)
        
        # Get database info
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM funding")
        funding_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM company_details")
        details_count = cursor.fetchone()[0]
        
        conn.close()
        
        file_size = os.path.getsize(backup_file) / (1024 * 1024)  # MB
        
        print("✅ BACKUP CREATED SUCCESSFULLY!")
        print(f"   📁 File: {backup_file}")
        print(f"   📊 Funding records: {funding_count}")
        print(f"   📋 Company details: {details_count}")
        print(f"   💾 Size: {file_size:.2f} MB")
        
        return True
        
    except Exception as e:
        print(f"❌ Backup failed: {e}")
        return False

if __name__ == "__main__":
    print("🗃️  Creating SQLite backup...")
    backup_sqlite_data()
