#!/bin/bash

CONTAINER_ID=$(docker compose ps --status=running -q db)
DEFAULT_PATH=db_backups/backup_dump_$(date +%F_%H%M%S).sql

# Path is either first arg or default value
BACKUP_PATH=${1:-$DEFAULT_PATH}

echo $BACKUP_PATH

if [ -n "$CONTAINER_ID" ]
then
    echo "db service is running, creating backup.";
    mkdir -p "$(dirname $BACKUP_PATH)"
    docker compose exec db pg_dump -U postgres > $BACKUP_PATH
else
    echo "db service is not running, backup not possible"
fi