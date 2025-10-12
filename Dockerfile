# 1️⃣ Build
FROM node:20-bullseye AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy ALL files (รวม config)
COPY . .

# Build
RUN npm run build

# 2️⃣ Run
FROM node:20-bullseye AS runner
WORKDIR /app

ENV NODE_ENV=development

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs

# ✅ Copy config files สำคัญ
COPY --from=builder /app/postcss.config.mjs* ./
COPY --from=builder /app/tailwind.config.* ./
COPY --from=builder /app/jsconfig.json* ./

# Copy source code
COPY --from=builder /app/app ./app

EXPOSE 3000

CMD ["npm", "run", "start"]