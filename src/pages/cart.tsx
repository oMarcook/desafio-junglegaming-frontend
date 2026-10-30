import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage, queryClient } from "../lib/api";
import { useCartMutation, useQuote } from "../lib/queries";
import {
  EmptyState,
  ErrorState,
  Skeleton,
  useNotice,
} from "../components/feedback";
import {
  PageHeading,
  Quantity,
  Recommendations,
  Totals,
} from "../components/market";
import { Button } from "../components/ui/button";
import type { Quote } from "../domain/types";
export function Coupon({ quote }: { quote: Quote }) {
  const [code, setCode] = useState(quote.coupon),
    mutation = useMutation({
      mutationFn: (coupon: string) =>
        api.post<Quote>("/quote", { coupon }).then((r) => r.data),
      onSuccess: () =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: ["quote"] }),
          queryClient.invalidateQueries({ queryKey: ["cart"] }),
        ]),
    });
  return (
    <form
      className="coupon"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate(code);
      }}
    >
      <label htmlFor="coupon-code">Código promocional</label>
      <div>
        <input
          id="coupon-code"
          placeholder="Digite o código promocional..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          aria-describedby={mutation.isError ? "coupon-error" : undefined}
        />
        <Button disabled={mutation.isPending}>Aplicar</Button>
      </div>
      {quote.coupon && (
        <button
          type="button"
          className="accent"
          onClick={() => {
            setCode("");
            mutation.mutate("");
          }}
        >
          Remover {quote.coupon}
        </button>
      )}
      {mutation.isError && (
        <p role="alert" id="coupon-error">
          {errorMessage(mutation.error)}
        </p>
      )}
    </form>
  );
}
export function CartPage() {
  const query = useQuote(),
    mutation = useCartMutation(),
    notice = useNotice();
  if (query.isPending) return <Skeleton />;
  if (query.isError)
    return <ErrorState error={query.error} retry={() => query.refetch()} />;
  const quote = query.data;
  return (
    <>
      <PageHeading title="Carrinho de NFTs" />
      {!quote.items.length ? (
        <EmptyState title="Seu carrinho está vazio">
          <p>Explore as coleções e encontre sua próxima arte digital.</p>
          <Button asChild>
            <a href="/">Explorar NFTs</a>
          </Button>
        </EmptyState>
      ) : (
        <div className="cart-layout">
          <section className="cart-items" aria-label="Itens do carrinho">
            <div className="cart-table-heading">
              <span>NFTs</span>
              <span>Preço</span>
              <span>Edições</span>
              <span>Total</span>
              <span />
            </div>
            {quote.items.map((item) => (
              <article
                className="cart-row"
                key={`${item.nftId}-${item.editionId}`}
              >
                <Link
                  to="/nft/$id"
                  params={{ id: item.nftId }}
                  className="cart-product"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    width="70"
                    height="70"
                  />
                  <div>
                    <h2>{item.name}</h2>
                    <p>Edição: {item.edition}</p>
                    <strong className="mobile-line-total">
                      {item.total} ETH
                    </strong>
                  </div>
                </Link>
                <span className="unit-price">{item.price} ETH</span>
                <Quantity
                  label={`Quantidade de ${item.name}`}
                  value={item.quantity}
                  max={item.available}
                  disabled={mutation.isPending}
                  onChange={(quantity) =>
                    mutation.mutate(
                      { ...item, quantity },
                      { onError: (e) => notice(errorMessage(e)) },
                    )
                  }
                />
                <strong className="line-total">{item.total} ETH</strong>
                <button
                  className="remove-item"
                  aria-label={`Remover ${item.name}`}
                  disabled={mutation.isPending}
                  onClick={() =>
                    mutation.mutate(
                      { ...item, quantity: 0 },
                      { onError: (e) => notice(errorMessage(e)) },
                    )
                  }
                >
                  <Trash2 size={20} />
                </button>
                {item.available < item.quantity && (
                  <p className="stock-warning" role="alert">
                    Disponibilidade alterada: {item.available} unidades. Ajuste
                    a quantidade ou remova o item.
                  </p>
                )}
              </article>
            ))}
          </section>
          <aside className="cart-summary">
            <h1>Resumo da carteira</h1>
            <Coupon quote={quote} />
            <Totals quote={quote} />
            {quote.issues.map((issue) => (
              <p key={issue} role="alert" className="field-error">
                {issue}
              </p>
            ))}
            <Button asChild={!!quote.valid} disabled={!quote.valid}>
              {quote.valid ? (
                <Link to="/checkout">Conectar e finalizar</Link>
              ) : (
                <span>Revise os itens indisponíveis</span>
              )}
            </Button>
            <a href="/#catalog" className="continue-shopping">
              Continuar explorando
            </a>
          </aside>
        </div>
      )}
      <Recommendations title="Colecionadores também viram" />
    </>
  );
}
