// Calls go through a same-origin proxy server route to avoid CORS issues
// from the upstream API (api.cambridgescholars.com does not send
// Access-Control-Allow-Origin, so browser fetches fail with "Failed to fetch").
const PROXY_BASE = "/api/proposals-proxy";

export function proposalApiFetch(path: string, init?: RequestInit) {
  let suffix = path ?? "";
  let query = "";
  const qIdx = suffix.indexOf("?");
  if (qIdx >= 0) {
    query = suffix.slice(qIdx);
    suffix = suffix.slice(0, qIdx);
  }
  if (suffix.startsWith("/")) suffix = suffix.slice(1);
  const url = `${PROXY_BASE}/${suffix}${query}`;
  return fetch(url, init);
}