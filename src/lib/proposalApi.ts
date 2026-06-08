const API_BASE = "https://api.cambridgescholars.com/api/proposals";

export function proposalApiFetch(path: string, init?: RequestInit) {
  let suffix = path ?? "";
  let query = "";
  const qIdx = suffix.indexOf("?");
  if (qIdx >= 0) {
    query = suffix.slice(qIdx);
    suffix = suffix.slice(0, qIdx);
  }
  if (suffix.startsWith("/")) suffix = suffix.slice(1);
  const url = suffix ? `${API_BASE}/${suffix}${query}` : `${API_BASE}${query}`;
  return fetch(url, init);
}