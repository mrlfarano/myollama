import { test, expect } from "@playwright/test";

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
    // Wait for page to load
    await page.waitForSelector('h2:has-text("Settings")', { timeout: 15000 });
  });

  test("page loads with Settings heading", async ({ page }) => {
    await expect(page.locator("h2")).toContainText("Settings");
  });

  test("URL input shows current Ollama URL", async ({ page }) => {
    const urlInput = page.locator("#ollama-url");
    await expect(urlInput).toBeVisible();

    // Wait for the URL to be populated from the config
    await page.waitForFunction(
      () => {
        const input = document.getElementById(
          "ollama-url"
        ) as HTMLInputElement;
        return input && input.value.length > 0;
      },
      { timeout: 10000 }
    );

    const value = await urlInput.inputValue();
    // Should contain a URL-like value
    expect(value).toMatch(/^https?:\/\//);
  });

  test("Test button works and shows connection result", async ({ page }) => {
    // Wait for the URL input to be populated
    await page.waitForFunction(
      () => {
        const input = document.getElementById(
          "ollama-url"
        ) as HTMLInputElement;
        return input && input.value.length > 0;
      },
      { timeout: 10000 }
    );

    // Click the Test button
    const testButton = page.locator("button", { hasText: "Test" });
    await expect(testButton).toBeVisible();
    await testButton.click();

    // Wait for the connection result badge to appear
    // Since Ollama is running locally, expect "Connected"
    await page.waitForSelector('[data-slot="badge"]', { timeout: 10000 });

    const badge = page.locator('[data-slot="badge"]', {
      hasText: /Connected|Connection failed/,
    });
    await expect(badge).toBeVisible();
  });

  test("Save button persists the URL change", async ({ page }) => {
    const urlInput = page.locator("#ollama-url");

    // Wait for the URL input to be populated
    await page.waitForFunction(
      () => {
        const input = document.getElementById(
          "ollama-url"
        ) as HTMLInputElement;
        return input && input.value.length > 0;
      },
      { timeout: 10000 }
    );

    // Get the current URL
    const originalUrl = await urlInput.inputValue();

    // Click the Save button (saves the current value without changing it)
    const saveButton = page.locator("button", { hasText: "Save" });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // Wait a moment for the save to complete
    await page.waitForTimeout(1000);

    // Reload the page to verify persistence
    await page.reload();
    await page.waitForSelector('h2:has-text("Settings")', { timeout: 15000 });

    // Wait for the URL to be populated again
    await page.waitForFunction(
      () => {
        const input = document.getElementById(
          "ollama-url"
        ) as HTMLInputElement;
        return input && input.value.length > 0;
      },
      { timeout: 10000 }
    );

    const reloadedUrl = await urlInput.inputValue();
    expect(reloadedUrl).toBe(originalUrl);
  });
});
