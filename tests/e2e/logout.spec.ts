import { test, expect } from "@playwright/test";
import { login, scenario } from "./helpers";

for (const entry of ["header", "profile"] as const) {
  test(`logout from ${entry} ends session and shows confirmation`, async ({
    page,
    isMobile,
  }) => {
    test.skip(
      entry === "header" && isMobile,
      "O cabeçalho é exclusivo do desktop.",
    );
    await login(page, "nova@kurio.test", "Kurio123!", "/profile");
    const container =
      entry === "header"
        ? page.locator(".desktop-header")
        : page.getByRole("navigation", { name: "Área do colecionador" });
    const response = page.waitForResponse((r) =>
      r.url().endsWith("/api/session/logout"),
    );
    await container.getByRole("button", { name: "Sair", exact: true }).click();
    expect((await response).status()).toBe(200);
    await expect(page).toHaveURL((url) => url.pathname === "/");
    await expect(
      page.getByRole("status").filter({ hasText: "Você saiu da sua conta." }),
    ).toBeVisible();
    await page.reload();
    await expect(page.locator(".nft-card").first()).toBeVisible();
    expect(
      await page.evaluate(
        async () => (await (await fetch("/api/session")).json()).user,
      ),
    ).toBeNull();
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login\?redirect=/);
    await expect(
      page.getByRole("button", { name: "Entrar", exact: true }),
    ).toBeVisible();
  });
}

test("failed logout shows error and allows retry without losing session", async ({
  page,
}) => {
  await login(page, "nova@kurio.test", "Kurio123!", "/profile");
  const button = page
    .getByRole("navigation", { name: "Área do colecionador" })
    .getByRole("button", { name: "Sair", exact: true });
  await expect(button).toBeVisible();
  await scenario(page, "server-error");
  await button.click();
  await expect(page.getByRole("status")).toContainText(
    "Não foi possível sair.",
  );
  await expect(page).toHaveURL(/\/profile$/);
  await expect(button).toBeEnabled();
  await scenario(page, "default");
  expect(
    await page.evaluate(
      async () => (await (await fetch("/api/session")).json()).user.email,
    ),
  ).toBe("nova@kurio.test");
  await button.click();
  await expect(page).toHaveURL((url) => url.pathname === "/");
  await expect(
    page.getByRole("status").filter({ hasText: "Você saiu da sua conta." }),
  ).toBeVisible();
});
