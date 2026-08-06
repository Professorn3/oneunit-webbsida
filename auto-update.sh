#!/bin/bash
# ==============================================================================
# ONEUNIT MC - AUTOMATISERAT SCRIPT FÖR UNRAID / TOWER & WATCHTOWER
# ==============================================================================
# Klistra in detta direkt i ditt "User Scripts"-plugin i Unraid!
# Scriptet tvingar fram en 100% ren synkronisering med din GitHub origin/main
# utan att någonsin stanna på lokala filändringar eller merge-fel!
# ==============================================================================

PROJECT_DIR="/mnt/user/appdata/oneunit-webbsida"

echo "[$(date)] 🏁 Kontrollerar OneUnit Webbsida mot GitHub..."

if [ -d "$PROJECT_DIR" ]; then
  cd "$PROJECT_DIR" || exit 1
  
  # Hämta senaste information från ditt GitHub-repo
  git fetch origin main --quiet
  
  LOCAL_VER=$(git rev-parse HEAD)
  REMOTE_VER=$(git rev-parse origin/main)
  
  if [ "$LOCAL_VER" != "$REMOTE_VER" ]; then
    echo "[$(date)] 🚀 Ny kod hittades på GitHub! Återställer och synkroniserar exakt mot molnet..."
    git reset --hard origin/main
    git clean -fd
    
    echo "[$(date)] 📦 Bygger ny Docker Image och startar via Docker Compose..."
    docker-compose up -d --build
    
    echo "[$(date)] ✅ Succé! Nyaste Hemsidan laddad och aktiverad under Watchtower!"
  else
    echo "[$(date)] 👍 Hemsidan är redan 100% uppdaterad (inga nya push på GitHub)."
  fi
else
  echo "[$(date)] ❌ Mappen $PROJECT_DIR saknas. Kör git clone först!"
fi
