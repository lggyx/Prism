FROM oven/bun:1.3.14 AS install
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install

FROM oven/bun:1.3.14 AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 bunuser && \
    adduser --system --uid 1001 --gid 1001 bunuser
COPY --from=install /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN mkdir -p /app/storage && chown -R bunuser:bunuser /app/storage
USER bunuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:3000/api/v1/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["bun", "src/index.ts"]
