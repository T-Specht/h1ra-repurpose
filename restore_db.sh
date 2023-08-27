#!/bin/bash

BACKUP_FILE=$1
# echo "backing up, just to be sure";
# ./backup_db.sh

echo "Stopping db and removing old data"
docker compose stop db
rm -rf data/postgres
docker compose up db -d

echo "waiting, so db is up"
sleep 5s

echo "restoring from $BACKUP_FILE";
cat $BACKUP_FILE | docker compose exec -T db psql -U postgres -d postgres