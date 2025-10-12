# 1️⃣ Build
FROM node:20-bullseye AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy ALL files
COPY . .

# Build Next.js
RUN npm run build

# 2️⃣ Run
FROM node:20-bullseye AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built Next.js
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs

# Copy Socket.IO server (สำคัญ!)
COPY --from=builder /app/server.js ./

# Copy config
COPY --from=builder /app/config ./config

# Copy app source
COPY --from=builder /app/app ./app

# Copy config files
COPY --from=builder /app/postcss.config.mjs* ./
COPY --from=builder /app/tailwind.config.* ./
COPY --from=builder /app/jsconfig.json* ./

EXPOSE 3000

CMD ["npm", "run", "start"]