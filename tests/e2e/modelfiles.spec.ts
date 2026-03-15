import { test, expect } from "@playwright/test";

test.describe("Modelfiles Page", () => {
  const TEST_DRAFT_NAME = `e2e-test-draft-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    await page.goto("/modelfiles");
    // Wait for the page to load — the form heading should appear
    await page.waitForSelector('text="Model Configuration"', {
      timeout: 15000,
    });
  });

  test("page loads with the three-pane layout", async ({ page }) => {
    // Left pane: Drafts sidebar
    await expect(page.locator('text="Drafts"')).toBeVisible();

    // Center pane: Model Configuration form
    await expect(page.locator('text="Model Configuration"')).toBeVisible();

    // Right pane: Preview
    // The preview panel shows JSON output
    const preview = page.locator("pre");
    await expect(preview).toBeVisible();
  });

  test("drafts sidebar is visible", async ({ page }) => {
    await expect(page.locator('text="Drafts"')).toBeVisible();
  });

  test("form has all required fields", async ({ page }) => {
    // Model name
    await expect(page.locator('text="Model Name"')).toBeVisible();
    await expect(page.getByPlaceholder("my-custom-model")).toBeVisible();

    // Base model
    await expect(page.locator('text="Base Model"')).toBeVisible();
    await expect(page.locator("select")).toBeVisible();

    // System prompt
    await expect(page.locator('text="System Prompt"')).toBeVisible();

    // Parameters section
    await expect(page.locator('text="Temperature"')).toBeVisible();
    await expect(page.locator('text="Top P"')).toBeVisible();
    await expect(page.locator('text="Top K"')).toBeVisible();
    await expect(page.locator('text="Context Length"')).toBeVisible();
    await expect(page.locator('text="Repeat Penalty"')).toBeVisible();
  });

  test("JSON preview updates when form fields change", async ({ page }) => {
    // Get initial preview content
    const preview = page.locator("pre");
    const initialPreview = await preview.textContent();

    // Fill in the model name
    await page.getByPlaceholder("my-custom-model").fill("test-model");

    // Wait for preview to update
    await page.waitForTimeout(300);

    const updatedPreview = await preview.textContent();
    expect(updatedPreview).toContain("test-model");
    expect(updatedPreview).not.toEqual(initialPreview);
  });

  test("save draft works and appears in sidebar, then delete works", async ({
    page,
  }) => {
    // Fill in the model name
    await page.getByPlaceholder("my-custom-model").fill(TEST_DRAFT_NAME);

    // Select a base model (pick the first available)
    const selectEl = page.locator("select");
    const options = selectEl.locator("option");
    const optionCount = await options.count();

    if (optionCount > 1) {
      // Select the second option (first is "Select a base model...")
      const optionValue = await options.nth(1).getAttribute("value");
      if (optionValue) {
        await selectEl.selectOption(optionValue);
      }
    }

    // Click Save Draft
    await page.locator("button", { hasText: "Save Draft" }).click();

    // Wait for the draft to appear in the sidebar
    await page.waitForSelector(`text="${TEST_DRAFT_NAME}"`, { timeout: 10000 });
    await expect(page.locator(`text="${TEST_DRAFT_NAME}"`)).toBeVisible();

    // Now delete the draft — hover over it to show the delete button
    const draftItem = page
      .locator(`text="${TEST_DRAFT_NAME}"`)
      .locator("..");
    await draftItem.hover();

    // Click the delete button for this draft
    const deleteButton = page.getByLabel(`Delete ${TEST_DRAFT_NAME}`);
    await deleteButton.click();

    // Wait for the draft to be removed
    await page.waitForTimeout(1000);
    await expect(
      page.locator(`text="${TEST_DRAFT_NAME}"`).first()
    ).not.toBeVisible();
  });
});
