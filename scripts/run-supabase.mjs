import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const isWindows = process.platform === "win32";
const supabaseEntry = join(
  projectRoot,
  "node_modules",
  "supabase",
  "dist",
  "supabase.js",
);
const environment = { ...process.env };

if (isWindows) {
  const localHome = join(projectRoot, ".cache", "supabase-home");
  mkdirSync(localHome, { recursive: true });
  environment.HOME = localHome;
  environment.USERPROFILE = localHome;
}

const result = spawnSync(
  process.execPath,
  [supabaseEntry, ...process.argv.slice(2)],
  {
    cwd: projectRoot,
    env: environment,
    stdio: "inherit",
  },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
