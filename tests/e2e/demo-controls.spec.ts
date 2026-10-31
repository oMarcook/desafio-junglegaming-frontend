import { test, expect } from "@playwright/test";
import { addNft, login } from "./helpers";

test("demo buttons expire the session and reset saved data", async ({
  page,
}) => {
  await login(page, "nova@kurio.test", "Kurio123!", "/profile");
  await expect(page.getByLabel("Nome de exibição")).toBeVisible();
  await page.locator(".demo-toggle").click();
  const expired = page.waitForResponse((r) =>
    r.url().endsWith("/api/simulation/expire"),
  );
  await page
    .getByRole("button", { name: "Expirar sessão", exact: true })
    .click();
  expect((await expired).status()).toBe(200);
  await expect(
    page.getByRole("dialog", { name: "Cenários de demonstração" }),
  ).toHaveCount(0);
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await expect(
    page.getByRole("status").filter({ hasText: "Sua sessão expirou." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Entrar", exact: true }),
  ).toBeVisible();

  await addNft(page);
  await page.locator(".demo-toggle").click();
  const reset = page.waitForResponse((r) =>
    r.url().endsWith("/api/simulation/reset"),
  );
  await page
    .getByRole("button", { name: "Restaurar demonstração", exact: true })
    .click();
  expect((await reset).status()).toBe(200);
  await expect(page).toHaveURL((url) => url.pathname === "/");
  await expect(page.locator(".nft-card").first()).toBeVisible();
  await page.goto("/cart");
  await expect(
    page.getByRole("heading", { name: "Seu carrinho está vazio" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      async () => (await (await fetch("/api/session")).json()).user,
    ),
  ).toBeNull();
});
