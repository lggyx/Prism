FROM oven/bun:1.3.14 AS install
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install

FROM oven/bun:1.3.14 AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=install /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN mkdir -p /app/storage
EXPOSE 3000
CMD ["bun", "src/index.ts"]
