import { Navigate, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { api, clearPrivateData, errorMessage, queryClient } from "./api";
import { sessionOptions, useSession } from "./queries";
import { ErrorState, Skeleton, useNotice } from "../components/feedback";
export function safeReturn(value: unknown) {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !/^\/(login|register)/.test(value)
    ? value
    : "/";
}
export async function requireSession(location: { href: string }) {
  const session = await queryClient.fetchQuery({
    ...sessionOptions,
    staleTime: 0,
  });
  if (!session.user)
    throw redirect({
      to: "/login",
      search: { redirect: safeReturn(location.href) },
    });
}
export function Protected({ children }: { children: ReactNode }) {
  const session = useSession();
  if (session.isPending) return <Skeleton />;
  if (session.isError)
    return <ErrorState error={session.error} retry={() => session.refetch()} />;
  if (!session.data.user)
    return (
      <Navigate
        to="/login"
        search={{
          redirect: safeReturn(
            window.location.pathname + window.location.search,
          ),
        }}
      />
    );
  return children;
}
export function useLogout() {
  const navigate = useNavigate();
  const notice = useNotice();
  return useMutation({
    mutationFn: async () => {
      await api.post("/session/logout");
      await queryClient.cancelQueries();
    },
    onSuccess: async () => {
      await navigate({ href: "/", replace: true });
      clearPrivateData();
      queryClient.setQueryData(["session"], { user: null, expiresAt: null });
      notice("Você saiu da sua conta.");
    },
    onError: (error) => notice(`Não foi possível sair. ${errorMessage(error)}`),
  });
}
