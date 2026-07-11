#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup-file.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"
CONTAINER="${POSTGRES_CONTAINER:-bace-postgres}"
DB_USER="${POSTGRES_USER:-bace_user}"
DB_NAME="${POSTGRES_DB:-bace_devotee_db}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "Restoring PostgreSQL from: $BACKUP_FILE"
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"

echo "Restore complete."
