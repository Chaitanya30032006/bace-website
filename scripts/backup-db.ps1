$ErrorActionPreference = 'Stop'

$BackupDir = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { './backups' }
$Timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$Container = if ($env:POSTGRES_CONTAINER) { $env:POSTGRES_CONTAINER } else { 'bace-postgres' }
$DbUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { 'bace_user' }
$DbName = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { 'bace_devotee_db' }

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
$Output = Join-Path $BackupDir "bace_backup_$Timestamp.sql"

Write-Host "Creating PostgreSQL backup: $Output"
docker exec $Container pg_dump -U $DbUser -d $DbName --clean --if-exists | Out-File -FilePath $Output -Encoding utf8
Write-Host "Backup complete: $Output"
