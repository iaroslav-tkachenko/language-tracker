import { expect, test, type Locator } from "@playwright/test";

async function coloredFlagPixels(element: Locator) {
  return element.evaluate(async (node) => {
    const style = getComputedStyle(node);
    const flags = ["🇩🇪", "🇮🇹"];
    if (!style.fontFamily.includes("Twemoji Country Flags")) {
      throw new Error("The flag font is missing from the control's font stack");
    }
    const faces = await document.fonts.load(
      `${style.fontWeight} ${style.fontSize} "Twemoji Country Flags"`,
      flags.join(""),
    );
    if (!faces.some((face) => face.status === "loaded")) {
      throw new Error("The local flag font did not load");
    }
    await document.fonts.ready;

    const canvas = document.createElement("canvas");
    canvas.width = 120;
    canvas.height = 60;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable");

    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    context.fillStyle = "black";
    return flags.map((flag) => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillText(flag, 0, 35);
      const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      ).data;
      let coloredPixels = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        const [red, green, blue, alpha] = pixels.slice(index, index + 4);
        if (
          alpha > 0 &&
          Math.max(red, green, blue) - Math.min(red, green, blue) > 30
        ) {
          coloredPixels += 1;
        }
      }
      return coloredPixels;
    });
  });
}

test("shows pasted country flags in language labels and text inputs", async ({
  page,
}) => {
  await page.goto("/vocabulary-preview");

  const languageMenu = page.locator("header summary").first();
  const germanOption = page.getByRole("button", {
    name: "German",
    exact: true,
  });
  const italianOption = page.getByRole("button", {
    name: "Italian",
    exact: true,
  });

  // Exercise the real menu without writing a language board to a database.
  await languageMenu.evaluate((node) => node.prepend("🇩🇪 "));
  await languageMenu.click();
  await germanOption.evaluate((node) => node.prepend("🇩🇪 "));
  await italianOption.evaluate((node) => node.prepend("🇮🇹 "));

  await expect(languageMenu).toContainText("🇩🇪 German");
  await expect(page.getByRole("button", { name: "🇩🇪 German" })).toBeVisible();
  await expect(page.getByRole("button", { name: "🇮🇹 Italian" })).toBeVisible();

  const input = page.locator("header").first().locator("input.flag-test");
  await page
    .locator("header")
    .first()
    .evaluate((header) => {
      const field = document.createElement("input");
      field.className = "flag-test";
      field.setAttribute("aria-label", "Language name");
      header.append(field);
    });
  await input.fill("🇩🇪 German");
  await expect(input).toHaveValue("🇩🇪 German");

  // Test the rendered colors using each control's actual computed font stack.
  for (const element of [
    languageMenu,
    page.getByRole("button", { name: "🇩🇪 German" }),
    input,
  ]) {
    for (const count of await coloredFlagPixels(element)) {
      expect(count).toBeGreaterThan(0);
    }
  }
});
