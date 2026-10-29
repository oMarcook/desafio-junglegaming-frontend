import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./api";
import type {
  Cart,
  CatalogResult,
  CatalogSearch,
  Nft,
  Order,
  Quote,
  Session,
  User,
  Wallet,
} from "../domain/types";
export const sessionOptions = queryOptions({
  queryKey: ["session"],
  queryFn: ({ signal }) =>
    api.get<Session>("/session", { signal }).then((r) => r.data),
  staleTime: 10000,
});
export const useSession = () => useQuery(sessionOptions);
export const useCatalog = (search: CatalogSearch) =>
  useQuery({
    queryKey: ["catalog", search],
    queryFn: ({ signal }) =>
      api
        .get<CatalogResult>("/nfts", { params: search, signal })
        .then((r) => r.data),
  });
export const useNft = (id: string) =>
  useQuery({
    queryKey: ["nft", id],
    queryFn: ({ signal }) =>
      api.get<Nft>(`/nfts/${id}`, { signal }).then((r) => r.data),
    retry: false,
  });
export function useCart() {
  const session = useSession();
  return useQuery({
    queryKey: ["cart", session.data?.user?.id || "guest"],
    queryFn: ({ signal }) =>
      api.get<Cart>("/cart", { signal }).then((r) => r.data),
    enabled: session.isSuccess,
  });
}
export function useQuote() {
  const session = useSession();
  return useQuery({
    queryKey: ["quote", session.data?.user?.id || "guest"],
    queryFn: ({ signal }) =>
      api.get<Quote>("/quote", { signal }).then((r) => r.data),
    enabled: session.isSuccess,
  });
}
export function useWallets() {
  const session = useSession();
  return useQuery({
    queryKey: ["wallets", session.data?.user?.id],
    queryFn: ({ signal }) =>
      api.get<Wallet[]>("/wallets", { signal }).then((r) => r.data),
    enabled: !!session.data?.user,
  });
}
export function useProfile() {
  const session = useSession();
  return useQuery({
    queryKey: ["profile", session.data?.user?.id],
    queryFn: ({ signal }) =>
      api.get<User>("/profile", { signal }).then((r) => r.data),
    enabled: !!session.data?.user,
  });
}
export function useOrder(id: string) {
  const session = useSession();
  return useQuery({
    queryKey: ["order", session.data?.user?.id, id],
    queryFn: ({ signal }) =>
      api.get<Order>(`/orders/${id}`, { signal }).then((r) => r.data),
    enabled: !!session.data?.user,
    refetchInterval: (q) => (q.state.data?.status === "pending" ? 3000 : false),
    retry: false,
  });
}
export function useFavorites() {
  const session = useSession();
  return useQuery({
    queryKey: ["favorites", session.data?.user?.id],
    queryFn: ({ signal }) =>
      api.get<string[]>("/favorites", { signal }).then((r) => r.data),
    enabled: !!session.data?.user,
  });
}
export function useFavoriteMutation() {
  const session = useSession(),
    client = useQueryClient(),
    key = ["favorites", session.data?.user?.id];
  return useMutation({
    mutationFn: (input: { nftId: string; favorite: boolean }) =>
      api.put<string[]>("/favorites", input).then((r) => r.data),
    onMutate: async (input) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<string[]>(key);
      client.setQueryData<string[]>(key, (old) =>
        input.favorite
          ? [...new Set([...(old || []), input.nftId])]
          : (old || []).filter((id) => id !== input.nftId),
      );
      return { previous };
    },
    onError: (_e, _v, context) => client.setQueryData(key, context?.previous),
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  });
}
export function useCartMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      nftId: string;
      editionId: string;
      quantity: number;
      add?: boolean;
    }) =>
      api
        .request<Cart>({
          url: "/cart",
          method: input.add ? "POST" : "PUT",
          data: input,
        })
        .then((r) => r.data),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["cart"] }),
        client.invalidateQueries({ queryKey: ["quote"] }),
      ]);
    },
  });
}
