import {
  createRootRoute,
  createRoute,
  createRouter,
  useParams,
} from "@tanstack/react-router";
import { Layout } from "./components/layout";
import { EmptyState } from "./components/feedback";
import { HomePage, initialSearch } from "./pages/home";
import type { CatalogSearch } from "./domain/types";
import { DetailPage } from "./pages/detail";
import { CartPage } from "./pages/cart";
import { AuthPage } from "./pages/auth";
import {
  FavoritesPage,
  OrdersPage,
  ProfilePage,
  WalletsPage,
} from "./pages/account";
import { CheckoutPage, OrderPage } from "./pages/checkout";
import { Protected, requireSession, safeReturn } from "./lib/auth";
import { ErrorState } from "./components/feedback";
const root = createRootRoute({
  component: Layout,
  errorComponent: ({ error, reset }) => (
    <ErrorState error={error} retry={reset} />
  ),
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
const detail = createRoute({
  getParentRoute: () => root,
  path: "/nft/$id",
  component: DetailPage,
});
const cart = createRoute({
  getParentRoute: () => root,
  path: "/cart",
  component: CartPage,
});
const login = createRoute({
  getParentRoute: () => root,
  path: "/login",
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: safeReturn(s.redirect),
  }),
  component: () => <AuthPage />,
});
const register = createRoute({
  getParentRoute: () => root,
  path: "/register",
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: safeReturn(s.redirect),
  }),
  component: () => <AuthPage register />,
});
const checkout = createRoute({
  getParentRoute: () => root,
  path: "/checkout",
  beforeLoad: ({ location }) => requireSession(location),
  component: () => (
    <Protected>
      <CheckoutPage />
    </Protected>
  ),
});
const profile = createRoute({
  getParentRoute: () => root,
  path: "/profile",
  beforeLoad: ({ location }) => requireSession(location),
  component: () => (
    <Protected>
      <ProfilePage />
    </Protected>
  ),
});
const wallets = createRoute({
  getParentRoute: () => root,
  path: "/wallets",
  beforeLoad: ({ location }) => requireSession(location),
  component: () => (
    <Protected>
      <WalletsPage />
    </Protected>
  ),
});
const favorites = createRoute({
  getParentRoute: () => root,
  path: "/favorites",
  beforeLoad: ({ location }) => requireSession(location),
  component: () => (
    <Protected>
      <FavoritesPage />
    </Protected>
  ),
});
const orders = createRoute({
  getParentRoute: () => root,
  path: "/orders",
  beforeLoad: ({ location }) => requireSession(location),
  component: () => (
    <Protected>
      <OrdersPage />
    </Protected>
  ),
});
function OrderRoute() {
  const { id } = useParams({ strict: false });
  return (
    <Protected>
      <OrderPage id={id || ""} />
    </Protected>
  );
}
const order = createRoute({
  getParentRoute: () => root,
  path: "/orders/$id",
  beforeLoad: ({ location }) => requireSession(location),
  component: OrderRoute,
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
    order,
    register,
    checkout,
  ]),
  defaultPreload: "intent",
  scrollRestoration: true,
});
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
