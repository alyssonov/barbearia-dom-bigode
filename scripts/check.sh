#!/usr/bin/env bash
# Checagem definida deste repositório. Grava comandos + saída bruta em .claude/reports/<tree>.txt
exec "$(git rev-parse --show-toplevel)/.claude/scripts/report.sh" \
  npm\ ci\ --no-audit\ --no-fund \
  VITE_SUPABASE_URL=http://127.0.0.1:9\ VITE_SUPABASE_ANON_KEY=dummy\ npx\ vite\ build \
  node\ .claude/scripts/smoke.cjs\ dist
