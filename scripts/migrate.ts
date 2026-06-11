import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

async function main() {
  const sql = postgres(DATABASE_URL, { max: 1 });

  try {
    console.log("Applying SQL migrations (extensions + Corsair tables)…");
    for (const file of ["001_extensions.sql", "002_corsair_tables.sql"]) {
      const path = join(process.cwd(), "sql", file);
      console.log(`→ ${file}`);
      await sql.unsafe(readFileSync(path, "utf8"));
    }

    console.log("Applying Drizzle app schema migrations…");
    const { execSync } = await import("node:child_process");
    execSync("bunx drizzle-kit migrate", {
      stdio: "inherit",
      env: process.env,
    });

    console.log("Applying post-schema indexes…");
    const indexesPath = join(process.cwd(), "sql", "003_app_indexes.sql");
    console.log("→ 003_app_indexes.sql");
    await sql.unsafe(readFileSync(indexesPath, "utf8"));

    console.log("✓ Database migrations complete");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
