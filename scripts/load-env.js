/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

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

module.exports = { loadEnv };
