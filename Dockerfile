# FootyTrump realtime server (Express + Socket.io) for Fly.io.
# Built from the repo root so server/ can import ../shared at runtime.
FROM node:20-alpine
WORKDIR /app

# Install server production deps first (Docker layer cache)
COPY server/package.json server/package-lock.json ./server/
RUN npm install --omit=dev --prefix server

# App source: the shared rules engine + the server
COPY shared ./shared
COPY server ./server

ENV PORT=8080
EXPOSE 8080
CMD ["node", "server/index.js"]
