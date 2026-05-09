# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build


# Stage 2: Build Backend & Final Image
FROM node:20-slim

WORKDIR /app

# Copy Backend files
COPY server/package*.json ./server/
RUN cd server && npm ci
COPY server ./server


# Copy Frontend build from Stage 1
COPY --from=frontend-builder /app/dist ./dist

# Environment variables
ENV NODE_ENV=production
ENV PORT=5005

EXPOSE 5005

CMD ["node", "server/index.js"]
