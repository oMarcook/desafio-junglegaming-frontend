import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, SlidersHorizontal } from "lucide-react";
import type { CatalogSearch, Nft } from "../domain/types";
import {
  useCatalog,
  useFavoriteMutation,
  useFavorites,
  useSession,
} from "../lib/queries";
import {
  EmptyState,
  ErrorState,
  Skeleton,
  useNotice,
} from "../components/feedback";
import { Button } from "../components/ui/button";
import { Dialog } from "../components/ui/dialog";
import { errorMessage } from "../lib/api";
export const featuredNftId = "nft-2";
export const initialSearch: CatalogSearch = {
  q: "",
  collections: "",
  networks: "",
  min: "",
  max: "",
  sort: "recent",
  page: 1,
  tab: "all",
};
const categories = [
  "Arte digital",
  "Fotografia",
  "Música",
  "Arte 3D",
  "Colecionáveis",
  "Generativa",
  "Jogos",
  "Assinaturas",
  "Utilidade",
];
const heroSlides = [
  {
    image: "/assets/8f387.webp",
    description: "Emerald Ape, personagem com jaqueta verde e óculos de sol",
  },
  {
    image: "/assets/83794.webp",
    description: "Sage Nomad, personagem com chapéu e moletom roxo",
  },
  {
    image: "/assets/9add2.webp",
    description: "Neon Vessel, personagem com paletó claro",
  },
];
export function HomePage() {
  const raw = useSearch({ strict: false }),
    search = { ...initialSearch, ...raw } as CatalogSearch;
  const navigate = useNavigate(),
    catalog = useCatalog(search),
    [filterOpen, setFilterOpen] = useState(false),
    [heroSlide, setHeroSlide] = useState(0),
    [draft, setDraft] = useState(search.q),
    notice = useNotice();
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => {
      setHeroSlide((current) => (current + 1) % heroSlides.length);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [heroSlide]);
  function change(patch: Partial<CatalogSearch>) {
    void navigate({ to: "/", search: { ...search, page: 1, ...patch } });
  }
  function toggle(field: "collections" | "networks", value: string) {
    const values = search[field].split(",").filter(Boolean);
    change({
      [field]: (values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value]
      ).join(","),
    });
  }
  const filters = (
    <>
      <h2>Coleções</h2>
      <div className="filter-options">
        {categories.map((c) => (
          <label key={c}>
            <input
              type="checkbox"
              checked={search.collections.split(",").includes(c)}
              onChange={() => toggle("collections", c)}
            />
            <span>{c}</span>
            <span>({catalog.data?.collections[c] ?? 0})</span>
          </label>
        ))}
      </div>
      <h2>Faixa de preço</h2>
      <form
        className="price-filter"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          change({
            min: String(form.get("min") || ""),
            max: String(form.get("max") || ""),
          });
        }}
      >
        <div className="price-inputs">
          <label>
            Mínimo
            <input
              key={`min-${search.min}`}
              name="min"
              type="number"
              min="0"
              step="0.01"
              defaultValue={search.min}
              placeholder="0.02"
            />
          </label>
          <label>
            Máximo
            <input
              key={`max-${search.max}`}
              name="max"
              type="number"
              min="0"
              step="0.01"
              defaultValue={search.max}
              placeholder="12.30"
            />
          </label>
        </div>
        <p>Preço em ETH</p>
        <Button>Aplicar</Button>
      </form>
      <h2>Rede</h2>
      <div className="filter-options">
        {["Ethereum", "Polygon", "Solana"].map((n) => (
          <label key={n}>
            <input
              type="checkbox"
              checked={search.networks.split(",").includes(n)}
              onChange={() => toggle("networks", n)}
            />
            <span>{n}</span>
          </label>
        ))}
      </div>
      <Button
        variant="ghost"
        onClick={() => {
          setDraft("");
          void navigate({ to: "/", search: initialSearch });
        }}
      >
        Limpar filtros
      </Button>
    </>
  );
  return (
    <>
      <div className="mobile-search">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            change({ q: draft });
          }}
        >
          <img src="/assets/ce4db.svg" alt="" />
          <input
            id="search"
            aria-label="Buscar NFTs"
            placeholder="Explorar coleções"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="sr-only">Buscar</button>
        </form>
        <button
          className="filter-trigger"
          onClick={() => setFilterOpen(true)}
          aria-label="Abrir filtros"
        >
          <SlidersHorizontal size={20} />
        </button>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Bem-vindo à Kurio</p>
          <h1>
            <span className="desktop-title">
              SEJA DONO DO FUTURO
              <br />
              DA ARTE DIGITAL
            </span>
            <span className="mobile-title">
              SEJA DONO DA
              <br />
              CULTURA DIGITAL
            </span>
          </h1>
          <p className="hero-description">
            Descubra NFTs selecionados de criadores emergentes e consagrados.
            Colecione arte digital rara, apoie artistas e tenha uma parte da
            cultura da internet.
          </p>
          <p className="mobile-description">
            Descubra NFTs selecionados de criadores do mundo todo.
          </p>
          <Button asChild>
            <a href="#catalog">EXPLORAR</a>
          </Button>
          <div
            className="hero-dots"
            role="group"
            aria-label="Selecionar NFT em destaque"
          >
            {heroSlides.map((slide, index) => (
              <button
                key={slide.image}
                type="button"
                aria-label={`Mostrar ${slide.description.split(",")[0]}`}
                aria-pressed={heroSlide === index}
                aria-controls="hero-image"
                onClick={() => setHeroSlide(index)}
              >
                <span />
              </button>
            ))}
          </div>
        </div>
        <div className="hero-art">
          <img
            id="hero-image"
            src={heroSlides[heroSlide].image}
            alt={heroSlides[heroSlide].description}
            width="450"
            height="450"
            fetchPriority="high"
          />
        </div>
      </section>
      <section className="catalog-layout" id="catalog">
        <aside className="catalog-sidebar">
          <div className="filters">{filters}</div>
          <div className="featured">
            <h2>NFT EM DESTAQUE</h2>
            <p>OFERTA LIMITADA</p>
            <Link to="/nft/$id" params={{ id: featuredNftId }}>
              <img
                src="/assets/83794.webp"
                alt="Sage Nomad em destaque"
                width="310"
                height="368"
                loading="lazy"
              />
            </Link>
          </div>
        </aside>
        <div className="catalog-content">
          <div className="catalog-toolbar">
            <div className="catalog-tabs" aria-label="Seleção de catálogo">
              {[
                ["all", "Todos os NFTs"],
                ["new", "Novos lançamentos"],
                ["trending", "Em alta"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  aria-pressed={search.tab === value}
                  onClick={() => change({ tab: value })}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="sort">
              Ordenar por:
              <select
                value={search.sort}
                onChange={(e) => change({ sort: e.target.value })}
              >
                <option value="recent">Listados recentemente</option>
                <option value="price-asc">Menor preço</option>
                <option value="price-desc">Maior preço</option>
              </select>
            </label>
          </div>
          <form
            className="desktop-search"
            onSubmit={(e) => {
              e.preventDefault();
              change({ q: draft });
            }}
          >
            <input
              aria-label="Buscar NFTs no catálogo"
              placeholder="Buscar por nome ou coleção"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button>Buscar</Button>
          </form>
          {catalog.isPending ? (
            <Skeleton cards={9} />
          ) : catalog.isError ? (
            <ErrorState error={catalog.error} retry={() => catalog.refetch()} />
          ) : !catalog.data.items.length ? (
            <EmptyState title="Nenhum NFT encontrado">
              <p>Tente outros termos ou remova os filtros.</p>
              <Button
                onClick={() => {
                  setDraft("");
                  void navigate({ to: "/", search: initialSearch });
                }}
              >
                Limpar filtros
              </Button>
            </EmptyState>
          ) : (
            <>
              <div className="nft-grid" aria-busy={catalog.isFetching}>
                {catalog.data.items.map((nft, i) => (
                  <NftCard key={nft.id} nft={nft} index={i} />
                ))}
              </div>
              <nav className="pagination" aria-label="Paginação">
                {Array.from({ length: catalog.data.pages }, (_, i) => (
                  <button
                    key={i}
                    aria-label={`Página ${i + 1}`}
                    aria-current={search.page === i + 1 ? "page" : undefined}
                    onClick={() => change({ page: i + 1 })}
                  >
                    {i + 1}
                  </button>
                ))}
              </nav>
            </>
          )}
        </div>
      </section>
      <Dialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        title="Filtrar NFTs"
      >
        <div className="filters mobile-filters">{filters}</div>
        <Button onClick={() => setFilterOpen(false)}>Ver resultados</Button>
      </Dialog>
      <section className="promos">
        {[
          [
            "8f387.webp",
            "Lançamentos gênesis de edição limitada",
            "Colecione edições escassas diretamente dos criadores antes da revelação pública.",
          ],
          [
            "9add2.webp",
            "Arte digital selecionada e muito mais",
            "Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.",
          ],
        ].map(([img, title, description]) => (
          <article key={title}>
            <img
              src={`/assets/${img}`}
              alt=""
              width="287"
              height="250"
              loading="lazy"
            />
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
              <Button asChild>
                <a href="#catalog">Explorar →</a>
              </Button>
            </div>
          </article>
        ))}
      </section>
      <section className="journal" id="journal">
        <h2>Diário da Cunhagem</h2>
        <p>
          Histórias, guias e insights para colecionadores sobre o universo da
          propriedade digital.
        </p>
        <div className="journal-grid">
          {[
            [
              "9add2.webp",
              "Como funciona a propriedade de NFTs",
              "Aprenda a colecionar, negociar e verificar ativos digitais.",
            ],
            [
              "8f387.webp",
              "10 artistas digitais para acompanhar",
              "Conheça criadores que moldam a cultura digital.",
            ],
            [
              "83794.webp",
              "Raridade, atributos e procedência",
              "Entenda raridade, procedência, direitos autorais e utilidade.",
            ],
            [
              "b7cfc.webp",
              "Como proteger sua carteira",
              "Proteja seus ativos, evite golpes e navegue com segurança.",
            ],
          ].map(([img, title, text], i) => (
            <article key={title}>
              <img
                src={`/assets/${img}`}
                alt=""
                width="268"
                height="195"
                loading="lazy"
              />
              <div>
                <p className="accent">
                  {12 + i} de setembro | Leitura de {i + 2} min
                </p>
                <h3>{title}</h3>
                <p>{text}</p>
                <button
                  onClick={() =>
                    notice(
                      "Os artigos editoriais não fazem parte desta demonstração.",
                    )
                  }
                >
                  Ler mais →
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
export function NftCard({ nft, index = 0 }: { nft: Nft; index?: number }) {
  const session = useSession(),
    favorites = useFavorites(),
    mutation = useFavoriteMutation(),
    notice = useNotice(),
    navigate = useNavigate(),
    favorite = favorites.data?.includes(nft.id) || false;
  return (
    <article className="nft-card">
      <Link to="/nft/$id" params={{ id: nft.id }} className="nft-art">
        <img
          src={nft.image}
          alt={nft.name}
          width="250"
          height="250"
          loading={index < 3 ? "eager" : "lazy"}
        />
      </Link>
      <button
        aria-label={`${favorite ? "Remover" : "Adicionar"} ${nft.name} ${favorite ? "dos" : "aos"} favoritos`}
        aria-pressed={favorite}
        disabled={mutation.isPending}
        className="favorite"
        onClick={() => {
          if (!session.data?.user) {
            void navigate({
              to: "/login",
              search: {
                redirect: window.location.pathname + window.location.search,
              },
            });
            return;
          }
          mutation.mutate(
            { nftId: nft.id, favorite: !favorite },
            { onError: (e) => notice(errorMessage(e)) },
          );
        }}
      >
        <Heart size={18} fill={favorite ? "currentColor" : "none"} />
      </button>
      <Link to="/nft/$id" params={{ id: nft.id }} className="nft-name">
        {nft.name}
      </Link>
      <p className="nft-price">{nft.price} ETH</p>
    </article>
  );
}
