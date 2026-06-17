import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const source = join(root, "public", "demo");
const target = join(root, "apps", "docs", "public", "demo");

if (!existsSync(source)) {
  process.exit(0);
}

mkdirSync(target, { recursive: true });

for (const name of readdirSync(source)) {
  if (!/\.(png|gif|webp|jpg|jpeg|svg)$/i.test(name)) continue;
  cpSync(join(source, name), join(target, name));
}
