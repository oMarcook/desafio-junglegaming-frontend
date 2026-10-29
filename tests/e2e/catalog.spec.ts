import { test, expect } from "@playwright/test";
test("catalog search, combined filters, sorting, pagination and browser history", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await expect(
    page.locator(".nft-name").filter({ hasText: "Emerald Ape #042" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Página 2", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await page.reload();
  await expect(page).toHaveURL(/page=2/);
  await page.goBack();
  await expect(page).not.toHaveURL(/page=2/);
  if (isMobile)
    await page.getByRole("button", { name: "Abrir filtros" }).click();
  await page.getByRole("checkbox", { name: "Arte digital" }).check();
  await page.getByRole("checkbox", { name: "Ethereum" }).check();
  if (isMobile)
    await page.getByRole("button", { name: "Ver resultados" }).click();
  await expect(page).toHaveURL(/collections=Arte/);
  await expect(page).toHaveURL(/networks=Ethereum/);
  await page
    .getByRole("combobox", { name: "Ordenar por:" })
    .selectOption("price-desc");
  await expect(page.locator(".nft-name").first()).toHaveText(
    "Neon Vessel #552",
  );
  const search = page.getByRole("textbox", {
    name: isMobile ? "Buscar NFTs" : "Buscar NFTs no catálogo",
    exact: true,
  });
  await search.fill("inexistente");
  await search.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Nenhum NFT encontrado" }),
  ).toBeVisible();
});
test("mobile filter dialog keeps focus and closes with Escape", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile);
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir filtros" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Abrir filtros" }),
  ).toBeFocused();
});
test("no horizontal overflow at target widths", async ({ page }) => {
  await page.goto("/");
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.locator(".nft-card").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
