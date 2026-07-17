import { mkdir, writeFile } from "node:fs/promises";

const debuggingPort = 9223;
const appOrigin = "http://127.0.0.1:3001";
const outputDirectory = "docs/design/phase-0";

await mkdir(outputDirectory, { recursive: true });

const targetResponse = await fetch(
  `http://127.0.0.1:${debuggingPort}/json/new?${encodeURIComponent(`${appOrigin}/sign-in`)}`,
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

async function navigate(pathname) {
  await send("Page.navigate", { url: `${appOrigin}${pathname}` });
  await send("Emulation.setDeviceMetricsOverride", mobileViewport);
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

const mobileViewport = {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
  screenWidth: 390,
  screenHeight: 844,
};

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", mobileViewport);

await navigate("/sign-in");
await screenshot("auth-sign-in-mobile.png");
await evaluate(`document.querySelector('button[type="submit"]')?.click()`);
await wait(500);
const validationVerification = await evaluate(`
  document.body.textContent?.includes("Enter a valid email address.") &&
  document.body.textContent?.includes("Password must contain at least 8 characters.")
`);
if (!validationVerification.result.value) {
  throw new Error("Sign-in validation verification failed");
}
await evaluate(`
  const setValue = (selector, value) => {
    const input = document.querySelector(selector);
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set;
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };
  setValue('input[name="email"]', "owner@example.com");
  setValue('input[name="password"]', "valid-password");
  document.querySelector('button[type="submit"]')?.click();
`);
await wait(800);
const configurationVerification = await evaluate(`
  document.body.textContent?.includes("Authentication is not connected yet.")
`);
if (!configurationVerification.result.value) {
  throw new Error("Missing Supabase configuration state verification failed");
}

await navigate("/sign-up");
await send("Page.reload", { ignoreCache: true });
await wait(1_200);
await screenshot("auth-sign-up-mobile.png");

socket.close();
