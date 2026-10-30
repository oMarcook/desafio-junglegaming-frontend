import { z } from "zod";
export const email = z
  .string()
  .email("Informe um e-mail válido")
  .transform((v) => v.toLowerCase());
export const password = z.string().min(8, "Use pelo menos 8 caracteres");
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Informe a senha"),
});
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome"),
    email,
    password,
    confirmation: z.string(),
  })
  .refine((v) => v.password === v.confirmation, {
    path: ["confirmation"],
    message: "As senhas não coincidem",
  });
export const profileSchema = z.object({
  username: z.string().trim().min(2, "Informe seu nome de usuário").optional(),
  ens: z
    .string()
    .regex(
      /^$|^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.eth$/,
      "Use um nome terminado em .eth",
    )
    .optional(),
  walletLabel: z.string().max(60).optional(),
  name: z.string().trim().min(2, "Informe seu nome"),
  email,
  phone: z.string().max(30),
  avatar: z
    .string()
    .max(800000)
    .refine(
      (v) => !v || /^data:image\/(png|jpeg|webp);base64,/.test(v),
      "Use uma imagem PNG, JPEG ou WebP",
    ),
});
export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Preencha a senha atual"),
    password,
    confirmation: z.string(),
  })
  .refine((v) => v.password === v.confirmation, {
    path: ["confirmation"],
    message: "As senhas não coincidem",
  });
export const walletSchema = z.object({
  label: z.string().trim().min(2),
  address: z
    .string()
    .regex(
      /^(0x[a-fA-F0-9]{40}|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.eth|[1-9A-HJ-NP-Za-km-z]{32,44})$/,
      "Endereço de carteira inválido",
    ),
  network: z.enum(["Ethereum", "Polygon", "Solana"]),
  primary: z.boolean(),
  displayName: z.string().max(80).optional(),
  profileName: z.string().max(80).optional(),
  email: z.union([email, z.literal("")]).optional(),
  provider: z.enum(["MetaMask", "WalletConnect", "Coinbase Wallet"]).optional(),
  referral: z.string().max(60).optional(),
  ens: z
    .string()
    .regex(
      /^$|^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.eth$/,
      "Use um nome terminado em .eth",
    )
    .optional(),
});
export const collectorSchema = z.object({
  username: z.string().trim().min(2, "Informe seu nome de usuário").optional(),
  profileName: z.string().trim().min(2, "Informe o nome do perfil").optional(),
  ens: z
    .string()
    .regex(
      /^$|^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.eth$/,
      "Use um nome terminado em .eth",
    )
    .optional(),
  referral: z.string().max(60).optional(),
  note: z.string().max(500).optional(),
  name: z.string().trim().min(2, "Informe seu nome"),
  email,
  phone: z.string().min(8, "Informe um telefone").max(30),
});
