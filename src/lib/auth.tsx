import { Navigate, redirect } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { api, clearPrivateData, queryClient } from "./api";
import { sessionOptions, useSession } from "./queries";
import { ErrorState, Skeleton } from "../components/feedback";
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
export async function logout() {
  await api.post("/session/logout");
  clearPrivateData();
  queryClient.setQueryData(["session"], { user: null, expiresAt: null });
  window.location.assign("/");
}
