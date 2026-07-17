import { mkdir, writeFile } from "node:fs/promises";

const debuggingPort = 9223;
const appUrl = "http://127.0.0.1:3001";
const outputDirectory = "docs/design/phase-1";

await mkdir(outputDirectory, { recursive: true });

const targetResponse = await fetch(
  `http://127.0.0.1:${debuggingPort}/json/new?${encodeURIComponent(appUrl)}`,
  { method: "PUT" },
);
if (!targetResponse.ok) {
  throw new Error(`Could not create browser target: ${targetResponse.status}`);
}

const target = await targetResponse.json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let sequence = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

function send(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function evaluate(expression) {
  return send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
}

async function navigate() {
  await send("Page.navigate", { url: appUrl });
  await wait(1_200);
}

async function screenshot(filename) {
  const { data } = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  await writeFile(
    `${outputDirectory}/${filename}`,
    Buffer.from(data, "base64"),
  );
}

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
  screenWidth: 390,
  screenHeight: 844,
});

await navigate();
await evaluate("window.scrollTo(0, 0)");
await screenshot("milestone-1b-mobile-top.png");

await evaluate("window.scrollTo(0, document.documentElement.scrollHeight)");
await wait(300);
await screenshot("milestone-1b-mobile-bottom.png");

await evaluate(
  `document.querySelector('button[aria-label^="Edit "]')?.click()`,
);
await wait(300);
await evaluate("window.scrollTo(0, document.documentElement.scrollHeight)");
await wait(300);
await screenshot("milestone-1b-mobile-edit.png");

await evaluate(`
  [...document.querySelectorAll("button")]
    .find((button) => button.textContent?.trim() === "45 min")
    ?.click();
`);
await wait(150);
await evaluate(`
  [...document.querySelectorAll("button")]
    .find((button) => button.textContent?.trim() === "Writing")
    ?.click();
`);
await wait(150);
await evaluate(`
  [...document.querySelectorAll("button")]
    .find((button) => button.textContent?.trim() === "Update")
    ?.click();
`);
await wait(300);
const updateVerification = await evaluate(`
  [...document.querySelectorAll("article")].some(
    (article) =>
      article.textContent?.includes("45 min") &&
      article.textContent?.includes("Writing"),
  )
`);
if (!updateVerification.result.value) {
  throw new Error(
    "Edit verification failed: the existing entry was not updated",
  );
}

await navigate();
await evaluate(`
  [...document.querySelectorAll("button")]
    .find((button) => button.textContent?.includes("Add study session"))
    ?.click()
`);
await wait(300);
await evaluate("window.scrollTo(0, document.documentElement.scrollHeight)");
await wait(300);
await screenshot("milestone-1b-mobile-create.png");

await navigate();
await evaluate(
  `document.querySelector('button[aria-label*="January 15, 2026"]')?.click()`,
);
await wait(300);
await evaluate("window.scrollTo(0, document.documentElement.scrollHeight)");
await wait(300);
await screenshot("milestone-1b-mobile-selected-date.png");

socket.close();
