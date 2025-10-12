# 1️⃣ Build Stage
FROM node:20-bullseye AS builder
WORKDIR /app

# Copy package files first (cache layer)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy everything (รวมถึง config/ และ server.js)
COPY . .

# Build Next.js
RUN npm run build

# 2️⃣ Run Stage
FROM node:20-bullseye AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package.json & lock files
COPY --from=builder /app/package*.json ./

# Install only production deps
RUN npm ci --omit=dev

# Copy necessary build artifacts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs

# ✅ Copy Socket.IO server
COPY --from=builder /app/server.js ./

# ✅ Copy your config directory (important!)
COPY --from=builder /app/config ./config

# ✅ Copy app source (for API routes / edge functions)
COPY --from=builder /app/app ./app

# Optional: PostCSS, Tailwind, JS config (for runtime reference)
COPY --from=builder /app/postcss.config.mjs* ./
COPY --from=builder /app/tailwind.config.* ./
COPY --from=builder /app/jsconfig.json* ./

EXPOSE 3000

# ✅ Start custom server.js (not next start)
CMD ["node", "server.js"]
