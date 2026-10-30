import { test, expect } from "@playwright/test";
import { addNft, connect, control, login, review, scenario } from "./helpers";

test("slow skeleton, HTTP error and connection failure recover through REST", async ({
  page,
}) => {
  await page.goto("/");
  await scenario(page, "slow");
  await page.goto("/nft/nft-1");
  await expect(
    page.getByRole("status", { name: "Carregando conteúdo" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
  ).toBeVisible();
  for (const failure of ["server-error", "offline"]) {
    await scenario(page, failure);
    await page
      .getByRole("button", { name: "Comprar NFT", exact: true })
      .click();
    await expect(
      page.getByRole("status").filter({
        hasText:
          failure === "server-error"
            ? "Serviço indisponível"
            : "Falha de conexão",
      }),
    ).toBeVisible();
  }
  await scenario(page, "default");
  await page.getByRole("button", { name: "Comprar NFT", exact: true }).click();
  await expect(page.locator(".cart-row")).toHaveCount(1);
});

test("stock event blocks checkout; wallet rejection and keyboard focus are recoverable", async ({
  page,
}) => {
  await login(page);
  await addNft(page);
  await page.getByRole("link", { name: "Conectar e finalizar" }).click();
  const trigger = page.getByRole("button", {
    name: "Conectar carteira",
    exact: true,
  });
  await trigger.click();
  await page.getByRole("button", { name: "Recusar conexão" }).click();
  await expect(page.getByRole("alert")).toContainText("Conexão recusada");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await connect(page);
  await review(page);
  await control(page, "nft", { id: "nft-1", soldOut: true });
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "disponibilidade insuficiente",
  );
  await expect(
    page.getByRole("button", { name: "Revisar compra" }),
  ).toBeDisabled();
  await page.goto("/orders");
  await expect(
    page.getByRole("heading", { name: "Você ainda não tem pedidos" }),
  ).toBeVisible();
});

test("pending order recovers after Socket.IO disconnect, reconnect and refresh", async ({
  page,
}) => {
  await page.clock.install();
  await login(page);
  await addNft(page);
  await page.getByRole("link", { name: "Conectar e finalizar" }).click();
  await connect(page);
  await review(page);
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Seu pedido está pendente" }),
  ).toBeVisible();
  const orderUrl = page.url();
  await page.locator(".demo-toggle").click();
  await page
    .getByRole("button", { name: "Desconectar tempo real", exact: true })
    .click();
  await page.clock.fastForward(4000);
  await page.getByRole("button", { name: "Reconectar", exact: true }).click();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Seus NFTs agora estão na sua carteira",
    }),
  ).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(orderUrl);
  await expect(
    page.getByRole("heading", {
      name: "Seus NFTs agora estão na sua carteira",
    }),
  ).toBeVisible();
  await page.goto("/orders");
  await expect(page.locator(".order-list>a")).toHaveCount(1);
});

test("all main screens fit desktop tablet and mobile", async ({ page }) => {
  await login(page);
  await addNft(page);
  for (const path of [
    "/nft/nft-1",
    "/cart",
    "/checkout",
    "/profile",
    "/wallets",
    "/login",
    "/register",
  ]) {
    await page.goto(path);
    await expect(page.locator(".demo-toggle")).toBeVisible();
    await expect(
      page.getByRole("status", { name: "Carregando conteúdo" }),
    ).toHaveCount(0);
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${path} at ${width}`,
      ).toBe(true);
    }
  }
});
