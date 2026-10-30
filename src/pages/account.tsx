import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  UserRound,
  Wallet as WalletIcon,
  Heart,
  ShoppingCart,
  LogOut,
} from "lucide-react";
import { api, queryClient } from "../lib/api";
import { logout } from "../lib/auth";
import { formValues, useApiForm } from "../lib/forms";
import {
  useCatalog,
  useFavorites,
  useProfile,
  useSession,
  useWallets,
} from "../lib/queries";
import {
  passwordSchema,
  profileSchema,
  walletSchema,
} from "../domain/validation";
import type { Order, User, Wallet } from "../domain/types";
import { Field } from "../components/field";
import { PasswordField } from "../components/password-field";
import { Button } from "../components/ui/button";
import {
  EmptyState,
  ErrorState,
  Skeleton,
  useNotice,
} from "../components/feedback";
import { initialSearch, NftCard } from "./home";
export function AccountLayout({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="account-layout">
      <aside className="account-sidebar">
        <h2>Meu perfil</h2>
        <nav aria-label="Área do colecionador">
          {[
            { to: "/profile", text: "Dados do perfil", icon: UserRound },
            { to: "/wallets", text: "Carteiras", icon: WalletIcon },
            { to: "/favorites", text: "Lista de interesse", icon: Heart },
            { to: "/orders", text: "Meus pedidos", icon: ShoppingCart },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={path === item.to ? "selected" : ""}
            >
              <item.icon size={18} />
              {item.text}
            </Link>
          ))}
          <button onClick={logout}>
            <LogOut size={18} />
            Sair
          </button>
        </nav>
      </aside>
      <section className="account-content">{children}</section>
    </div>
  );
}
export function ProfilePage() {
  const query = useProfile();
  if (query.isPending) return <Skeleton />;
  if (query.isError)
    return <ErrorState error={query.error} retry={() => query.refetch()} />;
  return (
    <AccountLayout>
      <ProfileForm user={query.data} />
    </AccountLayout>
  );
}
function ProfileForm({ user }: { user: User }) {
  const [avatar, setAvatar] = useState(user.avatar),
    notice = useNotice();
  const form = useApiForm(
    profileSchema,
    (data) => api.put("/profile", data),
    () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["session"] });
      notice("Perfil atualizado.");
    },
  );
  const password = useApiForm(
    passwordSchema,
    (data) => api.post("/profile/password", data),
    () => {
      notice("Senha alterada.");
      (document.getElementById("password-form") as HTMLFormElement)?.reset();
    },
  );
  return (
    <>
      <h1>Perfil do colecionador</h1>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          form.mutate({ ...formValues(e.currentTarget), avatar });
        }}
      >
        <div className="form-grid">
          <Field
            name="name"
            label="Nome de exibição"
            defaultValue={user.name}
            error={form.fields.name}
          />
          <Field
            name="username"
            label="Nome de usuário"
            defaultValue={user.username || user.name.split(" ")[0]}
            error={form.fields.username}
          />
          <Field
            name="email"
            type="email"
            label="E-mail"
            defaultValue={user.email}
            error={form.fields.email}
          />
          <Field
            name="ens"
            label="Nome ENS (opcional)"
            placeholder="seunome.eth"
            defaultValue={user.ens || ""}
            error={form.fields.ens}
          />
          <Field
            name="walletLabel"
            label="Apelido da carteira"
            defaultValue={user.walletLabel || "Principal"}
            error={form.fields.walletLabel}
          />
          <div className="field">
            <label htmlFor="avatar-file">Avatar</label>
            <div className="avatar-editor">
              {avatar ? (
                <img src={avatar} alt="Seu avatar" width="50" height="50" />
              ) : (
                <UserRound size={40} />
              )}
              <input
                id="avatar-file"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (
                    file.size > 500000 ||
                    !["image/png", "image/jpeg", "image/webp"].includes(
                      file.type,
                    )
                  ) {
                    notice("Escolha PNG, JPEG ou WebP de até 500 KB.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => setAvatar(String(reader.result));
                  reader.readAsDataURL(file);
                }}
              />
              <button type="button" onClick={() => setAvatar("")}>
                Remover
              </button>
            </div>
          </div>
          <Field
            name="phone"
            type="tel"
            label="Telefone"
            defaultValue={user.phone}
            error={form.fields.phone}
          />
        </div>
        {form.message && (
          <p className="form-error" role="alert">
            {form.message}
          </p>
        )}
        <Button disabled={form.isPending}>Salvar perfil</Button>
      </form>
      <form
        id="password-form"
        className="password-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          password.mutate(formValues(e.currentTarget));
        }}
      >
        <h2>Alterar senha</h2>
        <PasswordField
          name="currentPassword"
          label="Senha atual"
          autoComplete="current-password"
          error={password.fields.currentPassword}
        />
        <PasswordField
          name="password"
          label="Nova senha"
          error={password.fields.password}
        />
        <PasswordField
          name="confirmation"
          label="Confirmar nova senha"
          error={password.fields.confirmation}
        />
        {password.message && (
          <p role="alert" className="form-error">
            {password.message}
          </p>
        )}
        <Button disabled={password.isPending}>Salvar senha</Button>
      </form>
    </>
  );
}
export function WalletsPage() {
  const wallets = useWallets(),
    [editing, setEditing] = useState<string | undefined>(),
    [creating, setCreating] = useState(false);
  if (wallets.isPending) return <Skeleton />;
  if (wallets.isError)
    return <ErrorState error={wallets.error} retry={() => wallets.refetch()} />;
  const selected =
    wallets.data.find((w) => w.id === editing) ||
    wallets.data.find((w) => w.primary) ||
    wallets.data[0];
  return (
    <AccountLayout>
      <div className="section-heading">
        <h1>Carteiras</h1>
        <Button variant="ghost" onClick={() => setCreating(true)}>
          Adicionar carteira
        </Button>
      </div>
      <p className="muted">
        Estas carteiras ficam disponíveis no pagamento e para receber NFTs
        comprados.
      </p>
      <div className="wallet-tabs">
        {wallets.data.map((w) => (
          <button
            key={w.id}
            className={selected?.id === w.id && !creating ? "selected" : ""}
            onClick={() => {
              setCreating(false);
              setEditing(w.id);
            }}
          >
            {w.label}
            {w.primary ? " · Principal" : ""}
          </button>
        ))}
      </div>
      <WalletForm
        key={creating ? "new" : selected?.id || "empty"}
        wallet={creating ? undefined : selected}
        first={!wallets.data.length}
        onSaved={() => setCreating(false)}
      />
    </AccountLayout>
  );
}
function WalletForm({
  wallet,
  first,
  onSaved,
}: {
  wallet?: Wallet;
  first: boolean;
  onSaved: () => void;
}) {
  const session = useSession(),
    notice = useNotice();
  const form = useApiForm(
    walletSchema,
    (data) =>
      wallet
        ? api.put(`/wallets/${wallet.id}`, data)
        : api.post("/wallets", data),
    () => {
      void queryClient.invalidateQueries({ queryKey: ["wallets"] });
      notice("Carteira salva.");
      onSaved();
    },
  );
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        form.mutate({
          ...formValues(e.currentTarget),
          primary: new FormData(e.currentTarget).get("primary") === "on",
        });
      }}
    >
      <div className="form-grid">
        <Field
          label="Nome de exibição"
          name="displayName"
          defaultValue={wallet?.displayName || session.data?.user?.name || ""}
          error={form.fields.displayName}
        />
        <Field
          label="Apelido da carteira"
          name="label"
          defaultValue={wallet?.label || ""}
          error={form.fields.label}
        />
        <label className="field">
          Rede
          <select name="network" defaultValue={wallet?.network || "Ethereum"}>
            {["Ethereum", "Polygon", "Solana"].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <Field
          label="Nome do perfil"
          name="profileName"
          defaultValue={
            wallet?.profileName ||
            session.data?.user?.username ||
            session.data?.user?.name ||
            ""
          }
          error={form.fields.profileName}
        />
        <Field
          label="Endereço da carteira"
          name="address"
          placeholder="Endereço 0x ou nome ENS"
          defaultValue={wallet?.address || ""}
          error={form.fields.address}
        />
        <Field
          label="Nome ENS (opcional)"
          name="ens"
          placeholder="seunome.eth"
          defaultValue={wallet?.ens || ""}
          error={form.fields.ens}
        />
        <label className="field">
          Tipo de carteira
          <select name="provider" defaultValue={wallet?.provider || "MetaMask"}>
            {["MetaMask", "WalletConnect", "Coinbase Wallet"].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <Field
          label="Código de indicação (opcional)"
          name="referral"
          defaultValue={wallet?.referral || ""}
          error={form.fields.referral}
        />
        <Field
          label="E-mail"
          type="email"
          name="email"
          defaultValue={wallet?.email || session.data?.user?.email || ""}
          error={form.fields.email}
        />
        <label className="checkbox-field">
          <input
            name="primary"
            type="checkbox"
            defaultChecked={wallet?.primary || first}
          />
          Carteira principal
        </label>
      </div>
      {form.message && (
        <p role="alert" className="form-error">
          {form.message}
        </p>
      )}
      <Button disabled={form.isPending}>Salvar carteira</Button>
    </form>
  );
}
export function FavoritesPage() {
  const query = useFavorites();
  if (query.isPending) return <Skeleton />;
  if (query.isError)
    return <ErrorState error={query.error} retry={() => query.refetch()} />;
  return (
    <AccountLayout>
      <h1>Lista de interesse</h1>
      {query.data.length ? (
        <FavoriteList ids={query.data} />
      ) : (
        <EmptyState title="Nenhum favorito ainda">
          <a href="/">Explorar NFTs</a>
        </EmptyState>
      )}
    </AccountLayout>
  );
}
function FavoriteList({ ids }: { ids: string[] }) {
  const queries = [
    useCatalog({ ...initialSearch, page: 1 }),
    useCatalog({ ...initialSearch, page: 2 }),
    useCatalog({ ...initialSearch, page: 3 }),
    useCatalog({ ...initialSearch, page: 4 }),
  ];
  if (queries.some((q) => q.isPending)) return <Skeleton cards={3} />;
  const failed = queries.find((q) => q.isError);
  if (failed)
    return <ErrorState error={failed.error} retry={() => failed.refetch()} />;
  return (
    <div className="nft-grid">
      {queries
        .flatMap((q) => q.data?.items || [])
        .filter((n) => ids.includes(n.id))
        .map((n) => (
          <NftCard key={n.id} nft={n} />
        ))}
    </div>
  );
}
export function OrdersPage() {
  const session = useSession(),
    query = useQuery({
      queryKey: ["orders", session.data?.user?.id],
      queryFn: ({ signal }) =>
        api.get<Order[]>("/orders", { signal }).then((r) => r.data),
    });
  if (query.isPending) return <Skeleton />;
  if (query.isError)
    return <ErrorState error={query.error} retry={() => query.refetch()} />;
  return (
    <AccountLayout>
      <h1>Meus pedidos</h1>
      {!query.data.length ? (
        <EmptyState title="Você ainda não tem pedidos" />
      ) : (
        <div className="order-list">
          {query.data.map((o) => (
            <Link to="/orders/$id" params={{ id: o.id }} key={o.id}>
              <span>Pedido {o.id.slice(0, 8)}</span>
              <strong>{o.quote.total} ETH</strong>
              <span>
                {
                  {
                    pending: "Pendente",
                    confirmed: "Confirmado",
                    declined: "Recusado",
                  }[o.status]
                }
              </span>
            </Link>
          ))}
        </div>
      )}
    </AccountLayout>
  );
}
