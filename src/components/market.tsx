import { Link } from "@tanstack/react-router";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { initialSearch, NftCard } from "../pages/home";
import { useCatalog } from "../lib/queries";
import type { Quote } from "../domain/types";
export function PageHeading({
  title,
  back = "/",
}: {
  title: string;
  back?: string;
}) {
  return (
    <>
      <div className="breadcrumb">
        <a href="/">Início</a> / <a href="/#catalog">Mercado</a> / {title}
      </div>
      <div className="mobile-page-heading">
        <a href={back} aria-label="Voltar">
          <ArrowLeft size={20} />
        </a>
        <h1>{title}</h1>
      </div>
    </>
  );
}
export function Quantity({
  value,
  max,
  onChange,
  disabled = false,
  label = "Quantidade",
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className="quantity" role="group" aria-label={label}>
      <button
        type="button"
        disabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
        aria-label={`Diminuir ${label}`}
      >
        <Minus size={16} />
      </button>
      <output aria-label={label}>{value}</output>
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
        aria-label={`Aumentar ${label}`}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
export function Totals({ quote }: { quote: Quote }) {
  return (
    <dl className="totals">
      <div>
        <dt>Subtotal</dt>
        <dd>{quote.subtotal} ETH</dd>
      </div>
      <div>
        <dt>Desconto do lançamento</dt>
        <dd>− {quote.discount} ETH</dd>
      </div>
      <div>
        <dt>Taxa de rede</dt>
        <dd>{quote.fee} ETH</dd>
      </div>
      <p className="fee-note">Taxa simulada</p>
      <div className="grand-total">
        <dt>Total</dt>
        <dd>{quote.total} ETH</dd>
      </div>
    </dl>
  );
}
export function Recommendations({
  title = "Mais desta coleção",
  exclude,
}: {
  title?: string;
  exclude?: string;
}) {
  const query = useCatalog(initialSearch);
  return query.data ? (
    <section className="recommendations">
      <h2>{title}</h2>
      <div className="recommendation-grid">
        {query.data.items
          .filter((n) => n.id !== exclude)
          .slice(3, 8)
          .map((n, i) => (
            <NftCard key={n.id} nft={n} index={i} />
          ))}
      </div>
      <Link to="/" search={initialSearch} className="accent">
        Explorar todas as coleções →
      </Link>
    </section>
  ) : null;
}
