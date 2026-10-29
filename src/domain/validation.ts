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
    currentPassword: z.string().min(1),
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
      /^(0x[a-fA-F0-9]{40}|[a-z0-9-]+\.eth|[1-9A-HJ-NP-Za-km-z]{32,44})$/,
      "Endereço de carteira inválido",
    ),
  network: z.enum(["Ethereum", "Polygon", "Solana"]),
  primary: z.boolean(),
});
export const collectorSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome"),
  email,
  phone: z.string().min(8, "Informe um telefone").max(30),
});
