import { drizzle } from "drizzle-orm/node-postgres";
import { pgPool } from "@/lib/db/pool";
import * as schema from "./schema";

export { pgPool } from "@/lib/db/pool";

export const db = drizzle(pgPool, { schema });

export type Database = typeof db;
