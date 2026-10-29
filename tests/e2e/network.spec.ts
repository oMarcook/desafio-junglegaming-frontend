import { test, expect, type Page } from "@playwright/test";
async function rest(
  page: Page,
  path: string,
  method = "GET",
  data?: unknown,
  headers?: Record<string, string>,
) {
  return page.evaluate(
    async ({ path, method, data, headers }) => {
      const response = await fetch("/api" + path, {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        body: data ? JSON.stringify(data) : undefined,
      });
      return { status: response.status, data: await response.json() };
    },
    { path, method, data, headers },
  );
}
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".nft-card").first()).toBeVisible();
});
test("mock API preserves precision and idempotency, and isolates receipts by user", async ({
  page,
}) => {
  await rest(page, "/cart", "POST", {
    nftId: "nft-1",
    editionId: "standard",
    quantity: 2,
  });
  await rest(page, "/session/login", "POST", {
    email: "nova@kurio.test",
    password: "Kurio123!",
  });
  const quote = await rest(page, "/quote");
  expect(quote.data.total).toBe("2.396");
  const body = {
    quoteId: quote.data.id,
    walletId: "wallet-1",
    collector: { name: "Nova", email: "nova@kurio.test", phone: "11999990000" },
  };
  const first = await rest(page, "/orders", "POST", body, {
    "Idempotency-Key": "test-order",
  });
  expect(first.status).toBe(201);
  const repeated = await rest(page, "/orders", "POST", body, {
    "Idempotency-Key": "test-order",
  });
  expect(repeated.data.id).toBe(first.data.id);
  const conflict = await rest(
    page,
    "/orders",
    "POST",
    { ...body, walletId: "wallet-2" },
    { "Idempotency-Key": "test-order" },
  );
  expect(conflict.status).toBe(409);
  await expect
    .poll(
      async () => (await rest(page, `/orders/${first.data.id}`)).data.status,
    )
    .toBe("confirmed");
  await rest(page, "/simulation/nft", "POST", { id: "nft-1" });
  const receipt = await rest(page, `/orders/${first.data.id}`);
  expect(receipt.data.quote.total).toBe("2.396");
  expect((await rest(page, "/cart")).data.items).toHaveLength(0);
  await rest(page, "/session/logout", "POST", {});
  await rest(page, "/session/login", "POST", {
    email: "alex@kurio.test",
    password: "Kurio123!",
  });
  expect((await rest(page, `/orders/${first.data.id}`)).status).toBe(403);
});
test("Socket.IO updates the visible catalogue and tolerates duplicate/old events", async ({
  page,
}) => {
  await expect(
    page.getByRole("button", { name: "Demonstração · conectado" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Demonstração · conectado" }).click();
  await page.getByRole("button", { name: "Evento duplicado e antigo" }).click();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(
    page.locator(".nft-card").first().locator(".nft-price"),
  ).toHaveText("1.29 ETH");
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Preço ou disponibilidade atualizado" }),
  ).toBeVisible();
});
