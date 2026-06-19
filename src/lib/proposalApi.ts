const EXTERNAL_API_BASE = "https://api.cambridgescholars.com/api/proposals";

let isRedirectingForAuth = false;

export async function proposalApiFetch(path: string, init?: RequestInit) {
  let suffix = path ?? "";
  let query = "";
  const qIdx = suffix.indexOf("?");
  if (qIdx >= 0) {
    query = suffix.slice(qIdx);
    suffix = suffix.slice(0, qIdx);
  }
  if (suffix.startsWith("/")) suffix = suffix.slice(1);
  const url = suffix ? `${EXTERNAL_API_BASE}/${suffix}${query}` : `${EXTERNAL_API_BASE}${query}`;
  const res = await fetch(url, init);
  if (res.status === 401 && typeof window !== "undefined") {
    const isAuthCall = suffix.startsWith("auth/");
    if (!isAuthCall && !isRedirectingForAuth) {
      isRedirectingForAuth = true;
      try {
        const { clearPortalSession } = await import("./auth");
        clearPortalSession();
      } catch {
        // ignore
      }
      if (!window.location.pathname.startsWith("/login")) {
        window.location.replace("/login?reason=expired");
      }
    }
  }
  return res;
}