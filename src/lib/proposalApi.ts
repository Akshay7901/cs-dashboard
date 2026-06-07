const UPSTREAM_BASE = "https://api.cambridgescholars.com/api/proposals";

export function proposalApiFetch(path: string, init?: RequestInit) {
  const normalizedPath = path.startsWith("/") || path.startsWith("?") ? path : `/${path}`;
  const url = `${UPSTREAM_BASE}${normalizedPath}`;
  return fetch(url, init);
}