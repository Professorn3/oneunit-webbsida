# ============================================================================
# 1. BUILD STAGE - Paketerar React/Vite-applikationen till produktion
# ============================================================================
FROM node:22-alpine as build-stage

WORKDIR /app

# Kopiera paket-specifikationer och installera beroenden
COPY package*.json ./
RUN npm install

# Kopiera över all källkod och kör Vite produktionsbygge
COPY . .
RUN npm run build

# ============================================================================
# 2. PRODUCTION STAGE - Superliten & blixtsnabb Nginx-motor för Tower / Docker
# ============================================================================
FROM nginx:alpine as production-stage

# Kopiera in den färdiga koden direkt från byggsteg 1
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponera port 80 ut mot din Tower / Nginx Reverse Proxy
EXPOSE 80

# Starta Nginx utan att köras i bakgrunden (för Watchtower-stöd)
CMD ["nginx", "-g", "daemon off;"]
