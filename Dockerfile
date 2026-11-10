FROM oven/bun:1.2.20-alpine

WORKDIR /app

ENV NODE_ENV=production \
    PORT=9988 \
    SQLITE_PATH=/app/data/horm.sqlite

# install production dependencies first so this layer is cached between builds
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# app source (tsconfig.json is needed at runtime for the "@/..." import paths)
COPY tsconfig.json index.ts ./
COPY src ./src

# sqlite database lives here - mount a volume on it to keep data between deploys
RUN mkdir -p /app/data && chown -R bun:bun /app/data
VOLUME ["/app/data"]

# run as the unprivileged user that ships with the bun image
USER bun

EXPOSE 9988

# used by Docker / Coolify to know when the app is ready
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" > /dev/null || exit 1

CMD ["bun", "src/index.ts"]
