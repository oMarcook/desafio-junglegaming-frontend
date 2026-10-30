import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Heart, Search, Share2, ShoppingCart } from "lucide-react";
import {
  useCartMutation,
  useFavoriteMutation,
  useFavorites,
  useNft,
  useSession,
} from "../lib/queries";
import { ErrorState, useNotice } from "../components/feedback";
import { PageHeading, Quantity, Recommendations } from "../components/market";
import { Button } from "../components/ui/button";
import { Dialog } from "../components/ui/dialog";
import { errorMessage } from "../lib/api";
export function DetailPage() {
  const { id } = useParams({ strict: false }),
    query = useNft(id || ""),
    cart = useCartMutation(),
    favoriteMutation = useFavoriteMutation(),
    favorites = useFavorites(),
    session = useSession(),
    navigate = useNavigate(),
    notice = useNotice();
  const [editionId, setEdition] = useState("standard"),
    [quantity, setQuantity] = useState(1),
    [zoom, setZoom] = useState(false),
    [tab, setTab] = useState("details"),
    [selectedImage, setSelectedImage] = useState(0);
  if (query.isPending) return <DetailSkeleton />;
  if (query.isError)
    return <ErrorState error={query.error} retry={() => query.refetch()} />;
  const nft = query.data,
    edition = nft.editions.find((e) => e.id === editionId) || nft.editions[0],
    favorite = favorites.data?.includes(nft.id) || false;
  async function buy() {
    try {
      await cart.mutateAsync({
        nftId: nft.id,
        editionId: edition.id,
        quantity,
        add: true,
      });
      notice("NFT adicionado ao carrinho.");
      void navigate({ to: "/cart" });
    } catch (e) {
      notice(errorMessage(e));
    }
  }
  function toggleFavorite() {
    if (!session.data?.user) {
      void navigate({ to: "/login", search: { redirect: `/nft/${nft.id}` } });
      return;
    }
    favoriteMutation.mutate(
      { nftId: nft.id, favorite: !favorite },
      { onError: (e) => notice(errorMessage(e)) },
    );
  }
  return (
    <div className="detail-page">
      <PageHeading title="Detalhes do NFT" />
      <section className="detail-layout">
        <div className="gallery">
          <div className="thumbnails">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                className={selectedImage === i ? "selected" : ""}
                aria-label={`Visualização ${i + 1} de ${nft.name}`}
                onClick={() => setSelectedImage(i)}
              >
                <img src={nft.image} alt="" width="100" height="100" />
              </button>
            ))}
          </div>
          <div className="main-art">
            <img
              src={nft.image}
              alt={nft.name}
              width="444"
              height="444"
              fetchPriority="high"
            />
            <button aria-label="Ampliar imagem" onClick={() => setZoom(true)}>
              <Search />
            </button>
          </div>
        </div>
        <div className="detail-info">
          <h1>{nft.name}</h1>
          <div className="detail-price">
            <strong>{nft.price} ETH</strong>
            <span aria-label="Avaliação ilustrativa 4,8 de 5">
              ★★★★☆ <small>19 avaliações de colecionadores</small>
            </span>
          </div>
          <h2>Sobre este NFT:</h2>
          <p>{nft.description}</p>
          <fieldset className="edition-options">
            <legend>Edição:</legend>
            {nft.editions.map((e) => (
              <label
                key={e.id}
                className={edition.id === e.id ? "selected" : ""}
              >
                <input
                  type="radio"
                  name="edition"
                  value={e.id}
                  checked={edition.id === e.id}
                  onChange={() => {
                    setEdition(e.id);
                    setQuantity(1);
                  }}
                />
                {e.label}
                {e.stock === 0 ? " · esgotada" : ""}
              </label>
            ))}
          </fieldset>
          <div className="detail-actions">
            <Quantity
              value={quantity}
              max={edition.stock}
              onChange={setQuantity}
              disabled={cart.isPending}
            />
            <Button
              onClick={buy}
              disabled={cart.isPending || edition.stock < quantity}
            >
              {cart.isPending ? "Adicionando…" : "Comprar NFT"}
            </Button>
            <Button
              variant="outline"
              disabled={favoriteMutation.isPending}
              onClick={toggleFavorite}
              aria-pressed={favorite}
            >
              <Heart size={20} fill={favorite ? "currentColor" : "none"} />
              {favorite ? "Favoritado" : "Favoritar"}
            </Button>
            <a
              className="mobile-cart-shortcut"
              href="/cart"
              aria-label="Abrir carrinho"
            >
              <ShoppingCart />
            </a>
          </div>
          {edition.stock < quantity && (
            <p role="alert">
              Esta edição está indisponível para a quantidade escolhida.
            </p>
          )}
          <dl className="nft-metadata">
            <div>
              <dt>ID do token:</dt>
              <dd>#{nft.id.replace("nft-", "").padStart(4, "0")}</dd>
            </div>
            <div>
              <dt>Coleção:</dt>
              <dd>{nft.collection}</dd>
            </div>
            <div>
              <dt>Rede:</dt>
              <dd>{nft.network}</dd>
            </div>
            <div>
              <dt>Disponibilidade:</dt>
              <dd>{edition.stock} unidades</dd>
            </div>
          </dl>
          <button
            className="share-action"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href);
                notice("Link copiado.");
              } catch {
                notice("Copie o endereço da página para compartilhar.");
              }
            }}
          >
            Compartilhar este NFT <Share2 size={16} />
          </button>
        </div>
      </section>
      <section className="nft-description">
        <div className="description-tabs">
          <button
            aria-pressed={tab === "details"}
            onClick={() => setTab("details")}
          >
            Detalhes do NFT
          </button>
          <button
            aria-pressed={tab === "reviews"}
            onClick={() => setTab("reviews")}
          >
            Avaliações de colecionadores (19)
          </button>
        </div>
        {tab === "details" ? (
          <>
            <p>
              {nft.name} é uma obra digital da coleção Kurio Editions. Cada
              atributo faz parte da identidade da coleção. Explore identidade,
              movimento e luz em um mundo digital sem fronteiras.
            </p>
            <p>
              A propriedade nesta demonstração é simulada. Nenhum ativo é
              transferido na blockchain e nenhuma cobrança real é realizada.
            </p>
            <h3>Rede:</h3>
            <p>
              {nft.network}. Os preços e a disponibilidade são atualizados pela
              API.
            </p>
            <h3>Contrato:</h3>
            <p>Referência ilustrativa de um contrato ERC-721.</p>
            <h3>Direitos autorais:</h3>
            <p>A compra simulada não transfere direitos autorais reais.</p>
          </>
        ) : (
          <p>
            As 19 avaliações do layout são ilustrativas. A publicação de
            avaliações não faz parte desta demonstração.
          </p>
        )}
      </section>
      <Recommendations exclude={nft.id} />
      <Dialog open={zoom} onOpenChange={setZoom} title={nft.name}>
        <img
          className="zoom-art"
          src={nft.image}
          alt={`Imagem ampliada de ${nft.name}`}
        />
      </Dialog>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div
      className="detail-page detail-loading"
      role="status"
      aria-label="Carregando conteúdo"
    >
      <PageHeading title="Detalhes do NFT" />
      <div className="detail-layout">
        <div className="gallery">
          <div className="thumbnails">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 100 }} />
            ))}
          </div>
          <div className="main-art">
            <div className="skeleton" style={{ aspectRatio: "1" }} />
          </div>
        </div>
        <div className="detail-info">
          {[85, 65, 95, 70, 90, 60, 80].map((width, i) => (
            <div
              key={i}
              className="skeleton"
              style={{
                height: i === 0 ? 36 : 24,
                width: `${width}%`,
                marginBottom: 24,
              }}
            />
          ))}
        </div>
      </div>
      <div className="loading-description">
        <div className="skeleton" style={{ height: 24, width: "60%" }} />
      </div>
    </div>
  );
}
