#!/bin/bash
# NexaCare teammate setup — run once from the repo root
# Usage: bash scripts/setup-teammate.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo ""
echo "══════════════════════════════════════════"
echo "  NexaCare — Teammate Setup"
echo "══════════════════════════════════════════"

# ── 1. client/.env ────────────────────────────────────────────────────────────
if [ ! -f client/.env ]; then
  cp client/.env.example client/.env
  echo "✅ Created client/.env from example"
else
  echo "⏭  client/.env already exists — skipping"
fi

# Ensure VITE_API_BASE_URL is set
if ! grep -q "VITE_API_BASE_URL=http" client/.env 2>/dev/null; then
  echo "" >> client/.env
  echo "VITE_API_BASE_URL=http://localhost:8000" >> client/.env
  echo "✅ Added VITE_API_BASE_URL to client/.env"
fi

# ── 2. root .env (server secrets) ─────────────────────────────────────────────
if [ ! -f .env ]; then
  cp server/.env.example .env 2>/dev/null || touch .env
  echo "✅ Created .env — fill in your secrets (see below)"
else
  echo "⏭  .env already exists — skipping"
fi

# ── 3. Install frontend deps ───────────────────────────────────────────────────
echo ""
echo "📦 Installing frontend dependencies..."
cd client && npm install --silent && cd ..
echo "✅ Frontend deps ready"

# ── 4. Install backend deps ────────────────────────────────────────────────────
echo ""
echo "📦 Installing backend dependencies..."
pip3 install -r server/requirements.txt -q
echo "✅ Backend deps ready"

# ── 5. Summary ────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════"
echo "  Setup complete — one thing left:"
echo "══════════════════════════════════════════"
echo ""
echo "  Open .env and fill in:"
echo ""
echo "    ANTHROPIC_API_KEY=sk-ant-...   ← get from Nicolas"
echo "    GOOGLE_MAPS_API_KEY=...        ← already in teammates key"
echo ""
echo "  Then start both servers:"
echo ""
echo "    Terminal 1:  cd server && python3 -m uvicorn main:app --reload --port 8000"
echo "    Terminal 2:  cd client && npm run dev"
echo ""
echo "  App runs at:  http://localhost:5173"
echo ""
