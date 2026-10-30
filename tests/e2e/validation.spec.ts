import { test, expect } from "@playwright/test";
import { addNft, login, scenario } from "./helpers";

test("registration conflict and profile server errors preserve editable fields", async ({
  page,
}) => {
  await page.goto("/register");
  await page.getByLabel("Nome de usuário", { exact: true }).fill("Nova");
  await page.getByLabel("E-mail", { exact: true }).fill("nova@kurio.test");
  await page.getByLabel("Senha", { exact: true }).fill("Kurio123!");
  await page.getByLabel("Confirmar senha", { exact: true }).fill("Kurio123!");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(
    page.getByText("E-mail já cadastrado", { exact: true }),
  ).toBeVisible();
  await login(page, "nova@kurio.test", "Kurio123!", "/profile");
  await scenario(page, "validation-error");
  await page.getByLabel("Nome de exibição").fill("Nome em edição");
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await expect(page.getByText("Nome indisponível neste cenário")).toBeVisible();
  await expect(page.getByLabel("Nome de exibição")).toHaveValue(
    "Nome em edição",
  );
  await scenario(page, "default");
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Perfil atualizado." }),
  ).toBeVisible();
  await page.getByLabel("Senha atual", { exact: true }).fill("Incorreta123");
  await page.getByLabel("Nova senha", { exact: true }).fill("NovaSenha123");
  await page
    .getByLabel("Confirmar nova senha", { exact: true })
    .fill("NovaSenha123");
  await page.getByRole("button", { name: "Salvar senha" }).click();
  await expect(
    page.getByText("Senha atual incorreta", { exact: true }),
  ).toBeVisible();
});

test("cart quantity, expired coupon and discount removal use API totals", async ({
  page,
}) => {
  await addNft(page);
  await page
    .getByRole("button", { name: "Aumentar Quantidade de Emerald Ape #042" })
    .click();
  await expect(page.locator(".grand-total dd")).toHaveText("2.396 ETH");
  await page.getByLabel("Código promocional").fill("EXPIRED");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(page.getByText("Cupom expirado.")).toBeVisible();
  await page.getByLabel("Código promocional").fill("KURIO10");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(page.locator(".grand-total dd")).toHaveText("2.158 ETH");
  await page.getByRole("button", { name: "Remover KURIO10" }).click();
  await expect(page.locator(".grand-total dd")).toHaveText("2.396 ETH");
});

test("obsolete search responses cannot overwrite the latest URL query", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await scenario(page, "variable-latency");
  const search = page.getByRole("textbox", {
    name: isMobile ? "Buscar NFTs" : "Buscar NFTs no catálogo",
    exact: true,
  });
  await search.fill("Emerald");
  await search.press("Enter");
  await search.fill("Golden");
  await search.press("Enter");
  await expect(page).toHaveURL(/q=Golden/);
  await expect(page.locator(".nft-name").first()).toContainText("Golden");
  await expect(
    page.locator(".nft-name").filter({ hasText: "Emerald" }),
  ).toHaveCount(0);
  // Wait for both deterministic latency windows, then prove the newer result remains.
  await page.waitForTimeout(1400);
  await expect(page.locator(".nft-name").first()).toContainText("Golden");
});
