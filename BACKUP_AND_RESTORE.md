# HireGrid Database Backup and Restore Guide

This guide describes how to protect, back up, and restore your PostgreSQL database on Neon prior to applying database migrations.

---

## 1. Instant Snapshot via Neon Branching (Recommended)

Neon supports instant zero-copy point-in-time branching. This is the fastest and safest safeguard.

### Method A: Via Neon Web Console
1. Log in to your [Neon Console](https://console.neon.tech).
2. Select your HireGrid project.
3. Navigate to the **Branches** tab.
4. Click **Create Branch**.
5. Name the branch: `backup_pre_platform_v8` (select your production branch as the parent).
6. Click **Create**.
7. If anything ever goes wrong, you can immediately point Render to this branch or restore from it with zero data loss.

### Method B: Via Neon CLI
```bash
neon branches create --name backup_pre_platform_v8
```

---

## 2. Point-in-Time Dump Backup (`pg_dump`)

You can create an offline standalone compressed snapshot using the provided backup script:

```bash
cd hire_grid_backend
./scripts/backup.sh "YOUR_PRODUCTION_DATABASE_URL"
```

The script runs `pg_dump --format=custom` which:
- Compresses table data and schema definitions into a `.dump` binary file.
- Saves the file to `hire_grid_backend/backups/hiregrid_backup_YYYYMMDD_HHMMSS.dump`.
- Allows selective or full table restoration with `pg_restore`.

---

## 3. Verify Row Counts Before and After Migration

Before making any schema alterations, capture exact row counts for every table:

```bash
psql "$DATABASE_URL" -f scripts/verify_counts.sql > pre_migration_counts.txt
```

After running migrations, re-run:
```bash
psql "$DATABASE_URL" -f scripts/verify_counts.sql > post_migration_counts.txt
diff pre_migration_counts.txt post_migration_counts.txt
```

Row counts across every table must be 100% identical.

---

## 4. How to Restore from Backup

### Restoring to a Test / Development Database:
```bash
pg_restore --clean \
           --if-exists \
           --no-owner \
           --no-privileges \
           --dbname="YOUR_TEST_DATABASE_URL" \
           hire_grid_backend/backups/hiregrid_backup_YYYYMMDD_HHMMSS.dump
```

### Emergency Restore to Production:
If an emergency rollback is required:
1. Prefer switching the Neon compute endpoint back to the pre-migration Neon branch (`backup_pre_platform_v8`).
2. Alternatively, restore the pg_dump file to a new branch, verify data, and repoint Render's `DATABASE_URL`.
