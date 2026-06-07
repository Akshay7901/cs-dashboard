import { createFileRoute } from "@tanstack/react-router";

const UPSTREAM = "https://api.cambridgescholars.com/api/proposals";

export const Route = createFileRoute("/api/proxy/proposals")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const target = `${UPSTREAM}?${url.searchParams.toString()}`;
        const auth = request.headers.get("authorization") || "";
        const res = await fetch(target, {
          method: "GET",
          headers: { Accept: "application/json", ...(auth ? { Authorization: auth } : {}) },
        });
        const body = await res.text();
        return new Response(body, {
          status: res.status,
          headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
        });
      },
    },
  },
});