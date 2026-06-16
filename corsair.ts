import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

export { corsair } from "./scripts/lib/corsair-for-scripts";
