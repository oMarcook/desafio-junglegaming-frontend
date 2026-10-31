import { createContext, useContext, useState, type ReactNode } from "react";
import { Button } from "./ui/button";
import { errorMessage } from "../lib/api";
const NoticeContext = createContext<(message: string) => void>(() => {});
export const useNotice = () => useContext(NoticeContext);
export function keepDialogOpenForNotice(event: Event) {
  if (
    event.target instanceof Element &&
    event.target.closest(".toast, [data-notice-dismiss]")
  ) {
    event.preventDefault();
  }
}
export function NoticeProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  return (
    <NoticeContext.Provider value={setMessage}>
      {children}
      <div role="status" aria-live="polite" className={message ? "toast" : ""}>
        {message && (
          <>
            <span>{message}</span>
            <button
              data-notice-dismiss
              onClick={() => setMessage("")}
              aria-label="Dispensar aviso"
            >
              ×
            </button>
          </>
        )}
      </div>
    </NoticeContext.Provider>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <div className="state-panel" role="alert">
      <h2>Não foi possível carregar</h2>
      <p>{errorMessage(error)}</p>
      {retry && <Button onClick={retry}>Tentar novamente</Button>}
    </div>
  );
}
export function Skeleton({ cards = 1 }: { cards?: number }) {
  return (
    <div
      className={cards > 1 ? "nft-grid" : "skeleton-stack"}
      role="status"
      aria-label="Carregando conteúdo"
    >
      {Array.from({ length: cards }, (_, i) => (
        <div key={i}>
          <div className="skeleton skeleton-image" />
          <div className="skeleton h-5 mt-3 w-3/4" />
          <div className="skeleton h-5 mt-2 w-1/3" />
        </div>
      ))}
    </div>
  );
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="state-panel">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
