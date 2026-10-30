import { expect, type Page } from "@playwright/test";
export async function scenario(page: Page, name: string) {
  await expect(page.locator(".demo-toggle")).toBeVisible();
  await page.evaluate(async (scenario) => {
    const response = await fetch("/api/simulation/scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario }),
    });
    await response.json();
  }, name);
}
export async function control(
  page: Page,
  path: string,
  data: Record<string, unknown> = {},
) {
  await expect(page.locator(".demo-toggle")).toBeVisible();
  await page.evaluate(
    async ({ path, data }) => {
      const response = await fetch(`/api/simulation/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await response.json();
    },
    { path, data },
  );
}
export async function login(
  page: Page,
  email = "nova@kurio.test",
  password = "Kurio123!",
  redirect = "/",
) {
  await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`);
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
export async function addNft(page: Page, id = "nft-1") {
  await page.goto(`/nft/${id}`);
  await page.getByRole("button", { name: "Comprar NFT", exact: true }).click();
  await expect(page).toHaveURL(/\/cart/);
  await expect(page.locator(".cart-row")).toHaveCount(1);
}
export async function connect(page: Page) {
  await page
    .getByRole("button", { name: "Conectar carteira", exact: true })
    .click();
  await page.getByRole("button", { name: "Conectar", exact: true }).click();
  await expect(
    page.getByText("Conectada · simulação", { exact: true }),
  ).toBeVisible();
}
export async function review(page: Page) {
  await page
    .getByRole("button", { name: "Revisar compra", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Revise sua compra" }),
  ).toBeVisible();
}
