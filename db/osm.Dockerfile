FROM debian:bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       osm2pgsql osmium-tool ca-certificates curl postgresql-client \
  && rm -rf /var/lib/apt/lists/*


  