import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Simple version number for cache busting
const appVersion = "1.0.1";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App key={appVersion} />
  </QueryClientProvider>
);
