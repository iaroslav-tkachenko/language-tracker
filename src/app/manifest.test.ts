import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import manifest from "@/app/manifest";

const iconCases = [
  ["language-tracker-icon-192.png", "language-tracker-icon-192.png", 192],
  ["language-tracker-icon-512.png", "language-tracker-icon-512.png", 512],
  [
    "language-tracker-icon-maskable-512.png",
    "language-tracker-icon-maskable-512.png",
    512,
  ],
  ["apple-touch-icon-180.png", "apple-touch-icon-180.png", 180],
  ["favicon-32.png", "favicon-32.png", 32],
] as const;

function pngDimensions(buffer: Buffer) {
  expect(buffer.subarray(0, 8)).toEqual(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  );
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

describe("PWA manifest", () => {
  it("describes the online standalone application and required icons", () => {
    expect(manifest()).toMatchObject({
      name: "Language Tracker",
      short_name: "Language Tracker",
      id: "/",
      start_url: "/",
      scope: "/",
      display: "standalone",
      orientation: "any",
      lang: "en",
      icons: [
        expect.objectContaining({ sizes: "192x192", purpose: "any" }),
        expect.objectContaining({ sizes: "512x512", purpose: "any" }),
        expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
      ],
    });
  });

  it.each(iconCases)(
    "keeps runtime %s identical to its approved source",
    (runtimeName, approvedName, size) => {
      const runtime = readFileSync(resolve("public/icons", runtimeName));
      const approved = readFileSync(
        resolve("docs/design/app-icon/current/exports", approvedName),
      );
      expect(runtime).toEqual(approved);
      expect(pngDimensions(runtime)).toEqual({ width: size, height: size });
    },
  );

  it("keeps the runtime SVG identical to the approved export", () => {
    expect(
      readFileSync(resolve("public/icons/language-tracker-icon.svg")),
    ).toEqual(
      readFileSync(
        resolve(
          "docs/design/app-icon/current/exports/language-tracker-icon-master.svg",
        ),
      ),
    );
  });

  it("uses the approved symbol-only SVG for the browser favicon", () => {
    const runtime = readFileSync(resolve("public/icons/favicon.svg"));
    const approved = readFileSync(
      resolve("docs/design/app-icon/current/exports/favicon.svg"),
    );
    expect(runtime).toEqual(approved);
    expect(runtime.toString()).toContain('display="none"');
    expect(runtime.toString()).toContain('id="symbol"');
  });
});
