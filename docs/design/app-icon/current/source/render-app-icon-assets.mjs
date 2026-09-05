import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const sourceDirectory = path.dirname(fileURLToPath(import.meta.url));
const currentDirectory = path.dirname(sourceDirectory);
const exportDirectory = path.join(currentDirectory, "exports");
const previewDirectory = path.join(currentDirectory, "previews");
const sourcePath = path.join(
  sourceDirectory,
  "language-tracker-icon-master.svg",
);
const sourceSvg = await readFile(sourcePath);
const maskableSvg = Buffer.from(
  sourceSvg
    .toString()
    .replace(
      '<g id="artwork">',
      '<g id="artwork" transform="translate(102.4 102.4) scale(0.8)">',
    ),
);
const faviconSvg = Buffer.from(
  sourceSvg
    .toString()
    .replace(
      '<g id="symbol">',
      '<g id="symbol" transform="translate(-309 -10) scale(1.55)">',
    )
    .replace(
      '<g\n    id="title-lockup"',
      '<g\n    display="none"\n    id="title-lockup"',
    ),
);

const background = { r: 21, g: 93, b: 252, alpha: 1 };

async function renderPng(size, outputName) {
  await sharp(sourceSvg, { density: 384 })
    .resize(size, size, { fit: "fill" })
    .flatten({ background })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(exportDirectory, outputName));
}

await writeFile(
  path.join(exportDirectory, "language-tracker-icon-master.svg"),
  sourceSvg,
);

await Promise.all([
  renderPng(1024, "language-tracker-icon-1024.png"),
  renderPng(512, "language-tracker-icon-512.png"),
  renderPng(192, "language-tracker-icon-192.png"),
  renderPng(180, "apple-touch-icon-180.png"),
]);

await sharp(maskableSvg, { density: 384 })
  .resize(512, 512)
  .flatten({ background })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(path.join(exportDirectory, "language-tracker-icon-maskable-512.png"));

await sharp(faviconSvg, { density: 768 })
  .resize(32, 32)
  .flatten({ background })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(path.join(exportDirectory, "favicon-32.png"));

const iconBuffers = new Map();
for (const size of [32, 48, 64, 180, 192, 280, 512]) {
  iconBuffers.set(
    size,
    await sharp(sourceSvg, { density: 384 })
      .resize(size, size)
      .flatten({ background })
      .png()
      .toBuffer(),
  );
}
iconBuffers.set(
  32,
  await sharp(faviconSvg, { density: 768 })
    .resize(32, 32)
    .flatten({ background })
    .png()
    .toBuffer(),
);

function dataUri(buffer) {
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

function maskData(shape, size) {
  const radius = shape === "rounded" ? 64 : shape === "squircle" ? 92 : 0;
  if (shape === "circle") {
    return Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`,
    );
  }
  return Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="white"/></svg>`,
  );
}

async function maskedIcon(shape, size = 280) {
  return sharp(iconBuffers.get(size))
    .composite([{ input: maskData(shape, size), blend: "dest-in" }])
    .png()
    .toBuffer();
}

const maskCircle = await maskedIcon("circle");
const maskSquircle = await maskedIcon("squircle");
const maskRounded = await maskedIcon("rounded");
const maskablePreview = await sharp(maskableSvg, { density: 384 })
  .resize(300, 300)
  .flatten({ background })
  .png()
  .toBuffer();

const previewSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1600" viewBox="0 0 1800 1600">
  <rect width="1800" height="1600" fill="#eef2f7"/>
  <style>
    text { font-family: Arial, sans-serif; fill: #0f172a; }
    .title { font-size: 42px; font-weight: 700; }
    .section { font-size: 25px; font-weight: 700; }
    .label { font-size: 18px; font-weight: 700; }
    .light-label { font-size: 18px; font-weight: 700; fill: #f8fafc; }
    .note { font-size: 15px; fill: #475569; }
  </style>
  <text x="60" y="64" class="title">Language Tracker app icon — production preview</text>
  <text x="60" y="105" class="note">Flat SVG reconstruction · opaque PNG exports · maskable safe-area review</text>

  <text x="60" y="160" class="section">Mask behavior</text>
  <g transform="translate(60 190)">
    <rect width="380" height="360" rx="24" fill="white"/>
    <image x="50" y="28" width="280" height="280" href="${dataUri(iconBuffers.get(280))}"/>
    <text x="190" y="338" class="label" text-anchor="middle">Square</text>
  </g>
  <g transform="translate(480 190)">
    <rect width="380" height="360" rx="24" fill="white"/>
    <image x="50" y="28" width="280" height="280" href="${dataUri(maskCircle)}"/>
    <text x="190" y="338" class="label" text-anchor="middle">Circle</text>
  </g>
  <g transform="translate(900 190)">
    <rect width="380" height="360" rx="24" fill="white"/>
    <image x="50" y="28" width="280" height="280" href="${dataUri(maskSquircle)}"/>
    <text x="190" y="338" class="label" text-anchor="middle">Android squircle</text>
  </g>
  <g transform="translate(1320 190)">
    <rect width="380" height="360" rx="24" fill="white"/>
    <image x="50" y="28" width="280" height="280" href="${dataUri(maskRounded)}"/>
    <text x="190" y="338" class="label" text-anchor="middle">Rounded square</text>
  </g>

  <text x="60" y="610" class="section">Home-screen backgrounds</text>
  <g transform="translate(60 640)"><rect width="380" height="250" rx="24" fill="#ffffff"/><image x="100" y="25" width="180" height="180" href="${dataUri(iconBuffers.get(180))}"/><text x="190" y="230" class="label" text-anchor="middle">White</text></g>
  <g transform="translate(480 640)"><rect width="380" height="250" rx="24" fill="#e5e7eb"/><image x="100" y="25" width="180" height="180" href="${dataUri(iconBuffers.get(180))}"/><text x="190" y="230" class="label" text-anchor="middle">Light gray</text></g>
  <g transform="translate(900 640)"><rect width="380" height="250" rx="24" fill="#000000"/><image x="100" y="25" width="180" height="180" href="${dataUri(iconBuffers.get(180))}"/><text x="190" y="230" class="light-label" text-anchor="middle">Black</text></g>
  <g transform="translate(1320 640)"><rect width="380" height="250" rx="24" fill="#0b1220"/><image x="100" y="25" width="180" height="180" href="${dataUri(iconBuffers.get(180))}"/><text x="190" y="230" class="light-label" text-anchor="middle">Dark navy</text></g>

  <text x="60" y="950" class="section">Output-size inspection</text>
  <g transform="translate(60 1000)"><image x="0" y="480" width="32" height="32" href="${dataUri(iconBuffers.get(32))}"/><text x="16" y="550" class="label" text-anchor="middle">32</text></g>
  <g transform="translate(132 1000)"><image x="0" y="464" width="48" height="48" href="${dataUri(iconBuffers.get(48))}"/><text x="24" y="550" class="label" text-anchor="middle">48</text></g>
  <g transform="translate(220 1000)"><image x="0" y="448" width="64" height="64" href="${dataUri(iconBuffers.get(64))}"/><text x="32" y="550" class="label" text-anchor="middle">64</text></g>
  <g transform="translate(330 1000)"><image x="0" y="332" width="180" height="180" href="${dataUri(iconBuffers.get(180))}"/><text x="90" y="550" class="label" text-anchor="middle">180</text></g>
  <g transform="translate(560 1000)"><image x="0" y="320" width="192" height="192" href="${dataUri(iconBuffers.get(192))}"/><text x="96" y="550" class="label" text-anchor="middle">192</text></g>
  <g transform="translate(810 1000)"><image width="512" height="512" href="${dataUri(iconBuffers.get(512))}"/><text x="256" y="550" class="label" text-anchor="middle">512</text></g>

  <g transform="translate(1380 1010)">
    <rect width="300" height="300" fill="#155dfc"/>
    <image width="300" height="300" href="${dataUri(maskablePreview)}"/>
    <circle cx="150" cy="150" r="120" fill="none" stroke="#f7c95e" stroke-width="4" stroke-dasharray="10 8"/>
    <rect x="30" y="30" width="240" height="240" fill="none" stroke="#f8fafc" stroke-width="3" stroke-dasharray="8 7"/>
    <text x="150" y="333" class="label" text-anchor="middle">Maskable safe zone</text>
    <text x="150" y="357" class="note" text-anchor="middle">40% radius · outer 10% crop allowance</text>
  </g>
</svg>`);

await sharp(previewSvg)
  .flatten({ background: { r: 238, g: 242, b: 247 } })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(path.join(previewDirectory, "icon-preview-sheet.png"));

console.log("Rendered production icon assets and preview sheet.");
