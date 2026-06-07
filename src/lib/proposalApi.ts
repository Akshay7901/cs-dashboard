export function proposalApiFetch(path: string, init?: RequestInit) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `/api/proposal-proxy?path=${encodeURIComponent(normalizedPath)}`;
  return fetch(url, init);
}