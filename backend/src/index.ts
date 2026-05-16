import { createApp } from "./app";
import { loadEnv } from "./config/env";
import { createMysqlPool } from "./data/mysql";
import { createMysqlRepositories } from "./data/mysql-repositories";

const env = loadEnv();
const pool = createMysqlPool(env);
const repositories = createMysqlRepositories(pool, env);
const app = createApp({ env, repositories });

Bun.serve({
  hostname: env.host,
  port: env.port,
  fetch: app.fetch
});

console.log(`Prism backend listening at http://${env.host}:${env.port}${env.apiPrefix}`);

process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});
