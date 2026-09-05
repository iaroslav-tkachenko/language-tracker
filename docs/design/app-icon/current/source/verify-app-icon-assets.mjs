import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const sourceDirectory = path.dirname(fileURLToPath(import.meta.url));
const currentDirectory = path.dirname(sourceDirectory);
const exportDirectory = path.join(currentDirectory, "exports");
const previewDirectory = path.join(currentDirectory, "previews");
const publicIconDirectory = path.resolve(
  currentDirectory,
  "..",
  "..",
  "..",
  "..",
  "public",
  "icons",
);

const expectedPngs = new Map([
  ["language-tracker-icon-1024.png", [1024, 1024]],
  ["language-tracker-icon-512.png", [512, 512]],
  ["language-tracker-icon-192.png", [192, 192]],
  ["language-tracker-icon-maskable-512.png", [512, 512]],
  ["apple-touch-icon-180.png", [180, 180]],
  ["favicon-32.png", [32, 32]],
]);

const results = [];
for (const [name, [width, height]] of expectedPngs) {
  const filePath = path.join(exportDirectory, name);
  const metadata = await sharp(filePath).metadata();
  const passed =
    metadata.format === "png" &&
    metadata.width === width &&
    metadata.height === height &&
    metadata.hasAlpha === false;
  results.push({
    name,
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    alpha: metadata.hasAlpha,
    passed,
  });
}

const previewPath = path.join(previewDirectory, "icon-preview-sheet.png");
const previewMetadata = await sharp(previewPath).metadata();
results.push({
  name: "icon-preview-sheet.png",
  format: previewMetadata.format,
  width: previewMetadata.width,
  height: previewMetadata.height,
  alpha: previewMetadata.hasAlpha,
  passed:
    previewMetadata.format === "png" &&
    previewMetadata.width === 1800 &&
    previewMetadata.height === 1600 &&
    previewMetadata.hasAlpha === false,
});

const sourceSvgPath = path.join(
  sourceDirectory,
  "language-tracker-icon-master.svg",
);
const exportedSvgPath = path.join(
  exportDirectory,
  "language-tracker-icon-master.svg",
);
const sourceSvg = await readFile(sourceSvgPath, "utf8");
const exportedSvg = await readFile(exportedSvgPath, "utf8");
const svgHash = (value) => createHash("sha256").update(value).digest("hex");

const svgResult = {
  name: "language-tracker-icon-master.svg",
  viewBox: sourceSvg.includes('viewBox="0 0 1024 1024"'),
  embeddedRaster: /<image\b/i.test(sourceSvg),
  matchingExport: svgHash(sourceSvg) === svgHash(exportedSvg),
};
svgResult.passed =
  svgResult.viewBox && !svgResult.embeddedRaster && svgResult.matchingExport;

await sharp(Buffer.from(sourceSvg)).metadata();

const expectedWindowsIconSizes = [16, 24, 32, 48, 64, 128, 256];
const windowsIconPath = path.join(
  exportDirectory,
  "language-tracker-symbol.ico",
);
const publicWindowsIconPath = path.join(
  publicIconDirectory,
  "language-tracker-symbol.ico",
);
const windowsIcon = await readFile(windowsIconPath);
const publicWindowsIcon = await readFile(publicWindowsIconPath);
const windowsIconCount = windowsIcon.readUInt16LE(4);
const windowsIconSizes = Array.from(
  { length: windowsIconCount },
  (_, index) => {
    const entryOffset = 6 + index * 16;
    const width = windowsIcon.readUInt8(entryOffset) || 256;
    const height = windowsIcon.readUInt8(entryOffset + 1) || 256;
    const imageSize = windowsIcon.readUInt32LE(entryOffset + 8);
    const imageOffset = windowsIcon.readUInt32LE(entryOffset + 12);
    const pngSignature = windowsIcon
      .subarray(imageOffset, imageOffset + 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    return { width, height, imageSize, pngSignature };
  },
);
const windowsIconResult = {
  name: "language-tracker-symbol.ico",
  type: windowsIcon.readUInt16LE(2),
  sizes: windowsIconSizes,
  matchingPublicCopy: windowsIcon.equals(publicWindowsIcon),
};
windowsIconResult.passed =
  windowsIconResult.type === 1 &&
  windowsIconCount === expectedWindowsIconSizes.length &&
  windowsIconSizes.every(
    (entry, index) =>
      entry.width === expectedWindowsIconSizes[index] &&
      entry.height === expectedWindowsIconSizes[index] &&
      entry.imageSize > 0 &&
      entry.pngSignature,
  ) &&
  windowsIconResult.matchingPublicCopy;

console.log(
  JSON.stringify(
    { pngs: results, svg: svgResult, windowsIcon: windowsIconResult },
    null,
    2,
  ),
);

if (
  !results.every((result) => result.passed) ||
  !svgResult.passed ||
  !windowsIconResult.passed
) {
  process.exitCode = 1;
}
