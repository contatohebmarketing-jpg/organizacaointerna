// Service worker mínimo: habilita a instalação como app (PWA).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
// passthrough (deixa a rede cuidar das requisições)
self.addEventListener("fetch", () => {});
