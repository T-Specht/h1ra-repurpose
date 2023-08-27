#!/bin/bash

CONTAINER_ID=$(docker compose ps --status=running -q db)
DEFAULT_PATH=db_backups/backup_dump_$(date +%F_%H%M%S).sql


# Use GZIP as first argument
USE_GZIP=${1:-true}

# Path is either second arg or default value
BACKUP_PATH=${2:-$DEFAULT_PATH}

if [ -n "$CONTAINER_ID" ]
then
    echo "db service is running, creating backup at $BACKUP_PATH ; gzip = $USE_GZIP";
    mkdir -p "$(dirname $BACKUP_PATH)"

    if [ $USE_GZIP = true ]
    then
        docker compose exec db pg_dump -U postgres | gzip > $BACKUP_PATH.gz
    else
        docker compose exec db pg_dump -U postgres > $BACKUP_PATH
    fi
else
    echo "db service is not running, backup not possible"
fi