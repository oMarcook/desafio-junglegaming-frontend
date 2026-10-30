import { test, expect } from "@playwright/test";
import { addNft, login } from "./helpers";
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
for (const screen of ["detail", "cart", "payment"] as const) {
  test(`visual ${screen} with stable fixtures`, async ({ page }) => {
    if (screen === "payment") await login(page);
    if (screen === "detail") {
      await page.goto("/nft/nft-1");
      await expect(page.locator(".detail-info")).toBeVisible();
    } else {
      await addNft(page);
      if (screen === "payment") {
        await page.getByRole("link", { name: "Conectar e finalizar" }).click();
        await expect(page.getByLabel("Nome de exibição")).toBeVisible();
      }
    }
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${screen}.png`, {
      fullPage: true,
      animations: "disabled",
      mask: [page.locator(".demo-toggle")],
    });
  });
}
