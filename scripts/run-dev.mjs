import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";
import { join } from "node:path";

const localOrigins = [
  "localhost",
  "127.0.0.1",
  ...Object.values(networkInterfaces())
    .flat()
    .filter(
      (address) =>
        address?.family === "IPv4" &&
        !address.internal &&
        !address.address.startsWith("169.254."),
    )
    .map((address) => address.address),
];

const nextBinary = join(
  process.cwd(),
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);
const child = spawn(
  process.execPath,
  [nextBinary, "dev", "--hostname", "0.0.0.0"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_ALLOWED_DEV_ORIGINS: localOrigins.join(","),
    },
  },
);

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
