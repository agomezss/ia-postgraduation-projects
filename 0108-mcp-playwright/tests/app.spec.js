const { test, expect } = require("@playwright/test");

test("loads the sample app homepage", async ({ page }) => {
  await page.goto("", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "AI Alien" })).toBeVisible();
});
