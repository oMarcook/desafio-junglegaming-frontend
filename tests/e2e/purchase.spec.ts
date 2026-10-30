import { test, expect } from "@playwright/test";
import { addNft, connect, control, login, review, scenario } from "./helpers";
test("guest cart survives login, coupon and complete purchase produces immutable receipt", async ({
  page,
}) => {
  await addNft(page);
  await page.reload();
  await expect(page.locator(".cart-row")).toHaveCount(1);
  await page.getByLabel("Código promocional").fill("INVALID");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(page.getByText("Cupom inválido.")).toBeVisible();
  await page.getByLabel("Código promocional").fill("KURIO10");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(page.locator(".grand-total dd")).toHaveText("1.087 ETH");
  await page.getByRole("link", { name: "Conectar e finalizar" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("E-mail", { exact: true }).fill("nova@kurio.test");
  await page.getByLabel("Senha", { exact: true }).fill("Kurio123!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/checkout/);
  await connect(page);
  await review(page);
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click({ clickCount: 2 });
  await expect(page).toHaveURL(/\/orders\//);
  await expect(
    page.getByRole("heading", {
      name: "Seus NFTs agora estão na sua carteira",
    }),
  ).toBeVisible();
  const total = await page.locator(".grand-total dd").textContent();
  await control(page, "nft", { id: "nft-1" });
  await page.reload();
  await expect(page.locator(".grand-total dd")).toHaveText(total!);
  await page.goto("/cart");
  await expect(
    page.getByRole("heading", { name: "Seu carrinho está vazio" }),
  ).toBeVisible();
});
test("price change after review requires a second explicit confirmation", async ({
  page,
}) => {
  await login(page);
  await addNft(page);
  await page.getByRole("link", { name: "Conectar e finalizar" }).click();
  await connect(page);
  await review(page);
  await control(page, "nft", { id: "nft-1", duplicate: true });
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Preço ou disponibilidade alterados" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/checkout/);
  await expect(page.getByRole("dialog").locator(".grand-total dd")).toHaveText(
    "1.306 ETH",
  );
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Seus NFTs agora estão na sua carteira",
    }),
  ).toBeVisible();
});
test("lost response recovers same order after reload", async ({ page }) => {
  await login(page);
  await addNft(page);
  await page.getByRole("link", { name: "Conectar e finalizar" }).click();
  await connect(page);
  await scenario(page, "order-timeout");
  await review(page);
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Recuperar pedido", exact: true }),
  ).toBeEnabled({ timeout: 15000 });
  await page.reload();
  await page
    .getByRole("button", { name: "Recuperar pedido", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Seus NFTs agora estão na sua carteira",
    }),
  ).toBeVisible();
  await page.goto("/orders");
  await expect(page.locator(".order-list>a")).toHaveCount(1);
});
test("declined payment preserves items and does not show confirmation", async ({
  page,
}) => {
  await login(page);
  await addNft(page);
  await page.getByRole("link", { name: "Conectar e finalizar" }).click();
  await connect(page);
  await scenario(page, "payment-declined");
  await review(page);
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Pagamento recusado" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Seus NFTs agora estão na sua carteira",
    }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Voltar ao carrinho" }).click();
  await expect(page.locator(".cart-row")).toHaveCount(1);
});
test("unavailable edition, invalid NFT, quantity limits and cart removal", async ({
  page,
}) => {
  await page.goto("/nft/missing");
  await expect(page.getByText("NFT não encontrado.")).toBeVisible();
  await page.goto("/nft/nft-1");
  await page.getByRole("radio", { name: /esgotada/ }).check();
  await expect(
    page.getByRole("button", { name: "Comprar NFT", exact: true }),
  ).toBeDisabled();
  await page.getByRole("radio", { name: "1/10", exact: true }).check();
  await page
    .getByRole("button", { name: "Aumentar Quantidade", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Aumentar Quantidade", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Comprar NFT", exact: true }).click();
  await page.getByRole("button", { name: "Remover Emerald Ape #042" }).click();
  await expect(
    page.getByRole("heading", { name: "Seu carrinho está vazio" }),
  ).toBeVisible();
});
