import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { RowDataPacket } from "mysql2/promise";
import { createMysqlPool } from "./mysql";
import { loadEnv } from "../config/env";

const env = loadEnv();
const pool = createMysqlPool(env);

try {
  const schemaPath = join(import.meta.dir, "schema.sql");
  const schema = readFileSync(schemaPath, "utf8");
  const statements = schema
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await pool.query(statement);
  }

  await ensureColumn("readings", "annotations_json", "JSON NULL AFTER empty_reason");
  await ensureColumn("lenses", "prompt", "TEXT NULL AFTER full_description");
  await ensureColumn("lenses", "created_by", "VARCHAR(64) NULL AFTER is_available");
  await pool.query("ALTER TABLE lenses MODIFY COLUMN category ENUM('NATURE', 'CULTURE', 'URBAN', 'TEMPORAL', 'CUSTOM') NOT NULL");

  const seedPath = join(import.meta.dir, "seed.sql");
  const seed = readFileSync(seedPath, "utf8");
  const seedStatements = seed
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of seedStatements) {
    await pool.query(statement);
  }

  console.log(`Initialized MySQL database "${env.database.name}" with ${statements.length} schema statements and ${seedStatements.length} seed statements.`);
} finally {
  await pool.end();
}

async function ensureColumn(tableName: string, columnName: string, definition: string) {
  const [rows] = await pool.query<Array<RowDataPacket & { count: number }>>(
    `SELECT COUNT(*) AS count
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?`,
    [env.database.name, tableName, columnName]
  );

  if (Number(rows[0]?.count ?? 0) === 0) {
    await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}
