import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  openSync,
  closeSync,
  readSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { pipeline } from "node:stream/promises";

const MAGIC = Buffer.from("LTBKP001", "ascii");
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const HEADER_LENGTH = MAGIC.length + SALT_LENGTH + IV_LENGTH;

function getPassphrase() {
  const passphrase = process.env.LANGUAGE_TRACKER_BACKUP_PASSPHRASE;
  delete process.env.LANGUAGE_TRACKER_BACKUP_PASSPHRASE;

  if (!passphrase || passphrase.length < 16) {
    throw new Error("Backup passphrase must contain at least 16 characters.");
  }

  return passphrase;
}

function deriveKey(passphrase, salt) {
  return scryptSync(passphrase, salt, 32, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
}

async function encrypt(inputPath, outputPath, passphrase) {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(passphrase, salt);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const partialPath = `${outputPath}.partial`;

  rmSync(partialPath, { force: true });
  writeFileSync(partialPath, Buffer.concat([MAGIC, salt, iv]));

  try {
    await pipeline(
      createReadStream(inputPath),
      cipher,
      createWriteStream(partialPath, { flags: "a" }),
    );
    writeFileSync(partialPath, cipher.getAuthTag(), { flag: "a" });
    renameSync(partialPath, outputPath);
  } catch (error) {
    rmSync(partialPath, { force: true });
    throw error;
  } finally {
    key.fill(0);
  }
}

async function decrypt(inputPath, outputPath, passphrase) {
  const size = statSync(inputPath).size;
  if (size <= HEADER_LENGTH + TAG_LENGTH) {
    throw new Error("Backup file is too small or truncated.");
  }

  const descriptor = openSync(inputPath, "r");
  const header = Buffer.alloc(HEADER_LENGTH);
  const tag = Buffer.alloc(TAG_LENGTH);

  try {
    readSync(descriptor, header, 0, HEADER_LENGTH, 0);
    readSync(descriptor, tag, 0, TAG_LENGTH, size - TAG_LENGTH);
  } finally {
    closeSync(descriptor);
  }

  if (!header.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error("Unsupported Language Tracker backup format.");
  }

  const salt = header.subarray(MAGIC.length, MAGIC.length + SALT_LENGTH);
  const iv = header.subarray(MAGIC.length + SALT_LENGTH);
  const key = deriveKey(passphrase, salt);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const partialPath = `${outputPath}.partial`;

  rmSync(partialPath, { force: true });

  try {
    await pipeline(
      createReadStream(inputPath, {
        start: HEADER_LENGTH,
        end: size - TAG_LENGTH - 1,
      }),
      decipher,
      createWriteStream(partialPath),
    );
    renameSync(partialPath, outputPath);
  } catch (error) {
    rmSync(partialPath, { force: true });
    throw new Error(
      "Backup authentication failed. Check the passphrase and file integrity.",
      {
        cause: error,
      },
    );
  } finally {
    key.fill(0);
  }
}

const [command, inputPath, outputPath] = process.argv.slice(2);

if (!command || !inputPath || !outputPath) {
  throw new Error(
    "Usage: backup-crypto.mjs <encrypt|decrypt> <input> <output>",
  );
}

if (!existsSync(inputPath)) {
  throw new Error(`Input file does not exist: ${inputPath}`);
}

const passphrase = getPassphrase();

if (command === "encrypt") {
  await encrypt(inputPath, outputPath, passphrase);
} else if (command === "decrypt") {
  await decrypt(inputPath, outputPath, passphrase);
} else {
  throw new Error(`Unsupported command: ${command}`);
}
