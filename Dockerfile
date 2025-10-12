# 1️⃣ Build stage
FROM node:20-bullseye AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Set environment variables to skip DB during build
ENV NEXT_PUBLIC_DISABLE_DB=true
ENV SKIP_DB_INIT=true
ENV NODE_ENV=production

RUN npm run build

# 2️⃣ Production stage
FROM node:20-bullseye AS runner
WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3000
CMD ["npm", "run", "start"]