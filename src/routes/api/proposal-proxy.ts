import { createFileRoute } from "@tanstack/react-router";

const UPSTREAM_BASE = "https://api.cambridgescholars.com/api/proposals";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

async function proxyProposalRequest(request: Request) {
  const url = new URL(request.url);
  const rawPath = url.searchParams.get("path") || "/";

  if (rawPath.length > 500 || rawPath.startsWith("//") || rawPath.includes("://")) {
    return jsonResponse({ error: "Invalid API path." }, 400);
  }

  const path = rawPath.startsWith("/") || rawPath.startsWith("?") ? rawPath : `/${rawPath}`;
  const upstreamUrl = `${UPSTREAM_BASE}${path}`;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const authorization = request.headers.get("authorization");

  if (contentType) headers.set("content-type", contentType);
  if (authorization) headers.set("authorization", authorization);

  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.text();
  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body,
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  Object.entries(CORS_HEADERS).forEach(([key, value]) => responseHeaders.set(key, value));

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export const Route = createFileRoute("/api/proposal-proxy")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: async ({ request }) => proxyProposalRequest(request),
      POST: async ({ request }) => proxyProposalRequest(request),
      PUT: async ({ request }) => proxyProposalRequest(request),
      PATCH: async ({ request }) => proxyProposalRequest(request),
      DELETE: async ({ request }) => proxyProposalRequest(request),
    },
  },
});