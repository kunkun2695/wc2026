# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_VAPID_PUBLIC_KEY
ENV VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY
RUN npm run build


# Stage 2: Build Backend & Final Image
FROM node:20-alpine

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
