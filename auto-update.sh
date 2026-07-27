#!/bin/bash
# ==============================================================================
# ONEUNIT MC - AUTOMATISERAT SCRIPT FÖR UNRAID / TOWER & WATCHTOWER
# ==============================================================================
# Klistra in detta direkt i ditt "User Scripts"-plugin i Unraid!
# Scriptet kontrollerar GitHub, laddar ner sista uppdateringar och bygger 
# om din Docker-container med 100% idiotsäkra, nativa Docker-kommandon.
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
    echo "[$(date)] 🚀 Ny kod hittades på GitHub! Laddar ner..."
    git pull origin main
    
    echo "[$(date)] 📦 Bygger ny Docker Image till Watchtower..."
    docker build -t oneunit-webbsida:latest .
    
    echo "[$(date)] 🔄 Startar om containern..."
    docker stop oneunit-webbsida 2>/dev/null
    docker rm oneunit-webbsida 2>/dev/null
    docker run -d \
      --name oneunit-webbsida \
      --restart unless-stopped \
      -p 3001:80 \
      --label com.centurylinklabs.watchtower.enable=true \
      oneunit-webbsida:latest
    
    echo "[$(date)] ✅ Succé! Nyaste Hemsidan laddad och aktiverad!"
  else
    echo "[$(date)] 👍 Hemsidan är redan 100% uppdaterad (inga nya push på GitHub)."
  fi
else
  echo "[$(date)] ❌ Mappen $PROJECT_DIR saknas. Kör git clone först!"
fi
