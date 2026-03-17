#!/usr/bin/env bash
set -euo pipefail

cd /opt/matrix

echo "== PM2 status =="
pm2 status

echo "== Heartbeat snapshot =="
npm run diag:heartbeat -- --limit=8

echo "== Bridge snapshot =="
npm run diag:bridge -- --limit=20

echo "oracle_free_verify_complete"
