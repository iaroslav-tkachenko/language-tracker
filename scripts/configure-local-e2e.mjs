import { appendFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const supabaseEntry = join(
  projectRoot,
  "node_modules",
  "supabase",
  "dist",
  "supabase.js",
);
const status = spawnSync(
  process.execPath,
  [supabaseEntry, "status", "-o", "env"],
  {
    cwd: projectRoot,
    encoding: "utf8",
  },
);

if (status.status !== 0) {
  process.stderr.write(status.stderr);
  throw new Error("Local Supabase status could not be read.");
}

const values = new Map();
for (const line of status.stdout.split(/\r?\n/)) {
  const match = line.match(/^([A-Z_]+)=(?:"(.*)"|(.*))$/);
  if (match) values.set(match[1], match[2] ?? match[3] ?? "");
}

const supabaseUrl = values.get("API_URL");
const publishableKey = values.get("PUBLISHABLE_KEY") ?? values.get("ANON_KEY");
const adminKey = values.get("SERVICE_ROLE_KEY") ?? values.get("SECRET_KEY");
if (!supabaseUrl || !publishableKey || !adminKey) {
  throw new Error("Local Supabase did not expose the required API keys.");
}

const email = "phase-one-e2e@example.com";
const password = `${randomBytes(24).toString("base64url")}Aa1!`;
const admin = createClient(supabaseUrl, adminKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { data: existingUsers, error: listError } =
  await admin.auth.admin.listUsers();
if (listError) throw listError;

const existingUser = existingUsers.users.find((user) => user.email === email);
if (existingUser) {
  const { error } = await admin.auth.admin.updateUserById(existingUser.id, {
    password,
    email_confirm: true,
  });
  if (error) throw error;
} else {
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
}

const publicEnvironment = [
  `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${publishableKey}`,
  "NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000",
].join("\n");
writeFileSync(join(projectRoot, ".env.local"), `${publicEnvironment}\n`);

if (process.env.GITHUB_ENV) {
  appendFileSync(
    process.env.GITHUB_ENV,
    [
      `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`,
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${publishableKey}`,
      "NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000",
      `E2E_USER_EMAIL=${email}`,
      `E2E_USER_PASSWORD=${password}`,
      "",
    ].join("\n"),
  );
}

process.stdout.write("Local Supabase E2E user is ready.\n");
