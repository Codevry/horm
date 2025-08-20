FROM oven/bun:1.2.20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Expose the app port (configure via .env -> PORT; container listens on 3000 by default)
EXPOSE 9988

# Start your app; ensure package.json has: "start": "bun run
CMD ["bun", "run", "start"]