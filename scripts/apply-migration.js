/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(__dirname, "..", file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!process.env[key]) process.env[key] = trimmed.slice(eq + 1).trim();
    }
  }
}

async function connect() {
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1];
  const password = process.env.SUPABASE_DB_PASSWORD;
  const urls = [
    process.env.SUPABASE_DB_URL,
    password && projectRef
      ? `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`
      : null,
    password && projectRef
      ? `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
      : null,
    password && projectRef
      ? `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`
      : null,
  ].filter(Boolean);

  for (const connectionString of urls) {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      return client;
    } catch {
      await client.end().catch(() => {});
    }
  }

  throw new Error("Could not connect to Supabase Postgres");
}

async function main() {
  loadEnv();
  const migration = process.argv[2];
  if (!migration) {
    throw new Error("Usage: node scripts/apply-migration.js <migration-file.sql>");
  }

  const migrationPath = path.isAbsolute(migration)
    ? migration
    : path.join(__dirname, "..", migration);

  const sql = fs.readFileSync(migrationPath, "utf8");
  const client = await connect();
  try {
    await client.query(sql);
    console.log(`Applied migration: ${path.relative(path.join(__dirname, ".."), migrationPath)}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

