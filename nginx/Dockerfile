FROM node:current-alpine AS tsbuild

WORKDIR /app

COPY www/src/. ./www/src/.
COPY www/css/. ./www/css/.
COPY www/*.html .www/.

COPY package.json package-lock.json tsconfig.json vite.config.ts ./
RUN npm ci

ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm run build

FROM nginx:alpine

RUN apk add --no-cache curl \
 && mkdir -p /etc/nginx /var/www \
 && touch /var/log/nginx/nginx.log /var/log/nginx/err.log

# COPY www /var/www
COPY --from=tsbuild /app/www/js /var/www/js

RUN touch /var/log/nginx/nginx.log /var/log/nginx/err.log \
 && chown -R nginx:nginx /var/log/nginx /var/www

HEALTHCHECK --interval=15s --timeout=5s --start-period=2s --retries=10 \
  CMD ["curl", "-f", "http://localhost/proxy-health"]