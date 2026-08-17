# MongoDB for the Ledger sample database.
#
# The official MongoDB server plus the seed script. The entrypoint runs everything under
# /docker-entrypoint-initdb.d the first time the data directory is empty, so the container
# comes up with the `movements` collection, its indexes and a year of example movements
# already in place — the application finds data on its very first render.
#
# Build and run it on its own:
#   docker build -t ledger-mongo docker/mongo
#   docker run -d --name ledger-mongo -p 27017:27017 -v ledger-data:/data/db ledger-mongo
#
# Or let Compose do both from the project root:
#   docker compose up -d
#
# MongoDB 6 and 8 work just as well; 7 is pinned so the image does not change underneath
# the project on a rebuild.
FROM mongo:7

# The database the entrypoint hands to the init scripts. It matches the one in
# MONGODB_URI (see .env.example). The script names the database explicitly as well, so a
# plain `docker run` without this variable still seeds the same place.
ENV MONGO_INITDB_DATABASE=personal_finance

COPY init/ /docker-entrypoint-initdb.d/

EXPOSE 27017
