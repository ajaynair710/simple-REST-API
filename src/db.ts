import fs from "fs";
import path from "path";
import { Pool, PoolConfig } from "pg";

function loadCaPem(): string | undefined {
  const caPath = process.env.PGSSLROOTCERT || process.env.AIVEN_CA_FILE;
  if (caPath) {
    try {
      return fs.readFileSync(path.resolve(caPath), "utf8");
    } catch {
      console.warn(`[db] Could not read SSL CA file at ${caPath}`);
    }
  }
  const inline = process.env.DATABASE_SSL_CA;
  if (inline) {
    return inline.replace(/\\n/g, "\n");
  }
  return undefined;
}

/** TLS options for pg. Aiven (and many clouds) need the provider CA PEM or Node reports SELF_SIGNED_CERT_IN_CHAIN. */
function sslOption(): { rejectUnauthorized: boolean; ca?: string } {
  const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false";
  const ca = loadCaPem();
  if (ca) {
    return { rejectUnauthorized, ca };
  }
  return { rejectUnauthorized };
}

function getPoolConfig(): PoolConfig {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const needsSsl =
      /\bsslmode=require\b/i.test(dbUrl) ||
      /\bsslmode=verify-full\b/i.test(dbUrl) ||
      process.env.DB_SSL === "true";
    return {
      connectionString: dbUrl,
      ssl: needsSsl ? sslOption() : undefined,
    };
  }

  const host = process.env.DB_HOST || "localhost";
  const useSsl =
    process.env.DB_SSL === "true" ||
    /\.aivencloud\.com$/i.test(host) ||
    process.env.DB_FORCE_SSL === "true";
  return {
    host,
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "mydb",
    ssl: useSsl ? sslOption() : undefined,
  };
}

function logAivenTlsHint(): void {
  if (process.env.DB_SSL_REJECT_UNAUTHORIZED === "false") return;
  if (loadCaPem()) return;
  const url = process.env.DATABASE_URL || "";
  const host = process.env.DB_HOST || "";
  const looksLikeAiven = url.includes("aivencloud.com") || /\.aivencloud\.com$/i.test(host);
  if (!looksLikeAiven) return;
  console.warn(
    "[db] Aiven TLS: download the CA certificate from the Aiven console (Connection information) and set " +
      "PGSSLROOTCERT to that file path, or paste the PEM into DATABASE_SSL_CA. " +
      "Dev-only fallback: DB_SSL_REJECT_UNAUTHORIZED=false."
  );
}

logAivenTlsHint();
const pool = new Pool(getPoolConfig());

function formatConnectError(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as { message?: string; code?: string; errno?: string };
    const parts = [e.code, e.errno, e.message].filter(Boolean);
    if (parts.length) return parts.join(" — ");
  }
  return err instanceof Error ? err.message : String(err);
}

export async function waitForDb(maxAttempts = 30, delayMs = 1000): Promise<void> {
  let lastErr = "unknown error";
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch (err) {
      lastErr = formatConnectError(err);
      console.error(`[waitForDb] attempt ${attempt}/${maxAttempts} failed: ${lastErr}`);
      if (attempt === maxAttempts) {
        throw new Error(
          `Database unavailable after ${maxAttempts} attempts. Last error: ${lastErr}`
        );
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

export default pool;
