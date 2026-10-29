import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { queryClient } from "./lib/api";
import { router } from "./router";
import { NoticeProvider } from "./components/feedback";
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NoticeProvider>
        <RouterProvider router={router} />
      </NoticeProvider>
    </QueryClientProvider>
  );
}
