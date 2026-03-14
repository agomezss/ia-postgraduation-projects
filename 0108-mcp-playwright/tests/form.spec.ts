import { expect, test } from "@playwright/test";

test.describe("Image Form", () => {
  test("submits the form and appends a new card to the list", async ({
    page,
  }) => {
    await page.goto("", { waitUntil: "domcontentloaded" });

    const cards = page.getByRole("article");
    const initialCount = await cards.count();
    const title = `Generated Item ${Date.now()}`;
    const slug = title.toLowerCase().replace(/\s+/g, "-");
    const imageUrl = `https://picsum.photos/seed/${slug}/200/200`;

    await page.getByRole("textbox", { name: "Image Title" }).fill(title);
    await page.getByRole("textbox", { name: "Image URL" }).fill(imageUrl);
    await page.getByRole("button", { name: "Submit Form" }).click();

    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(cards).toHaveCount(initialCount + 1);
  });

  test("shows validation errors and does not append invalid entries", async ({
    page,
  }) => {
    await page.goto("", { waitUntil: "domcontentloaded" });

    const cards = page.getByRole("article");
    const initialCount = await cards.count();

    await page.getByRole("button", { name: "Submit Form" }).click();

    await expect(
      page.getByText("Please type a title for the image."),
    ).toBeVisible();
    await expect(page.getByText("Please type a valid URL")).toBeVisible();
    await expect(cards).toHaveCount(initialCount);

    const invalidTitle = "Invalid URL Entry";
    await page.getByRole("textbox", { name: "Image Title" }).fill(invalidTitle);
    await page.getByRole("textbox", { name: "Image URL" }).fill("not-a-url");
    await page.getByRole("button", { name: "Submit Form" }).click();

    await expect(page.getByText("Please type a valid URL")).toBeVisible();
    await expect(page.getByRole("heading", { name: invalidTitle })).toHaveCount(
      0,
    );
    await expect(cards).toHaveCount(initialCount);
  });
});
