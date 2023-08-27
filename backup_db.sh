#!/bin/bash
mkdir -p db_backups
docker compose exec db pg_dump -U postgres > db_backups/backup_dump_$(date +%F_%H%M%S).sql