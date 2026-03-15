import { test, expect } from "@playwright/test";

test.describe("Library Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the page to be fully loaded (catalog models should appear)
    await page.waitForSelector('[data-slot="card"]', { timeout: 15000 });
  });

  test("page loads with model cards", async ({ page }) => {
    // The header should show "MyOllama"
    await expect(page.locator("h1")).toContainText("MyOllama");

    // Model cards should be visible
    const cards = page.locator('[data-slot="card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("search bar is visible and functional", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search models...");
    await expect(searchInput).toBeVisible();

    // Get initial card count
    const initialCards = await page.locator('[data-slot="card"]').count();

    // Type a search query
    await searchInput.fill("llama");
    // Wait for filtered results
    await page.waitForTimeout(500);

    const filteredCards = page.locator('[data-slot="card"]');
    const filteredCount = await filteredCards.count();

    // Should have filtered results (fewer or equal to initial)
    expect(filteredCount).toBeLessThanOrEqual(initialCards);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test("filter pills are clickable and filter the grid", async ({ page }) => {
    // Get initial card count
    const initialCount = await page.locator('[data-slot="card"]').count();

    // The filter badges are in the top filter area, not inside cards.
    // Target the "Code" filter pill by looking for an exact-text badge
    // that's a direct child of the filter row (not inside a card).
    // The filter area is above the cards grid.
    const codeBadge = page
      .locator('[data-slot="badge"]')
      .filter({ hasText: /^Code$/ })
      .first();
    await expect(codeBadge).toBeVisible();

    // Click the Code filter
    await codeBadge.click();
    await page.waitForTimeout(500);

    // Cards should be filtered — fewer than initial
    const cards = page.locator('[data-slot="card"]');
    const filteredCount = await cards.count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(initialCount);
  });

  test("model cards display name and description", async ({ page }) => {
    // Get the first card
    const firstCard = page.locator('[data-slot="card"]').first();
    await expect(firstCard).toBeVisible();

    // Should have a heading (model name)
    const heading = firstCard.locator("h3");
    await expect(heading).toBeVisible();
    const name = await heading.textContent();
    expect(name).toBeTruthy();

    // Should have a description paragraph
    const description = firstCard.locator("p");
    await expect(description.first()).toBeVisible();
  });

  test("pull-by-name bar is visible at the bottom", async ({ page }) => {
    const pullInput = page.getByPlaceholder(
      "Pull a model by name, e.g. llama3:8b"
    );
    await expect(pullInput).toBeVisible();

    const pullButton = page.locator("button", { hasText: "Pull" });
    await expect(pullButton.first()).toBeVisible();
  });

  test("connection status indicator is visible in header", async ({
    page,
  }) => {
    // The connection status dot should be visible in the header
    // It's a small colored div with rounded-full class
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Should contain the connection status component (a dot element)
    const statusDot = header.locator(".rounded-full");
    await expect(statusDot).toBeVisible();
  });
});
