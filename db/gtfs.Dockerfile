FROM node:22-alpine
RUN apk add --no-cache bash curl moreutils postgresql-client unzip
RUN npm install -g gtfs-via-postgres
ENTRYPOINT ["gtfs-via-postgres"]