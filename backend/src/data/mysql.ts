import { createPool } from "mysql2/promise";
import type { AppEnv } from "../config/env";

export function createMysqlPool(env: AppEnv) {
  return createPool({
    host: env.database.host,
    port: env.database.port,
    user: env.database.user,
    password: env.database.password,
    database: env.database.name,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
    timezone: "Z"
  });
}
