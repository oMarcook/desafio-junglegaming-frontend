import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import axios from "axios";
import { z } from "zod";
import { api, errorMessage, queryClient } from "../lib/api";
import { useOrder, useQuote, useSession, useWallets } from "../lib/queries";
import { collectorSchema } from "../domain/validation";
import type { Order, Quote } from "../domain/types";
import { Button } from "../components/ui/button";
import { Dialog } from "../components/ui/dialog";
import { Field } from "../components/field";
import {
  EmptyState,
  ErrorState,
  Skeleton,
  useNotice,
} from "../components/feedback";
import { PageHeading, Totals } from "../components/market";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
type Collector = z.infer<typeof collectorSchema>;
interface Draft extends Collector {
  username: string;
  profileName: string;
  ens: string;
  referral: string;
  note: string;
  walletId: string;
  provider: string;
}
interface Attempt {
  key: string;
  body: { quoteId: string; walletId: string; collector: Collector };
}
function readStorage<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}
export const quoteSignature = (quote: Quote) =>
  JSON.stringify({
    items: quote.items.map((i) => [
      i.nftId,
      i.editionId,
      i.quantity,
      i.price,
      i.available,
      i.nftVersion,
    ]),
    total: quote.total,
    coupon: quote.coupon,
    fee: quote.fee,
  });
export function CheckoutPage() {
  const session = useSession();
  return session.data?.user ? (
    <CheckoutForm key={session.data.user.id} userId={session.data.user.id} />
  ) : null;
}
function CheckoutForm({ userId }: { userId: string }) {
  const session = useSession(),
    query = useQuote(),
    wallets = useWallets(),
    navigate = useNavigate(),
    notice = useNotice();
  const draftKey = `kurio.checkout.${userId}`,
    attemptKey = `kurio.attempt.${userId}`;
  const [draft, setDraft] = useState<Draft>(
    () =>
      readStorage<Draft>(draftKey) || {
        name: session.data?.user?.name || "",
        email: session.data?.user?.email || "",
        phone: session.data?.user?.phone || "",
        username:
          session.data?.user?.username ||
          session.data?.user?.name.split(" ")[0] ||
          "",
        profileName: session.data?.user?.name || "",
        ens: "",
        referral: "",
        note: "",
        walletId: "",
        provider: "Coinbase Wallet",
      },
  );
  const [connected, setConnected] = useState(false),
    [connectionDialog, setConnectionDialog] = useState(false),
    [review, setReview] = useState<Quote | null>(null),
    [changed, setChanged] = useState(false),
    [fields, setFields] = useState<Record<string, string>>({}),
    [message, setMessage] = useState(""),
    [attempt, setAttempt] = useState<Attempt | null>(() =>
      readStorage<Attempt>(attemptKey),
    );
  const locked = useRef(false);
  const wallet =
    wallets.data?.find((w) => w.id === draft.walletId) ||
    wallets.data?.find((w) => w.primary) ||
    wallets.data?.[0];
  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [draft, draftKey]);
  function update<K extends keyof Draft>(field: K, value: Draft[K]) {
    setDraft((old) => ({ ...old, [field]: value }));
    setReview(null);
    if (field === "walletId" || field === "provider") setConnected(false);
  }
  const connection = useMutation({
    mutationFn: (action: string) =>
      api
        .post<{ connected: boolean }>("/wallet-connection", {
          action,
          walletId: wallet?.id,
          provider: draft.provider,
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      setConnected(data.connected);
      setConnectionDialog(false);
      notice(
        data.connected
          ? "Carteira conectada na simulação."
          : "Carteira desconectada.",
      );
    },
  });
  function validate() {
    const result = collectorSchema.safeParse(draft);
    const extra: Record<string, string> = {};
    if (draft.username.trim().length < 2)
      extra.username = "Informe seu nome de usuário";
    if (draft.profileName.trim().length < 2)
      extra.profileName = "Informe o nome do perfil";
    if (draft.ens && !/^[a-z0-9-]+\.eth$/.test(draft.ens))
      extra.ens = "Use um nome terminado em .eth";
    if (!result.success)
      Object.assign(
        extra,
        Object.fromEntries(
          result.error.issues.map((i) => [i.path.join("."), i.message]),
        ),
      );
    setFields(extra);
    return Object.keys(extra).length
      ? null
      : result.success
        ? result.data
        : null;
  }
  const prepare = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error("Verifique os campos indicados.");
      if (!wallet) throw new Error("Cadastre uma carteira antes de continuar.");
      if (!connected) throw new Error("Conecte sua carteira antes de revisar.");
      const response = await api.get<Quote>("/quote", {
        headers: { "X-Require-Session": "true" },
      });
      if (!response.data.valid)
        throw new Error(
          response.data.issues.join(". ") || "Seu carrinho está vazio.",
        );
      return response.data;
    },
    onSuccess: (quote) => {
      setReview(quote);
      setChanged(false);
      setMessage("");
    },
  });
  const purchase = useMutation({
    mutationFn: async (saved: Attempt) =>
      api
        .post<Order>("/orders", saved.body, {
          headers: { "Idempotency-Key": saved.key },
        })
        .then((r) => r.data),
    onSuccess: (order) => {
      localStorage.removeItem(attemptKey);
      setAttempt(null);
      void navigate({ to: "/orders/$id", params: { id: order.id } });
    },
    onError: (error) => {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.status >= 400 &&
        error.response.status < 500 &&
        error.response.status !== 401
      ) {
        localStorage.removeItem(attemptKey);
        setAttempt(null);
        setReview(null);
        void queryClient.invalidateQueries({ queryKey: ["quote"] });
      }
      setMessage(errorMessage(error));
    },
    onSettled: () => {
      locked.current = false;
    },
  });
  async function confirm() {
    if (locked.current || purchase.isPending || !review) return;
    locked.current = true;
    try {
      const latest = (
        await api.get<Quote>("/quote", {
          headers: { "X-Require-Session": "true" },
        })
      ).data;
      if (!latest.valid) {
        setReview(null);
        setMessage(latest.issues.join(". "));
        locked.current = false;
        void queryClient.invalidateQueries({ queryKey: ["quote"] });
        return;
      }
      if (quoteSignature(latest) !== quoteSignature(review)) {
        setReview(latest);
        setChanged(true);
        locked.current = false;
        return;
      }
      if (!connected || !wallet)
        throw new Error("Reconecte a carteira antes de confirmar.");
      const collector = validate();
      if (!collector) {
        locked.current = false;
        return;
      }
      const next: Attempt = {
        key: crypto.randomUUID(),
        body: { quoteId: latest.id, walletId: wallet.id, collector },
      };
      localStorage.setItem(attemptKey, JSON.stringify(next));
      setAttempt(next);
      purchase.mutate(next);
    } catch (error) {
      locked.current = false;
      setMessage(errorMessage(error));
    }
  }
  if (query.isPending || wallets.isPending) return <Skeleton />;
  if (query.isError)
    return <ErrorState error={query.error} retry={() => query.refetch()} />;
  if (wallets.isError)
    return <ErrorState error={wallets.error} retry={() => wallets.refetch()} />;
  // A saved attempt takes priority over an empty cart after a lost response and settlement.
  if (attempt)
    return (
      <div className="recovery-panel">
        <PageHeading title="Recuperar pedido" back="/cart" />
        <h1>
          {purchase.isPending
            ? "Consultando sua tentativa…"
            : "Sua tentativa de compra foi preservada"}
        </h1>
        <p>
          Se a resposta se perdeu, recupere o pedido com a mesma identificação.
          Nenhuma compra adicional será criada.
        </p>
        {message && <p role="alert">{message}</p>}
        <Button
          disabled={purchase.isPending}
          onClick={() => {
            if (!locked.current) {
              locked.current = true;
              purchase.mutate(attempt);
            }
          }}
        >
          Recuperar pedido
        </Button>
        <Link to="/orders">Ver meus pedidos</Link>
      </div>
    );
  if (!query.data.items.length)
    return (
      <EmptyState title="Seu carrinho está vazio">
        <a href="/">Explorar NFTs</a>
      </EmptyState>
    );
  return (
    <>
      <PageHeading title="Pagamento com carteira" back="/cart" />
      <div className="checkout-layout">
        <section>
          <h1>Perfil do colecionador</h1>
          <div className="form-grid checkout-collector">
            <Field
              label="Nome de exibição"
              value={draft.name}
              onChange={(e) => update("name", e.target.value)}
              error={fields.name}
            />
            <Field
              label="Nome de usuário"
              value={draft.username}
              onChange={(e) => update("username", e.target.value)}
              error={fields.username}
            />
            <label className="field">
              Rede
              <select
                aria-label="Rede do pagamento"
                value={wallet?.network || ""}
                onChange={(e) => {
                  const next = wallets.data.find(
                    (w) => w.network === e.target.value,
                  );
                  if (next) update("walletId", next.id);
                }}
              >
                {[...new Set(wallets.data.map((w) => w.network))].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <Field
              label="Nome do perfil"
              value={draft.profileName}
              onChange={(e) => update("profileName", e.target.value)}
              error={fields.profileName}
            />
            <Field
              label="Endereço da carteira"
              value={wallet?.address || ""}
              readOnly
            />
            <Field
              label="Código de indicação (opcional)"
              value={draft.referral}
              onChange={(e) => update("referral", e.target.value)}
            />
            <Field
              label="E-mail"
              type="email"
              value={draft.email}
              onChange={(e) => update("email", e.target.value)}
              error={fields.email}
            />
            <Field
              label="Nome ENS (opcional)"
              value={draft.ens}
              onChange={(e) => update("ens", e.target.value)}
              error={fields.ens}
            />
            <Field
              label="Telefone"
              type="tel"
              value={draft.phone}
              onChange={(e) => update("phone", e.target.value)}
              error={fields.phone}
            />
            <label className="field">
              Observação do colecionador (opcional)
              <textarea
                value={draft.note}
                onChange={(e) => update("note", e.target.value)}
                maxLength={500}
              />
            </label>
          </div>
          <div className="section-heading">
            <h2>
              {connected ? "Carteira conectada" : "Selecione uma carteira"}
            </h2>
            <Link to="/wallets" className="accent">
              Gerenciar carteiras
            </Link>
          </div>
          {!wallets.data.length ? (
            <EmptyState title="Cadastre sua primeira carteira">
              <Link to="/wallets">Adicionar carteira</Link>
            </EmptyState>
          ) : (
            <fieldset className="wallet-choices">
              <legend className="sr-only">Carteiras cadastradas</legend>
              {wallets.data.map((w) => (
                <label
                  key={w.id}
                  className={wallet?.id === w.id ? "selected" : ""}
                >
                  <input
                    type="radio"
                    name="wallet"
                    checked={wallet?.id === w.id}
                    onChange={() => update("walletId", w.id)}
                  />
                  <span>
                    <strong>{w.label}</strong>
                    <small>{w.address}</small>
                    <small>Rede {w.network}</small>
                  </span>
                </label>
              ))}
            </fieldset>
          )}
        </section>
        <aside className="checkout-summary">
          <h2>Seus NFTs</h2>
          <div className="checkout-items">
            {query.data.items.map((i) => (
              <div key={`${i.nftId}-${i.editionId}`}>
                <img src={i.image} alt={i.name} width="70" height="70" />
                <span>
                  <strong>{i.name}</strong>
                  <small>
                    Edição: {i.edition} (× {i.quantity})
                  </small>
                </span>
                <strong>{i.total} ETH</strong>
              </div>
            ))}
          </div>
          <Totals quote={query.data} />
          <h2>Carteira e rede</h2>
          <fieldset className="provider-options">
            <legend className="sr-only">Tipo de carteira</legend>
            {["WalletConnect", "MetaMask", "Coinbase Wallet"].map(
              (provider) => (
                <label key={provider}>
                  <input
                    type="radio"
                    name="provider"
                    checked={draft.provider === provider}
                    onChange={() => update("provider", provider)}
                  />
                  <span>{provider}</span>
                </label>
              ),
            )}
          </fieldset>
          <div className="connection-actions">
            <Button
              variant="outline"
              disabled={!wallet || connection.isPending}
              onClick={() =>
                connected
                  ? connection.mutate("disconnect")
                  : setConnectionDialog(true)
              }
            >
              {connected ? "Desconectar carteira" : "Conectar carteira"}
            </Button>
            <span role="status">
              {connected ? "Conectada · simulação" : "Desconectada"}
            </span>
          </div>
          {(prepare.isError || message) && (
            <p role="alert" className="form-error">
              {message || errorMessage(prepare.error)}
            </p>
          )}
          <Button
            className="checkout-submit"
            disabled={prepare.isPending || !query.data.valid}
            onClick={() => prepare.mutate()}
          >
            Revisar compra
          </Button>
        </aside>
      </div>
      <Dialog
        open={connectionDialog}
        onOpenChange={setConnectionDialog}
        title={`Conectar ${draft.provider}`}
      >
        <p>
          Conexão simulada à carteira {wallet?.label} na rede {wallet?.network}.
        </p>
        {connection.isError && (
          <p role="alert" className="form-error">
            {errorMessage(connection.error)}
          </p>
        )}
        <div className="dialog-actions">
          <Button
            disabled={connection.isPending}
            onClick={() => connection.mutate("connect")}
          >
            Conectar
          </Button>
          <Button
            variant="outline"
            disabled={connection.isPending}
            onClick={() => connection.mutate("reject")}
          >
            Recusar conexão
          </Button>
        </div>
      </Dialog>
      <Dialog
        open={!!review}
        onOpenChange={(open) => {
          if (!purchase.isPending && !open) setReview(null);
        }}
        title="Revise sua compra"
      >
        {review && (
          <>
            {changed && (
              <p role="alert" className="change-warning">
                Preço ou disponibilidade alterados. Confira os novos valores e
                confirme novamente.
              </p>
            )}
            <p>
              {review.items.reduce((s, i) => s + i.quantity, 0)} NFT(s) ·{" "}
              {wallet?.label} · {wallet?.network}
            </p>
            <Totals quote={review} />
            <p className="muted">Transação simulada. Nenhuma cobrança real.</p>
            <div className="dialog-actions">
              <Button onClick={confirm} disabled={purchase.isPending}>
                {purchase.isPending ? "Enviando…" : "Confirmar compra"}
              </Button>
              <Button
                variant="outline"
                disabled={purchase.isPending}
                onClick={() => setReview(null)}
              >
                Voltar à revisão
              </Button>
            </div>
          </>
        )}
      </Dialog>
    </>
  );
}
export function OrderPage({ id }: { id: string }) {
  const query = useOrder(id),
    notice = useNotice();
  if (query.isPending) return <Skeleton />;
  if (query.isError)
    return <ErrorState error={query.error} retry={() => query.refetch()} />;
  const order = query.data;
  return (
    <section className={`receipt ${order.status}`}>
      <a
        href="/orders"
        className="receipt-close"
        aria-label="Voltar aos pedidos"
      >
        ×
      </a>
      <header>
        {order.status === "confirmed" ? (
          <CheckCircle2 size={64} />
        ) : order.status === "declined" ? (
          <XCircle size={64} />
        ) : (
          <Clock3 size={64} />
        )}
        <h1>
          {order.status === "confirmed"
            ? "Seus NFTs agora estão na sua carteira"
            : order.status === "declined"
              ? "Pagamento recusado"
              : "Seu pedido está pendente"}
        </h1>
        <p role="status">
          {order.status === "confirmed"
            ? "Compra confirmada na simulação."
            : order.status === "declined"
              ? "Seus itens foram preservados no carrinho."
              : "Aguardando a resposta da simulação. Você pode recarregar esta página."}
        </p>
      </header>
      <dl className="receipt-meta">
        <div>
          <dt>ID da transação</dt>
          <dd title={order.transaction}>{order.transaction.slice(0, 22)}…</dd>
        </div>
        <div>
          <dt>Data</dt>
          <dd>{new Date(order.createdAt).toLocaleDateString("pt-BR")}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{order.quote.total} ETH</dd>
        </div>
        <div>
          <dt>Carteira</dt>
          <dd>{order.wallet.label}</dd>
        </div>
      </dl>
      <div className="receipt-body">
        <h2>Detalhes da transação</h2>
        {order.quote.items.map((i) => (
          <article key={`${i.nftId}-${i.editionId}`}>
            <img src={i.image} alt={i.name} width="70" height="70" />
            <div>
              <strong>{i.name}</strong>
              <p>
                Edição {i.edition} (× {i.quantity})
              </p>
            </div>
            <strong>{i.total} ETH</strong>
          </article>
        ))}
        <Totals quote={order.quote} />
        <p className="muted">Pedido {order.id}</p>
        {order.status === "confirmed" ? (
          <>
            <p>
              Transação simulada em {order.wallet.network}. Este recibo preserva
              os valores confirmados no pedido.
            </p>
            <Button
              onClick={() =>
                notice(
                  `Explorador simulado: ${order.transaction}. Esta transação não existe em uma blockchain real.`,
                )
              }
            >
              Ver transação simulada
            </Button>
          </>
        ) : order.status === "declined" ? (
          <Button asChild>
            <Link to="/cart">Voltar ao carrinho</Link>
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
          >
            Consultar estado
          </Button>
        )}
      </div>
    </section>
  );
}
