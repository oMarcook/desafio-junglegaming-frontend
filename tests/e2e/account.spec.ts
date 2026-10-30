import { test, expect } from "@playwright/test";
import { addNft, connect, control, login, scenario } from "./helpers";
test("registration validates and persists profile, avatar and password", async ({
  page,
}) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.getByText("Verifique os campos indicados.")).toBeVisible();
  await page
    .getByLabel("Nome de usuário", { exact: true })
    .fill("Teste Colecionador");
  await page.getByLabel("E-mail", { exact: true }).fill("teste@kurio.test");
  await page.getByLabel("Senha", { exact: true }).fill("SenhaNova123!");
  await page
    .getByLabel("Confirmar senha", { exact: true })
    .fill("SenhaNova123!");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page).not.toHaveURL(/\/register/);
  await page.goto("/profile");
  await page.getByLabel("Nome de exibição").fill("Colecionador Atualizado");
  await page.getByLabel("Avatar", { exact: true }).setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(page.getByAltText("Seu avatar")).toHaveAttribute(
    "src",
    /^data:image\/png/,
  );
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Perfil atualizado." }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByAltText("Seu avatar")).toHaveAttribute(
    "src",
    /^data:image\/png/,
  );
  await expect(page.getByLabel("Nome de exibição")).toHaveValue(
    "Colecionador Atualizado",
  );
  await page.getByRole("button", { name: "Remover", exact: true }).click();
  await expect(page.getByAltText("Seu avatar")).toHaveCount(0);
  await expect(page.getByLabel("Avatar", { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Perfil atualizado." }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Nome de exibição")).toBeVisible();
  await expect(page.getByAltText("Seu avatar")).toHaveCount(0);
  const avatarFile = {
    name: "avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      "base64",
    ),
  };
  await page.getByLabel("Avatar", { exact: true }).setInputFiles(avatarFile);
  await expect(page.getByAltText("Seu avatar")).toBeVisible();
  await page.getByRole("button", { name: "Remover", exact: true }).click();
  await expect(page.getByLabel("Avatar", { exact: true })).toHaveValue("");
  await page.getByLabel("Avatar", { exact: true }).setInputFiles(avatarFile);
  await expect(page.getByAltText("Seu avatar")).toBeVisible();
  await page.getByRole("button", { name: "Dispensar aviso" }).click();
  await page.locator(".password-form").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Salvar senha" }).click();
  await expect(
    page.getByText("Preencha a senha atual", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Senha atual", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.getByLabel("Senha atual", { exact: true }).fill("SenhaNova123!");
  await page.getByLabel("Nova senha", { exact: true }).fill("SenhaFinal123!");
  await page
    .getByLabel("Confirmar nova senha", { exact: true })
    .fill("SenhaFinal123!");
  await page.getByRole("button", { name: "Salvar senha" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Senha alterada." }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Área do colecionador" })
    .getByRole("button", { name: "Sair" })
    .click();
  await login(page, "teste@kurio.test", "SenhaFinal123!", "/profile");
  await expect(page.getByLabel("Nome de exibição")).toHaveValue(
    "Colecionador Atualizado",
  );
});
test("wallet creation, validation and editing persist", async ({ page }) => {
  await login(page, "nova@kurio.test", "Kurio123!", "/wallets");
  await page.getByRole("button", { name: "Adicionar carteira" }).click();
  await page.getByLabel("Apelido da carteira").fill("Minha carteira");
  await page.getByLabel("Endereço da carteira").fill("incorreto");
  await page.getByRole("button", { name: "Salvar carteira" }).click();
  await expect(page.getByText("Endereço de carteira inválido")).toBeVisible();
  await page.getByLabel("Endereço da carteira").fill("minha.eth");
  await page.getByRole("button", { name: "Salvar carteira" }).click();
  await expect(
    page.getByRole("button", { name: "Minha carteira", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Minha carteira", exact: true })
    .click();
  await page.getByLabel("Apelido da carteira").fill("Reserva nova");
  await page.getByRole("button", { name: "Salvar carteira" }).click();
  await expect(
    page.getByRole("button", { name: "Reserva nova", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Reserva nova", exact: true }).click();
  await expect(page.getByLabel("Endereço da carteira")).toHaveValue(
    "minha.eth",
  );
});
test("favorite failure rolls back and session switch isolates private data", async ({
  page,
}) => {
  await login(page);
  await page.goto("/nft/nft-1");
  await scenario(page, "favorite-error");
  await page.getByRole("button", { name: "Favoritar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Favoritar", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Não foi possível salvar o favorito." }),
  ).toBeVisible();
  await scenario(page, "default");
  await page.getByRole("button", { name: "Favoritar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Favoritado", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/profile");
  await page
    .getByRole("navigation", { name: "Área do colecionador" })
    .getByRole("button", { name: "Sair" })
    .click();
  await login(page, "alex@kurio.test", "Kurio123!", "/favorites");
  await expect(
    page.getByRole("heading", { name: "Nenhum favorito ainda" }),
  ).toBeVisible();
});
test("expiration during checkout retains collector draft and resumes after login", async ({
  page,
}) => {
  await login(page);
  await addNft(page);
  await page.getByRole("link", { name: "Conectar e finalizar" }).click();
  await page.getByLabel("Nome de exibição").fill("Nome preservado");
  await connect(page);
  await control(page, "expire");
  await page.getByRole("button", { name: "Revisar compra" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("E-mail", { exact: true }).fill("nova@kurio.test");
  await page.getByLabel("Senha", { exact: true }).fill("Kurio123!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/checkout/);
  await expect(page.getByLabel("Nome de exibição")).toHaveValue(
    "Nome preservado",
  );
});
