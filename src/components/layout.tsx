import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Heart,
  Home,
  Search,
  ShoppingCart,
  UserRound,
  ScanLine,
  LogOut,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api, clearPrivateData, queryClient } from "../lib/api";
import { useCart, useSession } from "../lib/queries";
import { connectRealtime } from "../lib/realtime";
import { useNotice } from "./feedback";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";

export function Layout() {
  const session = useSession(),
    cart = useCart(),
    notice = useNotice(),
    [online, setOnline] = useState(false),
    [demo, setDemo] = useState(false);
  const connection = useRef<ReturnType<typeof connectRealtime> | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const authPage = pathname === "/login" || pathname === "/register";
  const receiptPage = pathname.startsWith("/orders/");
  const accountPage = [
    "/profile",
    "/wallets",
    "/favorites",
    "/orders",
  ].includes(pathname);
  const marketPage =
    pathname.startsWith("/nft/") ||
    pathname === "/cart" ||
    pathname === "/checkout";
  useEffect(() => {
    if (!session.data?.expiresAt) return;
    const timer = setTimeout(
      () => {
        void queryClient.invalidateQueries({ queryKey: ["session"] });
      },
      Math.max(0, session.data.expiresAt - Date.now()) + 20,
    );
    return () => clearTimeout(timer);
  }, [session.data?.expiresAt]);
  useEffect(() => {
    if (!session.isSuccess) return;
    connection.current = connectRealtime(
      queryClient,
      session.data.user?.id,
      notice,
      setOnline,
    );
    return () => connection.current?.dispose();
  }, [session.isSuccess, session.data?.user?.id, notice]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  async function logout() {
    connection.current?.dispose();
    await api.post("/session/logout");
    clearPrivateData();
    await queryClient.invalidateQueries({ queryKey: ["session"] });
    window.location.assign("/");
  }
  const total = cart.data?.items.reduce((sum, i) => sum + i.quantity, 0) || 0;
  return (
    <>
      <a className="skip-link" href="#main">
        Pular para conteúdo
      </a>
      <div
        className={`page-wrap ${authPage ? "auth-page" : ""} ${accountPage ? "account-page" : ""} ${marketPage ? "market-page" : ""} ${receiptPage ? "receipt-page" : ""}`}
      >
        {!receiptPage && (
          <header className="desktop-header">
            <Link
              to="/"
              search={{
                q: "",
                collections: "",
                networks: "",
                min: "",
                max: "",
                sort: "recent",
                page: 1,
                tab: "all",
              }}
              className="wordmark"
              aria-label="Kurio início"
            >
              KURIO
            </Link>
            <nav aria-label="Navegação principal">
              <Link
                to="/"
                search={{
                  q: "",
                  collections: "",
                  networks: "",
                  min: "",
                  max: "",
                  sort: "recent",
                  page: 1,
                  tab: "all",
                }}
                className={pathname === "/" ? "active" : ""}
              >
                Início
              </Link>
              <a href="/#catalog" className={marketPage ? "active" : ""}>
                Mercado
              </a>
              <button
                onClick={() =>
                  notice(
                    "O diretório de criadores não faz parte desta demonstração.",
                  )
                }
              >
                Criadores
              </button>
              <a href="/#journal">Aprenda</a>
            </nav>
            <div className="header-actions">
              <a href="/#search" aria-label="Buscar NFTs">
                <img src="/assets/bd8c9.svg" alt="" />
              </a>
              <Link
                to="/cart"
                className="cart-link"
                aria-label={`Carrinho, ${total} itens`}
              >
                <img src="/assets/c0c08.svg" alt="" />
                <span>{total}</span>
              </Link>
              {session.data?.user ? (
                <>
                  <Link to="/profile" aria-label="Meu perfil">
                    <UserRound size={20} />
                  </Link>
                  <button onClick={logout} aria-label="Sair">
                    <LogOut size={18} />
                  </button>
                </>
              ) : (
                <Button asChild>
                  <Link to="/login" search={{ redirect: "/" }}>
                    <img src="/assets/62554.svg" alt="" />
                    Entrar
                  </Link>
                </Button>
              )}
            </div>
          </header>
        )}
        <main id="main" tabIndex={-1}>
          <Outlet />
        </main>
        {!authPage && !accountPage && !receiptPage && <Footer />}
      </div>
      {!authPage && !marketPage && !receiptPage && (
        <nav className="mobile-nav" aria-label="Navegação mobile">
          <Link
            to="/"
            search={{
              q: "",
              collections: "",
              networks: "",
              min: "",
              max: "",
              sort: "recent",
              page: 1,
              tab: "all",
            }}
            aria-label="Início"
            className={pathname === "/" ? "active" : undefined}
            activeOptions={{ exact: true, includeSearch: false }}
          >
            <Home />
          </Link>
          <Link
            to="/favorites"
            aria-label="Favoritos"
            className={pathname === "/favorites" ? "active" : undefined}
          >
            <Heart />
          </Link>
          <button
            className="scan"
            aria-label="Sobre a demonstração"
            onClick={() =>
              notice(
                "Kurio é uma demonstração. Carteiras e transações são simuladas.",
              )
            }
          >
            <ScanLine />
          </button>
          <Link
            to="/cart"
            aria-label={`Carrinho, ${total} itens`}
            className={pathname === "/cart" ? "active" : undefined}
          >
            <ShoppingCart />
          </Link>
          <Link
            to="/profile"
            aria-label="Perfil"
            className={
              ["/profile", "/wallets", "/orders"].includes(pathname)
                ? "active"
                : undefined
            }
            aria-current={
              ["/profile", "/wallets", "/orders"].includes(pathname)
                ? "page"
                : undefined
            }
          >
            <UserRound />
          </Link>
        </nav>
      )}
      {import.meta.env.VITE_ENABLE_MOCKS !== "false" && (
        <>
          <button className="demo-toggle" onClick={() => setDemo(true)}>
            Demonstração · {online ? "conectado" : "reconectando"}
          </button>
          <Dialog
            open={demo}
            onOpenChange={setDemo}
            title="Cenários de demonstração"
          >
            <p className="muted mb-4">
              As ações abaixo alteram a API simulada e os eventos Socket.IO.
            </p>
            <label className="field">
              Cenário
              <select
                defaultValue="default"
                onChange={async (e) => {
                  await api.post("/simulation/scenario", {
                    scenario: e.target.value,
                  });
                  await queryClient.invalidateQueries();
                }}
              >
                {[
                  "default",
                  "empty",
                  "slow",
                  "variable-latency",
                  "offline",
                  "server-error",
                  "expired-session",
                  "validation-error",
                  "favorite-error",
                  "payment-declined",
                  "order-timeout",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-3 mt-4">
              <Button
                onClick={() => api.post("/simulation/nft", { id: "nft-1" })}
              >
                Alterar preço do Emerald
              </Button>
              <Button
                onClick={() =>
                  api.post("/simulation/nft", { id: "nft-1", soldOut: true })
                }
              >
                Esgotar Emerald
              </Button>
              <Button
                onClick={() =>
                  api.post("/simulation/nft", { id: "nft-1", duplicate: true })
                }
              >
                Evento duplicado e antigo
              </Button>
              <Button onClick={() => connection.current?.disconnect()}>
                Desconectar tempo real
              </Button>
              <Button onClick={() => connection.current?.reconnect()}>
                Reconectar
              </Button>
              <Button
                onClick={async () => {
                  await api.post("/simulation/expire");
                  await queryClient.invalidateQueries({
                    queryKey: ["session"],
                  });
                }}
              >
                Expirar sessão
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await api.post("/simulation/reset");
                  sessionStorage.clear();
                  window.location.assign("/");
                }}
              >
                Restaurar demonstração
              </Button>
            </div>
          </Dialog>
        </>
      )}
    </>
  );
}
function Footer() {
  const notice = useNotice();
  return (
    <footer className="site-footer">
      <section className="footer-features">
        {[
          [
            "W",
            "Segurança da carteira",
            "Proteja sua carteira e colecione arte digital verificada com confiança.",
          ],
          [
            "C",
            "Criadores em destaque",
            "Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.",
          ],
          [
            "D",
            "Alertas de lançamentos",
            "Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.",
          ],
        ].map(([mark, title, text]) => (
          <article key={mark}>
            <span className="medallion">{mark}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
        <article>
          <h3>Antecipe-se ao próximo lançamento</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              notice("A newsletter não está disponível nesta demonstração.");
            }}
          >
            <label className="sr-only" htmlFor="newsletter">
              E-mail da newsletter
            </label>
            <div className="newsletter">
              <input
                id="newsletter"
                type="email"
                placeholder="digite seu e-mail..."
                required
              />
              <Button>Enviar</Button>
            </div>
          </form>
          <p>
            Receba lançamentos selecionados, histórias de criadores e novidades
            do mercado.
          </p>
        </article>
      </section>
      <div className="brand-band">
        <strong className="wordmark">KURIO</strong>
        <p>
          Feito para colecionadores,
          <br />
          criadores e cultura
        </p>
        <span>contato@email.com</span>
        <span>+55 11 4002 8922</span>
      </div>
      <section className="footer-links">
        <div>
          <h3>Meu perfil</h3>
          <Link to="/profile">Meu perfil</Link>
          <Link to="/wallets">Minhas carteiras</Link>
          <Link to="/favorites">Lista de interesse</Link>
          <Link to="/orders">Meus pedidos</Link>
        </div>
        <div>
          <h3>Central de ajuda</h3>
          {[
            "Central de ajuda",
            "Como comprar NFTs",
            "Carteira e segurança",
            "Política do mercado",
            "Denunciar item",
          ].map((t) => (
            <button
              key={t}
              onClick={() =>
                notice("Conteúdo de suporte fora do escopo desta demonstração.")
              }
            >
              {t}
            </button>
          ))}
        </div>
        <div>
          <h3>Coleções</h3>
          {["Arte digital", "Fotografia", "Música", "Arte 3D", "Utilidade"].map(
            (t) => (
              <a
                key={t}
                href={`/?collections=${encodeURIComponent(t)}#catalog`}
              >
                {t}
              </a>
            ),
          )}
        </div>
        <div>
          <h3>Redes sociais</h3>
          <div className="social-icons">
            {[
              "99280.svg",
              "d48dd.svg",
              "b4111.svg",
              "b8b84.svg",
              "ca2da.svg",
            ].map((s, i) => (
              <button
                key={s}
                aria-label={
                  ["Facebook", "Instagram", "X", "LinkedIn", "YouTube"][i]
                }
                onClick={() =>
                  notice("Perfil social não disponível nesta demonstração.")
                }
              >
                <img src={`/assets/${s}`} alt="" />
              </button>
            ))}
          </div>
          <h3>Carteiras compatíveis</h3>
          <p className="wallet-brands">METAMASK · WALLETCONNECT · COINBASE</p>
        </div>
      </section>
      <p className="copyright">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  );
}
export function SearchIcon() {
  return <Search size={20} />;
}
