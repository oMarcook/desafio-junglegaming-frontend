import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
import { realtimeHandlers } from "./realtime";
import { initialize } from "./database";
export async function startMocks() {
  await initialize();
  const worker = setupWorker(...handlers, ...realtimeHandlers);
  await worker.start({ onUnhandledRequest: "bypass", quiet: true });
  return worker;
}
