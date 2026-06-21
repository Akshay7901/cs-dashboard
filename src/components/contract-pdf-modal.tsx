import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { fetchContractPdfBlob } from "@/lib/contractsApi";

export function ContractPdfModal({
  ticket,
  open,
  onClose,
}: {
  ticket: string;
  open: boolean;
  onClose: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let blobUrl: string | null = null;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const u = await fetchContractPdfBlob(ticket);
        if (cancelled) {
          URL.revokeObjectURL(u);
          return;
        }
        blobUrl = u;
        setUrl(u);
      } catch (e) {
        if (!cancelled) setError((e as Error).message || "Failed to load contract.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setUrl(null);
    };
  }, [open, ticket]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3">
          <h2 className="font-serif text-lg font-bold text-stone-900">
            Contract Document
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 bg-stone-100">
          {loading && (
            <div className="flex h-full items-center justify-center font-sans text-sm text-stone-500">
              Loading contract…
            </div>
          )}
          {error && (
            <div className="flex h-full items-center justify-center font-sans text-sm text-rose-700">
              {error}
            </div>
          )}
          {url && !loading && !error && (
            <iframe
              title="Contract PDF"
              src={url}
              className="h-full w-full border-0"
            />
          )}
        </div>
      </div>
    </div>
  );
}