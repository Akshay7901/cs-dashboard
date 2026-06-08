import { createFileRoute } from "@tanstack/react-router";

const UPSTREAM_BASE = "https://api.cambridgescholars.com/api/proposals";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "host",
  "content-length",
  "content-encoding",
]);

async function proxy(request: Request, splat: string) {
  const url = new URL(request.url);
  const suffix = splat ? `/${splat}` : "";
  const target = `${UPSTREAM_BASE}${suffix}${url.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(target, init);
  const respHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) respHeaders.set(key, value);
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: respHeaders,
  });
}

export const Route = createFileRoute("/api/proposals-proxy/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) =>
        proxy(request, (params as { _splat?: string })._splat ?? ""),
      POST: async ({ request, params }) =>
        proxy(request, (params as { _splat?: string })._splat ?? ""),
      PUT: async ({ request, params }) =>
        proxy(request, (params as { _splat?: string })._splat ?? ""),
      PATCH: async ({ request, params }) =>
        proxy(request, (params as { _splat?: string })._splat ?? ""),
      DELETE: async ({ request, params }) =>
        proxy(request, (params as { _splat?: string })._splat ?? ""),
    },
  },
});