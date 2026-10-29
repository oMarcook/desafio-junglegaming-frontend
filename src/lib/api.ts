import axios from "axios";
import { QueryClient } from "@tanstack/react-query";
import type { ApiError } from "../domain/types";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 6000,
  withCredentials: true,
});
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      gcTime: 300000,
      retry: (count, error) =>
        count < 1 &&
        (!axios.isAxiosError(error) ||
          !error.response ||
          error.response.status >= 500),
      refetchOnWindowFocus: true,
    },
    mutations: { retry: false },
  },
});
export const errorMessage = (error: unknown) =>
  axios.isAxiosError<ApiError>(error)
    ? error.response?.data.message ||
      "Falha de conexão. Verifique a rede e tente novamente."
    : error instanceof Error
      ? error.message
      : "Não foi possível concluir a operação.";
export const errorFields = (error: unknown) =>
  axios.isAxiosError<ApiError>(error)
    ? (error.response?.data.fields ?? {})
    : {};
export function clearPrivateData() {
  queryClient.cancelQueries();
  queryClient.removeQueries({
    predicate: (q) => q.queryKey[0] !== "catalog" && q.queryKey[0] !== "nft",
  });
}
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !error.config?.url?.includes("/session/login")
    ) {
      clearPrivateData();
      queryClient.setQueryData(["session"], { user: null, expiresAt: null });
    }
    return Promise.reject(error);
  },
);
