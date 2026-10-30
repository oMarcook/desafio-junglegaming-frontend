import { createRoot } from "react-dom/client";
import "./styles.css";
import "./flows.css";
async function bootstrap() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== "false") {
    const { startMocks } = await import("./mocks/browser");
    await startMocks();
  }
  const { default: App } = await import("./app");
  createRoot(document.getElementById("root")!).render(<App />);
}
bootstrap().catch((error) => {
  console.error(error);
  document.getElementById("root")!.textContent =
    "Não foi possível iniciar o marketplace. Recarregue a página.";
});
