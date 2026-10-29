import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Layout } from "./components/layout";
import { EmptyState } from "./components/feedback";
import { HomePage, initialSearch } from "./pages/home";
import type { CatalogSearch } from "./domain/types";
const root = createRootRoute({
  component: Layout,
  notFoundComponent: () => (
    <EmptyState title="Página não encontrada">
      <a href="/">Voltar ao catálogo</a>
    </EmptyState>
  ),
});
const home = createRoute({
  getParentRoute: () => root,
  path: "/",
  validateSearch: (s: Record<string, unknown>): CatalogSearch => ({
    ...initialSearch,
    ...Object.fromEntries(
      ["q", "collections", "networks", "min", "max", "sort", "tab"].map((k) => [
        k,
        typeof s[k] === "string"
          ? s[k]
          : initialSearch[k as keyof CatalogSearch],
      ]),
    ),
    page: Math.max(1, Math.floor(Number(s.page) || 1)),
  }),
  component: HomePage,
});
function PendingDesign() {
  return (
    <EmptyState title="Tela em implementação">
      <p>O layout desta tela aguarda a referência completa do Figma.</p>
      <a href="/">Voltar ao catálogo</a>
    </EmptyState>
  );
}
const detail = createRoute({
  getParentRoute: () => root,
  path: "/nft/$id",
  component: PendingDesign,
});
const cart = createRoute({
  getParentRoute: () => root,
  path: "/cart",
  component: PendingDesign,
});
const login = createRoute({
  getParentRoute: () => root,
  path: "/login",
  validateSearch: (s: Record<string, unknown>) => ({
    redirect:
      typeof s.redirect === "string" &&
      s.redirect.startsWith("/") &&
      !s.redirect.startsWith("//")
        ? s.redirect
        : "/",
  }),
  component: PendingDesign,
});
const profile = createRoute({
  getParentRoute: () => root,
  path: "/profile",
  component: PendingDesign,
});
const wallets = createRoute({
  getParentRoute: () => root,
  path: "/wallets",
  component: PendingDesign,
});
const favorites = createRoute({
  getParentRoute: () => root,
  path: "/favorites",
  component: PendingDesign,
});
const orders = createRoute({
  getParentRoute: () => root,
  path: "/orders",
  component: PendingDesign,
});
export const router = createRouter({
  routeTree: root.addChildren([
    home,
    detail,
    cart,
    login,
    profile,
    wallets,
    favorites,
    orders,
  ]),
  defaultPreload: "intent",
  scrollRestoration: true,
});
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
