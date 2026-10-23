#!/usr/bin/env bash
# ==============================================================================
# HireGrid Database Backup Script (pg_dump custom format)
# Creates a compressed, point-in-time snapshot of the PostgreSQL database.
#
# Usage:
#   ./scripts/backup.sh [DATABASE_URL]
#   OR
#   DATABASE_URL="postgres://..." ./scripts/backup.sh
# ==============================================================================

set -euo pipefail

TARGET_URL="${1:-${DATABASE_URL:-}}"

if [ -z "$TARGET_URL" ]; then
  echo "Error: No database URL provided."
  echo "Usage: $0 <DATABASE_URL>"
  echo "   or: DATABASE_URL=<url> $0"
  exit 1
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$(pwd)/backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/hiregrid_backup_${TIMESTAMP}.dump"

echo "=================================================="
echo " Starting Database Backup"
echo " Time: $(date)"
echo " Destination: $BACKUP_FILE"
echo "=================================================="

# Perform pg_dump using custom format (-Fc is compressed and supports pg_restore)
pg_dump --format=custom \
        --no-owner \
        --no-privileges \
        --verbose \
        --dbname="$TARGET_URL" \
        --file="$BACKUP_FILE"

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "=================================================="
echo " Backup successfully created!"
echo " File: $BACKUP_FILE"
echo " Size: $FILE_SIZE"
echo " Restore command: pg_restore --clean --if-exists --no-owner --dbname=\"<RESTORE_URL>\" \"$BACKUP_FILE\""
echo "=================================================="
