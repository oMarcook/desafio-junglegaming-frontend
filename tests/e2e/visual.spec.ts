import { test, expect } from "@playwright/test";
import { addNft, connect, login, review } from "./helpers";
test("visual home with stable fixtures", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
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

test("visual confirmed purchase receipt", async ({ page }) => {
  await login(page);
  await addNft(page);
  await page.getByRole("link", { name: "Conectar e finalizar" }).click();
  await connect(page);
  await review(page);
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Seus NFTs agora estão na sua carteira",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", { name: "NFTs deste pedido" }),
  ).toContainText("Emerald Ape #042");
  await page.getByRole("button", { name: "Dispensar aviso" }).click();
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot("receipt.png", {
    fullPage: true,
    animations: "disabled",
    mask: [
      page.locator(".demo-toggle"),
      page.locator(".receipt-meta dd").nth(0),
      page.locator(".receipt-meta dd").nth(1),
      page.locator(".receipt-order-id"),
    ],
  });
  await page.getByRole("link", { name: "Voltar aos meus pedidos" }).click();
  await page.locator(".order-list>a").click();
  await expect(
    page.getByRole("heading", {
      name: "Seus NFTs agora estão na sua carteira",
    }),
  ).toBeVisible();
});
