import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Clear service worker cache if exists
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    } 
  });
  caches.keys().then(function(names) {
    for (let name of names) caches.delete(name);
  });
  window.location.reload();
}

// Add timestamp to force cache invalidation
const appVersion = "1.0.1-" + new Date().getTime();
console.log("Loading app version:", appVersion);

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App key={appVersion} />
  </QueryClientProvider>
);
