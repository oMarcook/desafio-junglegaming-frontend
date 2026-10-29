import { test, expect } from "@playwright/test";
test("visual home with stable fixtures", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".nft-card").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot("home.png", {
    fullPage: true,
    animations: "disabled",
    mask: [page.locator(".demo-toggle")],
  });
});
