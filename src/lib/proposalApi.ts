const UPSTREAM_BASE = "https://api.cambridgescholars.com/api/proposals";

export function proposalApiFetch(path: string, init?: RequestInit) {
  let normalizedPath = path;
  if (normalizedPath && !normalizedPath.startsWith("/") && !normalizedPath.startsWith("?")) {
    normalizedPath = `/${normalizedPath}`;
  }
  const url = `${UPSTREAM_BASE}${normalizedPath}`;
  return fetch(url, init);
}