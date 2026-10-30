import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { api, clearPrivateData, queryClient } from "../lib/api";
import { useApiForm, formValues } from "../lib/forms";
import { loginSchema, registerSchema } from "../domain/validation";
import { Field } from "../components/field";
import { PasswordField } from "../components/password-field";
import { Button } from "../components/ui/button";
import { useNotice } from "../components/feedback";
import { HomePage } from "./home";
import type { Session } from "../domain/types";
import { safeReturn } from "../lib/auth";
export function AuthPage({ register = false }: { register?: boolean }) {
  const navigate = useNavigate(),
    search = useSearch({ strict: false }) as { redirect?: string },
    notice = useNotice(),
    destination = safeReturn(search.redirect);
  const form = useApiForm(
    register ? registerSchema : loginSchema,
    async (data) => {
      const response = await api.post<Session>(
        register ? "/session/register" : "/session/login",
        data,
      );
      clearPrivateData();
      queryClient.setQueryData(["session"], response.data);
      return response.data;
    },
    () => {
      notice(
        register
          ? "Perfil criado. Bem-vindo à Kurio!"
          : "Você entrou na sua conta.",
      );
      void navigate({ href: destination });
    },
  );
  return (
    <>
      <div className="auth-backdrop" inert aria-hidden="true">
        <HomePage />
      </div>
      <DialogPrimitive.Root
        open
        onOpenChange={(open) => {
          if (!open) void navigate({ href: "/" });
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="auth-overlay" />
          <DialogPrimitive.Content
            aria-describedby="auth-description"
            className={`auth-card ${register ? "register-card" : ""}`}
          >
            <DialogPrimitive.Close
              className="auth-close"
              aria-label="Fechar autenticação"
            >
              <X size={20} />
            </DialogPrimitive.Close>
            <div className="auth-logo">KURIO</div>
            <div className="auth-tabs">
              <Link
                to="/login"
                search={{ redirect: destination }}
                className={!register ? "selected" : ""}
              >
                Entrar
              </Link>
              <span>|</span>
              <Link
                to="/register"
                search={{ redirect: destination }}
                className={register ? "selected" : ""}
              >
                Criar conta
              </Link>
            </div>
            <DialogPrimitive.Title className="auth-title">
              {register ? "Criar perfil de colecionador" : "Entrar"}
            </DialogPrimitive.Title>
            <p id="auth-description">
              {register
                ? "Crie seu perfil de colecionador e conecte uma carteira quando quiser."
                : "Entre para gerenciar sua carteira, coleção e perfil de criador."}
            </p>
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                form.mutate(formValues(e.currentTarget));
              }}
            >
              {register && (
                <Field
                  name="name"
                  label="Nome de usuário"
                  autoComplete="nickname"
                  placeholder="Nome de usuário"
                  error={form.fields.name}
                />
              )}
              <Field
                name="email"
                type="email"
                label="E-mail"
                autoComplete="email"
                placeholder="contato@email.com"
                error={form.fields.email}
              />
              <PasswordField
                name="password"
                label="Senha"
                autoComplete={register ? "new-password" : "current-password"}
                error={form.fields.password}
              />
              {register && (
                <PasswordField
                  name="confirmation"
                  label="Confirmar senha"
                  error={form.fields.confirmation}
                />
              )}
              {!register && (
                <button
                  className="forgot"
                  type="button"
                  onClick={() =>
                    notice(
                      "Recuperação por e-mail fora do escopo. Use nova@kurio.test com a senha Kurio123! ou restaure a demonstração.",
                    )
                  }
                >
                  Esqueceu a senha?
                </button>
              )}
              {form.message && (
                <p role="alert" className="form-error">
                  {form.message}
                </p>
              )}
              <Button className="auth-submit" disabled={form.isPending}>
                {form.isPending
                  ? "Aguarde…"
                  : register
                    ? "Criar conta"
                    : "Entrar"}
              </Button>
            </form>
            <div className="auth-divider">Ou continue com</div>
            <Button
              variant="outline"
              className="social-login"
              onClick={() =>
                notice(
                  "Login com Google não está disponível nesta demonstração. Use e-mail e senha.",
                )
              }
            >
              <img src="/assets/google.svg" alt="" width="20" height="20" />
              Continuar com Google
            </Button>
            <Button
              variant="outline"
              className="social-login"
              onClick={() =>
                notice(
                  "Login com Facebook não está disponível nesta demonstração. Use e-mail e senha.",
                )
              }
            >
              <img
                src="/assets/facebook-login.svg"
                alt=""
                width="20"
                height="20"
              />
              Continuar com Facebook
            </Button>
            <div className="auth-switch">
              {register ? (
                <Link to="/login" search={{ redirect: destination }}>
                  Já tem uma conta? Entre
                </Link>
              ) : (
                <Link to="/register" search={{ redirect: destination }}>
                  Novo na Kurio? Crie uma conta
                </Link>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
