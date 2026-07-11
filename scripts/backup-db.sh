#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
CONTAINER="${POSTGRES_CONTAINER:-bace-postgres}"
DB_USER="${POSTGRES_USER:-bace_user}"
DB_NAME="${POSTGRES_DB:-bace_devotee_db}"

mkdir -p "$BACKUP_DIR"
OUTPUT="$BACKUP_DIR/bace_backup_${TIMESTAMP}.sql.gz"

echo "Creating PostgreSQL backup: $OUTPUT"
docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists | gzip > "$OUTPUT"

echo "Backup complete: $OUTPUT"
