import { expect, test } from "@playwright/test";

test.describe("Phase 4A CEFR visual review", () => {
  test("covers CEFR history, forecast, and statistics states", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/cefr-preview");
    await expect(page.locator('[data-preview-ready="true"]')).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Your language level" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Track your progress and get approximate forecasts for reaching the next CEFR level.",
      ),
    ).toBeVisible();
    await expect(page.getByText(/self-declared/i)).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Study Time progress" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Vocabulary progress" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Level B1" })).toBeVisible();
    await expect(
      page.getByText(
        "B1 is the intermediate level for handling most familiar situations in daily life, work, study, and travel. You can understand the main points of clear standard language and produce connected text on topics you know. You can describe experiences, plans, opinions, and ambitions with brief explanations.",
      ),
    ).toBeVisible();
    const currentSummary = page
      .getByRole("heading", { name: "Level B1" })
      .locator("xpath=ancestor::div[@data-current-level-summary]");
    await expect(currentSummary.getByText("B1", { exact: true })).toHaveCount(
      1,
    );
    await expect(currentSummary.getByText("B2", { exact: true })).toHaveCount(
      0,
    );
    const weeklyPlan = page
      .getByRole("heading", { name: "Weekly plan to reach B2" })
      .locator("xpath=ancestor::section[1]");
    await expect(
      weeklyPlan.getByText(
        "A suggested 10-hour weekly mix for faster progress.",
      ),
    ).toBeVisible();
    await expect(weeklyPlan.getByText("Vocabulary")).toBeVisible();
    await expect(weeklyPlan.getByText("20% · 2h")).toHaveCount(3);
    await expect(weeklyPlan.getByText("Listening")).toBeVisible();
    await expect(weeklyPlan.getByText("40% · 4h")).toBeVisible();
    await expect(
      weeklyPlan.getByRole("img", {
        name: /Vocabulary 20 percent, 2 hours per week/,
      }),
    ).toBeVisible();
    await expect(weeklyPlan.getByText("Speak more often.")).toBeVisible();
    const levelHistory = page
      .getByRole("heading", { name: "Level history" })
      .locator("xpath=ancestor::section[1]");
    await expect(levelHistory.getByText("Since July 12, 2026")).toBeVisible();
    await expect(levelHistory.getByText("From January 10, 2025")).toBeVisible();
    await expect(levelHistory.getByText(/^Effective /)).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Edit current" }),
    ).toHaveCount(0);
    await expect(
      levelHistory.getByRole("button", { name: "Edit B1 declaration" }),
    ).toBeVisible();
    await expect(
      levelHistory.getByText("Level A0 - Absolute zero"),
    ).toBeVisible();

    const studyProgress = page
      .getByRole("heading", { name: "Study Time progress" })
      .locator("xpath=ancestor::section[1]");
    await expect(studyProgress.getByText("≈ 380h")).toBeVisible();
    await expect(studyProgress.getByText("+60h")).toBeVisible();
    await expect(studyProgress.getByText("≈ 440h now")).toBeVisible();
    await expect(studyProgress.getByText("≈ 580h total")).toBeVisible();
    await expect(studyProgress.getByText("≈ 140 hours left")).toBeVisible();
    await expect(studyProgress.getByText("30% completed")).toBeVisible();
    await expect(studyProgress.getByText(/200 hour interval/i)).toHaveCount(0);
    await expect(studyProgress.getByText("Forecast to reach B2")).toBeVisible();
    await expect(
      studyProgress.getByText("Last 7 days", { exact: true }),
    ).toBeVisible();
    await expect(
      studyProgress.getByText("Last 30 days", { exact: true }),
    ).toBeVisible();
    await expect(studyProgress.getByText("Average pace")).toBeVisible();
    await expect(studyProgress.getByText("Reach B2 in")).toBeVisible();
    await expect(studyProgress.getByText("Estimated date")).toBeVisible();
    await expect(studyProgress.getByText("60 min/day")).toBeVisible();

    const vocabularyProgress = page
      .getByRole("heading", { name: "Vocabulary progress" })
      .locator("xpath=ancestor::section[1]");
    await expect(vocabularyProgress.getByText("≈ 2,500 words")).toBeVisible();
    await expect(vocabularyProgress.getByText("+400 words")).toBeVisible();
    await expect(
      vocabularyProgress.getByText("≈ 2,900 words now"),
    ).toBeVisible();
    await expect(
      vocabularyProgress.getByText("≈ 3,700 words total"),
    ).toBeVisible();
    await expect(
      vocabularyProgress.getByText("≈ 800 words left"),
    ).toBeVisible();
    await expect(vocabularyProgress.getByText("33% completed")).toBeVisible();
    await expect(
      vocabularyProgress.getByText("Forecast to reach B2"),
    ).toBeVisible();
    await expect(
      vocabularyProgress.getByText(
        "Based on every calendar day, including days with no entries.",
      ),
    ).toBeVisible();
    await expect(vocabularyProgress.getByText("5 words/day")).toBeVisible();
    await expect(
      vocabularyProgress.getByText(/1,200 word interval/i),
    ).toHaveCount(0);
    await expect(page.getByText(/lemmas?/i)).toHaveCount(0);

    await page.getByText("How these estimates work").click();
    await expect(
      page.getByText("A0 to A1: 80–120 hours (calculation value: 100 hours)"),
    ).toBeVisible();
    await expect(
      page.getByText("C2: 5,000–8,000+ words (calculation value: 7,000 words)"),
    ).toBeVisible();
    await expect(
      page.getByText(
        "These ranges are based on vocabulary research by Milton and by Finlayson, Marsden, and Hawkes. They are not official CEFR standards.",
      ),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Statistics", exact: true })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Your learning overview" }),
    ).toBeVisible();
    await expect(page.getByText("Current level · B1")).toBeVisible();
    await expect(page.getByText("Tracked study time")).toBeVisible();
    await expect(page.getByText("Estimated learning time")).toBeVisible();
    await expect(page.getByText("Tracked words")).toBeVisible();
    await expect(page.getByText("Estimated words known")).toBeVisible();
    await expect(page.getByText(/non-future entries/i)).toHaveCount(0);
    await expect(page.getByText(/level estimate/i)).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Weekly plan to reach B2" }),
    ).toBeVisible();
    await page
      .getByRole("complementary")
      .getByRole("button", { name: "CEFR journey" })
      .click();

    for (const [state, target] of [
      ["a0", "A1"],
      ["a1", "A2"],
      ["a2", "B1"],
      ["b2", "C1"],
      ["c1", "C2"],
    ]) {
      await page.getByLabel("State").selectOption(state);
      await expect(
        page.getByRole("heading", { name: `Weekly plan to reach ${target}` }),
      ).toBeVisible();
    }

    await page.getByLabel("State").selectOption("a1");
    const a1Plan = page
      .getByRole("heading", { name: "Weekly plan to reach A2" })
      .locator("xpath=ancestor::section[1]");
    await expect(a1Plan.getByText("65% · 6.5h")).toBeVisible();
    await expect(a1Plan.getByText("15% · 1.5h")).toBeVisible();
    await expect(a1Plan.getByText("20% · 2h")).toBeVisible();
    const a1HasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(a1HasHorizontalOverflow).toBe(false);

    await page.getByLabel("State").selectOption("none");
    await expect(
      page.getByRole("heading", { name: "Set your current level" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Set current level" }).click();
    await expect(
      page.getByRole("heading", { name: "Add level update" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "B2", exact: true }).click();
    await expect(page.getByText("Level B2", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();

    await page.getByLabel("State").selectOption("zero");
    await expect(page.getByText("No data").first()).toBeVisible();
    await expect(page.getByText("No pace")).toHaveCount(0);

    await page.getByLabel("State").selectOption("reached");
    await expect(
      page.getByText("You reached this reference point.").first(),
    ).toBeVisible();

    await page.getByLabel("State").selectOption("c2");
    await expect(page.getByRole("heading", { name: "Level C2" })).toBeVisible();
    await expect(page.getByText("> 1,240 hours")).toBeVisible();
    await expect(page.getByText("> 7,400 words")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Weekly plan to reach/ }),
    ).toHaveCount(0);

    await page
      .getByRole("button", { name: "Statistics", exact: true })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Your learning overview" }),
    ).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
