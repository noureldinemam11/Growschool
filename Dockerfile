### Multi-stage Dockerfile for LiveSchoolPortal
### Builds client and server, outputs a minimal runtime image

FROM node:22-bullseye AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY drizzle.config.ts ./
RUN npm ci --silent

FROM node:22-bullseye AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build both client and server (server bundling triggered by npm run build)
RUN npm run build

FROM node:22-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["node", "dist/index.js"]
