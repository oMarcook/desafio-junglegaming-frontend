import { test, expect } from "@playwright/test";

test("authentication notices can be dismissed without closing the form", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("nova@kurio.test");
  for (const provider of ["Google", "Facebook"]) {
    await page
      .getByRole("button", { name: `Continuar com ${provider}` })
      .click();
    await expect(
      page.getByRole("status").filter({ hasText: `Login com ${provider}` }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Dispensar aviso" }).click();
    await expect(
      page.getByRole("button", { name: "Dispensar aviso" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("dialog", { name: "Entrar", exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("E-mail", { exact: true })).toHaveValue(
      "nova@kurio.test",
    );
  }
});

test("demo notices can be dismissed while retaining the open dialog", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".demo-toggle")).toHaveText(
    "Demonstração · conectado",
  );
  await page.locator(".demo-toggle").click();
  await page.getByRole("button", { name: "Alterar preço do Emerald" }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Preço ou disponibilidade atualizado" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Dispensar aviso" }).click();
  await expect(
    page.getByRole("dialog", { name: "Cenários de demonstração" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(page.locator(".demo-toggle")).toBeFocused();
});
