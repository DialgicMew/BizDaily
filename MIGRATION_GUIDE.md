# 🔄 Data Migration Guide: SQLite → PostgreSQL

## 📋 Overview

This guide helps you migrate your existing SQLite data to PostgreSQL on Railway while keeping your local development unchanged.

## 🎯 Migration Strategy

- **🗃️ Local Development**: Keep using SQLite (no changes needed)
- **🐘 Production**: Migrate to PostgreSQL on Railway
- **🔄 Automatic Detection**: Code switches between SQLite/PostgreSQL based on environment

## 📝 Step-by-Step Migration

### Step 1: Add PostgreSQL to Railway

1. **Go to Railway Dashboard** → Your BizDaily project
2. **Click "New Service"** → "Database" → "PostgreSQL"
3. **Deploy** - Railway automatically creates `DATABASE_URL`
4. **Wait 2-3 minutes** for PostgreSQL to be ready

### Step 2: Backup Your Local Data (Important!)

```bash
cd backend
python backup_sqlite.py
```

**Expected output:**
```
✅ BACKUP CREATED SUCCESSFULLY!
   📁 File: funding_data_backup_20240826_120000.db
   📊 Funding records: 1,234
   📋 Company details: 56
   💾 Size: 5.20 MB
```

### Step 3: Test Migration (Dry Run)

```bash
# Set your Railway PostgreSQL connection
export DATABASE_URL="postgresql://postgres:password@host:5432/railway"

# Run migration dry run
python migrate_data.py
```

**Expected output:**
```
🧪 DRY RUN MODE (no data will be changed)
🔌 Connecting to databases...
   ✅ Connected to SQLite and PostgreSQL
🔄 [DRY RUN] Migrating funding data...
   📊 Found 1,234 funding records
🔄 [DRY RUN] Migrating company details data...
   📊 Found 56 company detail records
✅ DRY RUN COMPLETED
   📊 Ready to migrate: 1,290 records
```

### Step 4: Execute Migration

```bash
# Perform actual migration
python migrate_data.py --execute
```

**Expected output:**
```
⚠️  EXECUTING MIGRATION (not a dry run)
🔄 Migrating funding data...
   📈 Migrated 100/1,234 records...
   📈 Migrated 200/1,234 records...
   ...
   ✅ Successfully migrated 1,234 funding records
🔄 Migrating company details data...
   ✅ Successfully migrated 56 company detail records

🔍 Verifying migration...
   📊 PostgreSQL funding records: 1,234
   📊 PostgreSQL company detail records: 56
   🔍 Sample funding records:
     - TechStart (Series A)
     - DataCorp (Seed Stage)
     - AICompany (Series B)

🎉 MIGRATION COMPLETED SUCCESSFULLY!
   📊 Total records migrated: 1,290
   🐘 Your app now uses PostgreSQL in production
```

### Step 5: Verify Production Deployment

```bash
# Test your Railway app
curl https://bizdaily-production.up.railway.app/health

# Should show PostgreSQL in the logs:
# "🐘 Using PostgreSQL database"
# "✅ PostgreSQL tables created/verified"
```

## 🛠️ Troubleshooting

### Problem: `DATABASE_URL` not found
**Solution**: 
1. Go to Railway Dashboard → Variables tab
2. Look for `DATABASE_URL` (auto-generated when you add PostgreSQL)
3. Copy the URL and export it locally: `export DATABASE_URL="postgresql://..."`

### Problem: Connection refused
**Solution**: 
1. Make sure PostgreSQL service is running in Railway
2. Wait 2-3 minutes after creating the database
3. Check Railway logs for PostgreSQL startup

### Problem: Migration script errors
**Solution**:
1. Make sure you're in the `/backend` directory
2. Install dependencies: `pip install psycopg2-binary python-dotenv`
3. Check your SQLite file exists: `ls -la funding_data.db`

## 🔄 Re-running Migration

If you need to migrate again (overwrites existing data):

```bash
# This will clear PostgreSQL tables and re-migrate
python migrate_data.py --execute
```

## 🗂️ What Gets Migrated

### Funding Table
- All funding records with complete metadata
- Company names, funding amounts, stages, dates
- Investor information, sectors, URLs

### Company Details Table
- Generated company insights and analysis
- LLM-generated content (problems, solutions, execution)
- Founder information, traction data
- Risk assessments and competitive analysis

## 🎉 Benefits After Migration

| Before (SQLite) | After (PostgreSQL) |
|----------------|-------------------|
| ~10 concurrent users | **100+ users** |
| Manual backups | **Automatic backups** |
| Local file storage | **Cloud database** |
| Limited queries | **Advanced SQL** |
| No monitoring | **Railway dashboard** |

## 📊 Local vs Production

After migration:

- **💻 Local Development**: Still uses SQLite (`funding_data.db`)
- **🌐 Production (Railway)**: Uses PostgreSQL automatically
- **🔄 Code**: Same code, automatic database switching

Your migration is complete! Your app now scales to handle many more users with a proper database. 🚀
