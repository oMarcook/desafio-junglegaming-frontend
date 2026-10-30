import { delay, http, HttpResponse } from "msw";
import { z } from "zod";
import {
  account,
  cart,
  db,
  emit,
  hashPassword,
  quote,
  reset,
  save,
  schedule,
  settle,
  updateNft,
} from "./database";
import {
  collectorSchema,
  loginSchema,
  passwordSchema,
  profileSchema,
  registerSchema,
  walletSchema,
} from "../domain/validation";
import { wei } from "../domain/money";
import type { Order, Scenario } from "../domain/types";

const fail = (
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
) => HttpResponse.json({ code, message, fields }, { status });
function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success)
    throw {
      validation: true,
      fields: Object.fromEntries(
        result.error.issues.map((i) => [i.path.join("."), i.message]),
      ),
    };
  return result.data;
}
const privatePaths = [
  "/profile",
  "/wallets",
  "/favorites",
  "/orders",
  "/wallet-connection",
];
let requests = 0;
export const handlers = [
  http.all("/api/*", async ({ request }) => {
    const url = new URL(request.url),
      path = url.pathname.slice(4),
      method = request.method;
    if (path.startsWith("/simulation")) {
      const data =
        method === "GET"
          ? {}
          : ((await request.json()) as Record<string, unknown>);
      if (path === "/simulation/reset") {
        await reset((data.scenario as Scenario) || "default");
        return HttpResponse.json({ ok: true });
      }
      if (path === "/simulation/scenario") {
        db.scenario = data.scenario as Scenario;
        save();
        return HttpResponse.json({ scenario: db.scenario });
      }
      if (path === "/simulation/expire") {
        db.session = null;
        save();
        return HttpResponse.json({ ok: true });
      }
      if (path === "/simulation/nft") {
        const event = updateNft(
          String(data.id || "nft-1"),
          data.soldOut === true,
        );
        if (data.duplicate && event) {
          emit("nft.updated", event.resourceId, event.version);
          emit("nft.updated", event.resourceId, event.version - 1);
        }
        return HttpResponse.json({ ok: true });
      }
      return HttpResponse.json({ scenario: db.scenario });
    }
    const scenario = db.scenario;
    const requestUser = account()?.user.id;
    await delay(
      scenario === "slow"
        ? 2200
        : scenario === "variable-latency"
          ? ++requests % 2
            ? 1200
            : 150
          : 120,
    );
    if (scenario === "offline") return HttpResponse.error();
    if (scenario === "server-error")
      return fail(503, "UNAVAILABLE", "Serviço indisponível. Tente novamente.");
    if (
      scenario === "expired-session" &&
      path !== "/session/login" &&
      path !== "/session/register"
    ) {
      db.session = null;
      save();
    }
    if (
      (privatePaths.some((p) => path.startsWith(p)) ||
        request.headers.get("X-Require-Session") === "true") &&
      (!account() || requestUser !== account()?.user.id)
    )
      return fail(
        401,
        "UNAUTHORIZED",
        "Sua sessão expirou. Entre novamente para continuar.",
      );
    try {
      const body =
        method === "GET" || method === "DELETE"
          ? {}
          : ((await request.json()) as Record<string, unknown>);
      if (path === "/session" && method === "GET")
        return HttpResponse.json({
          user: account()?.user ?? null,
          expiresAt: db.session?.expiresAt ?? null,
        });
      if (path === "/session/logout") {
        db.session = null;
        save();
        return HttpResponse.json({ ok: true });
      }
      if (path === "/session/login" || path === "/session/register") {
        const input = parse(
          path.endsWith("register") ? registerSchema : loginSchema,
          body,
        );
        let owner = db.accounts.find((a) => a.user.email === input.email);
        if (path.endsWith("register")) {
          if (owner)
            return fail(
              409,
              "EMAIL_CONFLICT",
              "Este e-mail já está cadastrado.",
              { email: "E-mail já cadastrado" },
            );
          const salt = crypto.randomUUID();
          owner = {
            user: {
              id: crypto.randomUUID(),
              name: String(body.name),
              email: input.email,
              phone: "",
              avatar: "",
            },
            salt,
            hash: await hashPassword(input.password, salt),
            favorites: [],
            wallets: [],
            cart: { items: [], coupon: "", version: 1 },
          };
          db.accounts.push(owner);
        } else if (
          !owner ||
          owner.hash !== (await hashPassword(input.password, owner.salt))
        )
          return fail(
            401,
            "INVALID_CREDENTIALS",
            "E-mail ou senha incorretos.",
          );
        if (!owner) throw new Error("Conta ausente");
        for (const item of db.guest.items) {
          const existing = owner.cart.items.find(
            (i) => i.nftId === item.nftId && i.editionId === item.editionId,
          );
          const stock = db.nfts
            .find((n) => n.id === item.nftId)!
            .editions.find((e) => e.id === item.editionId)!.stock;
          if (existing)
            existing.quantity = Math.min(
              stock,
              existing.quantity + item.quantity,
            );
          else
            owner.cart.items.push({
              ...item,
              quantity: Math.min(stock, item.quantity),
            });
        }
        owner.cart.items = owner.cart.items.filter((i) => i.quantity > 0);
        owner.cart.version++;
        if (!owner.cart.coupon) owner.cart.coupon = db.guest.coupon;
        db.guest = { items: [], coupon: "", version: 1 };
        db.session = { userId: owner.user.id, expiresAt: Date.now() + 3600000 };
        save();
        return HttpResponse.json({
          user: owner.user,
          expiresAt: db.session.expiresAt,
        });
      }
      if (path === "/nfts" && method === "GET") {
        let items = [...db.nfts];
        const q = url.searchParams.get("q")?.toLowerCase() || "";
        const cols =
          url.searchParams.get("collections")?.split(",").filter(Boolean) || [];
        const nets =
          url.searchParams.get("networks")?.split(",").filter(Boolean) || [];
        if (q)
          items = items.filter((n) =>
            `${n.name} ${n.collection}`.toLowerCase().includes(q),
          );
        if (cols.length)
          items = items.filter((n) => cols.includes(n.collection));
        if (nets.length) items = items.filter((n) => nets.includes(n.network));
        const min = url.searchParams.get("min"),
          max = url.searchParams.get("max");
        if (min && /^\d+(\.\d+)?$/.test(min))
          items = items.filter((n) => wei(n.price) >= wei(min));
        if (max && /^\d+(\.\d+)?$/.test(max))
          items = items.filter((n) => wei(n.price) <= wei(max));
        if (url.searchParams.get("tab") === "trending")
          items = items.filter((n) => n.trending);
        if (url.searchParams.get("tab") === "new")
          items = items.filter((n) => n.createdAt >= 1789500000000);
        const sort = url.searchParams.get("sort");
        items.sort((a, b) =>
          sort === "price-asc"
            ? wei(a.price) < wei(b.price)
              ? -1
              : wei(a.price) > wei(b.price)
                ? 1
                : 0
            : sort === "price-desc"
              ? wei(a.price) > wei(b.price)
                ? -1
                : wei(a.price) < wei(b.price)
                  ? 1
                  : 0
              : b.createdAt - a.createdAt,
        );
        if (scenario === "empty") items = [];
        const total = items.length,
          pages = Math.max(1, Math.ceil(total / 9)),
          page = Math.max(1, Number(url.searchParams.get("page")) || 1);
        return HttpResponse.json({
          items: items.slice((page - 1) * 9, page * 9),
          total,
          pages,
          page,
          collections: db.nfts.reduce<Record<string, number>>(
            (out, n) => ({
              ...out,
              [n.collection]: (out[n.collection] || 0) + 1,
            }),
            {},
          ),
        });
      }
      if (path.startsWith("/nfts/") && method === "GET") {
        const nft = db.nfts.find((n) => n.id === path.split("/")[2]);
        return nft
          ? HttpResponse.json(nft)
          : fail(404, "NOT_FOUND", "NFT não encontrado.");
      }
      if (path === "/favorites") {
        const owner = account()!;
        if (method === "GET") return HttpResponse.json(owner.favorites);
        if (scenario === "favorite-error")
          return fail(
            503,
            "FAVORITE_FAILED",
            "Não foi possível salvar o favorito.",
          );
        const id = String(body.nftId);
        if (!db.nfts.some((n) => n.id === id))
          return fail(404, "NOT_FOUND", "NFT não encontrado.");
        owner.favorites = body.favorite
          ? [...new Set([...owner.favorites, id])]
          : owner.favorites.filter((v) => v !== id);
        save();
        return HttpResponse.json(owner.favorites);
      }
      if (path === "/cart") {
        const current = cart();
        if (method === "GET") return HttpResponse.json(current);
        const input = parse(
          z.object({
            nftId: z.string(),
            editionId: z.string(),
            quantity: z.number().int().min(0).max(99),
          }),
          body,
        );
        const nft = db.nfts.find((n) => n.id === input.nftId),
          edition = nft?.editions.find((e) => e.id === input.editionId);
        if (!edition) return fail(404, "NOT_FOUND", "Edição não encontrada.");
        const existing = current.items.find(
          (i) => i.nftId === input.nftId && i.editionId === input.editionId,
        );
        const quantity =
          method === "POST"
            ? (existing?.quantity || 0) + input.quantity
            : input.quantity;
        if (quantity > edition.stock)
          return fail(
            409,
            "STOCK_CONFLICT",
            "Quantidade superior à disponibilidade desta edição.",
          );
        if (existing) existing.quantity = quantity;
        else if (quantity) current.items.push({ ...input, quantity });
        current.items = current.items.filter((i) => i.quantity > 0);
        current.version++;
        save();
        return HttpResponse.json(current);
      }
      if (path === "/quote") {
        if (method === "POST" && "coupon" in body) {
          const code = String(body.coupon).trim().toUpperCase();
          if (code && code !== "KURIO10")
            return fail(
              422,
              code === "EXPIRED" ? "COUPON_EXPIRED" : "COUPON_INVALID",
              code === "EXPIRED" ? "Cupom expirado." : "Cupom inválido.",
            );
          cart().coupon = code;
          save();
        }
        return HttpResponse.json(quote());
      }
      if (path === "/profile") {
        const owner = account()!;
        if (method === "GET") return HttpResponse.json(owner.user);
        const input = parse(profileSchema, body);
        if (scenario === "validation-error")
          return fail(422, "VALIDATION", "Verifique os campos.", {
            name: "Nome indisponível neste cenário",
          });
        if (
          db.accounts.some(
            (a) => a.user.id !== owner.user.id && a.user.email === input.email,
          )
        )
          return fail(409, "EMAIL_CONFLICT", "E-mail já cadastrado.", {
            email: "E-mail já cadastrado",
          });
        Object.assign(owner.user, input);
        save();
        return HttpResponse.json(owner.user);
      }
      if (path === "/profile/password") {
        const owner = account()!,
          input = parse(passwordSchema, body);
        if (
          (await hashPassword(input.currentPassword, owner.salt)) !== owner.hash
        )
          return fail(422, "PASSWORD", "Senha atual incorreta.", {
            currentPassword: "Senha atual incorreta",
          });
        owner.salt = crypto.randomUUID();
        owner.hash = await hashPassword(input.password, owner.salt);
        save();
        return HttpResponse.json({ ok: true });
      }
      if (path.startsWith("/wallets")) {
        const owner = account()!;
        if (method === "GET") return HttpResponse.json(owner.wallets);
        const input = parse(walletSchema, body);
        const id = path.split("/")[2];
        if (id && !owner.wallets.some((w) => w.id === id))
          return fail(404, "NOT_FOUND", "Carteira não encontrada.");
        if (
          owner.wallets.some((w) => w.address === input.address && w.id !== id)
        )
          return fail(409, "WALLET_CONFLICT", "Carteira já cadastrada.");
        if (input.primary) owner.wallets.forEach((w) => (w.primary = false));
        const wallet = { ...input, id: id || crypto.randomUUID() };
        if (id)
          owner.wallets = owner.wallets.map((w) => (w.id === id ? wallet : w));
        else owner.wallets.push(wallet);
        save();
        return HttpResponse.json(wallet);
      }
      if (path === "/wallet-connection") {
        if (body.action === "reject")
          return fail(409, "WALLET_REJECTED", "Conexão recusada na simulação.");
        return HttpResponse.json({ connected: body.action !== "disconnect" });
      }
      if (path === "/orders" && method === "POST") {
        const owner = account()!,
          key = request.headers.get("Idempotency-Key");
        if (!key)
          return fail(
            422,
            "IDEMPOTENCY_REQUIRED",
            "Chave de idempotência obrigatória.",
          );
        const fingerprint = JSON.stringify(body),
          attempt = db.attempts[`${owner.user.id}:${key}`];
        if (attempt) {
          if (attempt.body !== fingerprint)
            return fail(
              409,
              "IDEMPOTENCY_CONFLICT",
              "A chave já foi usada com outro conteúdo.",
            );
          const order = db.orders.find((o) => o.id === attempt.orderId)!;
          settle(order);
          return HttpResponse.json(order);
        }
        const collector = parse(collectorSchema, body.collector),
          wallet = owner.wallets.find((w) => w.id === body.walletId);
        if (!wallet)
          return fail(
            422,
            "WALLET_REQUIRED",
            "Selecione uma carteira cadastrada.",
          );
        const latest = quote();
        if (!latest.valid)
          return fail(
            409,
            "STOCK_CONFLICT",
            "Carrinho vazio ou edição indisponível.",
          );
        const reviewed = db.quotes[String(body.quoteId)];
        if (
          !reviewed ||
          reviewed.expiresAt <= Date.now() ||
          reviewed.ownerId !== owner.user.id ||
          reviewed.fingerprint !== db.quotes[latest.id].fingerprint
        )
          return fail(
            409,
            "QUOTE_CHANGED",
            "Os valores ou a disponibilidade mudaram. Revise e confirme novamente.",
          );
        if (
          latest.items.some(
            (i) =>
              db.nfts.find((n) => n.id === i.nftId)!.network !== wallet.network,
          )
        )
          return fail(
            422,
            "NETWORK_MISMATCH",
            "Escolha uma carteira na mesma rede dos NFTs. Compre redes diferentes em pedidos separados.",
          );
        const order: Order = {
          id: crypto.randomUUID(),
          userId: owner.user.id,
          status: "pending",
          version: 1,
          quote: structuredClone(latest),
          wallet: structuredClone(wallet),
          collector,
          transaction: `simulated-${crypto.randomUUID()}`,
          createdAt: Date.now(),
          settleAt: Date.now() + 2500,
          outcome: scenario === "payment-declined" ? "declined" : "confirmed",
        };
        db.orders.push(order);
        db.attempts[`${owner.user.id}:${key}`] = {
          body: fingerprint,
          orderId: order.id,
        };
        save();
        schedule(order);
        if (scenario === "order-timeout") {
          await delay(12000);
          return HttpResponse.error();
        }
        return HttpResponse.json(order, { status: 201 });
      }
      if (path === "/orders" && method === "GET") {
        const list = db.orders.filter((o) => o.userId === account()!.user.id);
        list.forEach(settle);
        return HttpResponse.json(list);
      }
      if (path.startsWith("/orders/") && method === "GET") {
        const order = db.orders.find((o) => o.id === path.split("/")[2]);
        if (!order) return fail(404, "NOT_FOUND", "Pedido não encontrado.");
        if (order.userId !== account()!.user.id)
          return fail(403, "FORBIDDEN", "Você não tem acesso a este pedido.");
        settle(order);
        return HttpResponse.json(order);
      }
      return fail(404, "NOT_FOUND", "Recurso não encontrado.");
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "validation" in error &&
        "fields" in error
      )
        return fail(
          422,
          "VALIDATION",
          "Verifique os campos informados.",
          error.fields as Record<string, string>,
        );
      return fail(500, "INTERNAL", "Falha ao processar a solicitação.");
    }
  }),
];
