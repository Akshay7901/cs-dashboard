const EXTERNAL_API_BASE = "https://api.cambridgescholars.com/api/proposals";

function getApiBase() {
  if (typeof window === "undefined") return EXTERNAL_API_BASE;
  if (window.location.hostname.endsWith("vercel.app")) return "/api/proposals";
  return EXTERNAL_API_BASE;
}

export function proposalApiFetch(path: string, init?: RequestInit) {
  let suffix = path ?? "";
  let query = "";
  const qIdx = suffix.indexOf("?");
  if (qIdx >= 0) {
    query = suffix.slice(qIdx);
    suffix = suffix.slice(0, qIdx);
  }
  if (suffix.startsWith("/")) suffix = suffix.slice(1);
  const apiBase = getApiBase();
  const url = suffix ? `${apiBase}/${suffix}${query}` : `${apiBase}${query}`;
  return fetch(url, init);
}