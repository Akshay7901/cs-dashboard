import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, LogOut, Plus, ChevronRight, X } from "lucide-react";
import cspLogo from "@/assets/csp-logo.png";
import {
  PROPOSALS,
  initialsFromName,
  type Proposal,
} from "@/lib/proposals";

type AssignmentSnapshot = {
  id: string;
  proposalId: string;
  reviewerEmail: string;
  reviewerName: string;
  assignedAt: string;
  proposal: {
    id: string;
    title: string;
    kind: string;
    subject: string;
    subtitle?: string;
    authorName: string;
    authorAffiliation: string;
    wordCount: number;
    overview: string;
  };
};

export const Route = createFileRoute("/dashboard/reviewer/submission/$id")({
  head: () => ({ meta: [{ title: "Review Submission — Reviewer Portal" }] }),
  loader: ({ params }) => {
    const proposal = PROPOSALS.find((p) => p.id === params.id) ?? null;
    return { proposal, id: params.id };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-[#FAF6EE] p-10 font-sans text-stone-700">
      <p>Submission not found.</p>
      <Link to="/dashboard/reviewer" className="mt-4 inline-block underline">
        Back to dashboard
      </Link>
    </div>
  ),
  component: ReviewerSubmission,
});

type RecKey = "proceed" | "minor" | "major" | "reject";

const RECOMMENDATIONS: { key: RecKey; label: string; sub: string }[] = [
  {
    key: "proceed",
    label: "Proceed without changes",
    sub: "The manuscript is ready for publication as submitted.",
  },
  {
    key: "minor",
    label: "Minor revisions needed",
    sub: "Small corrections required; no further review needed.",
  },
  {
    key: "major",
    label: "Major revisions needed",
    sub: "Substantial changes required before publication can be considered.",
  },
  {
    key: "reject",
    label: "Reject",
    sub: "The manuscript is not suitable for publication.",
  },
];

function ReviewerSubmission() {
  const { proposal: loaded, id } = Route.useLoaderData() as {
    proposal: Proposal | null;
    id: string;
  };
  const navigate = useNavigate();

  const [proposal, setProposal] = useState<{
    id: string;
    title: string;
    subtitle?: string;
    kind: string;
    authorName: string;
    authorAffiliation: string;
    authorEmail: string;
    country: string;
    biography: string;
    wordCount: number;
    overview: string;
    discipline: string;
    estCompletion: string;
  } | null>(
    loaded
      ? {
          id: loaded.id,
          title: loaded.title,
          subtitle: loaded.subtitle,
          kind: loaded.kind,
          authorName: loaded.authorName,
          authorAffiliation: loaded.authorAffiliation,
          authorEmail: loaded.authorEmail,
          country: loaded.country,
          biography: loaded.biography,
          wordCount: loaded.wordCount,
          overview: loaded.overview,
          discipline: loaded.discipline,
          estCompletion: loaded.estCompletion,
        }
      : (() => {
          if (typeof window === "undefined") return null;
          try {
            const aRaw = localStorage.getItem("csp.assignments");
            if (!aRaw) return null;
            const list = JSON.parse(aRaw) as AssignmentSnapshot[];
            const found = list.find(
              (a) => a.id === id || a.proposalId === id,
            );
            if (!found) return null;
            return {
              id: found.proposal.id,
              title: found.proposal.title,
              subtitle: found.proposal.subtitle,
              kind: found.proposal.kind,
              authorName: found.proposal.authorName,
              authorAffiliation: found.proposal.authorAffiliation,
              authorEmail: "—",
              country: "—",
              biography: "—",
              wordCount: found.proposal.wordCount,
              overview: found.proposal.overview,
              discipline: found.proposal.subject,
              estCompletion: "—",
            };
          } catch {
            return null;
          }
        })(),
  );

  type CommentType = "General" | "Major Concern" | "Minor Concern" | "Suggestion" | "Question";
  type CommentEntry = { type: CommentType; section: string; page: string; text: string };

  const [summary, setSummary] = useState("");
  const [recommendation, setRecommendation] = useState<RecKey | null>(null);
  const [comments, setComments] = useState<CommentEntry[]>([]);

  const addComment = () => {
    setComments((c) => [...c, { type: "General", section: "", page: "", text: "" }]);
  };

  const updateComment = (i: number, patch: Partial<CommentEntry>) => {
    setComments((c) => c.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  };

  const removeComment = (i: number) => {
    setComments((c) => c.filter((_, idx) => idx !== i));
  };

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("csp.session");
      if (!raw) {
        navigate({ to: "/login" });
        return;
      }
      const session = JSON.parse(raw) as { role: string; email: string };
      if (session.role !== "reviewer") {
        navigate({ to: "/login" });
        return;
      }
    } catch {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  const onLogout = () => {
    try {
      sessionStorage.removeItem("csp.session");
    } catch {
      /* ignore */
    }
    navigate({ to: "/login" });
  };

  if (!proposal) {
    throw notFound();
  }

  const reviewerName = "Dr. Anna Hoffmann";
  const canSubmit = recommendation !== null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#FAF6EE] font-sans text-stone-800">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard/reviewer" className="flex items-center gap-3">
              <img src={cspLogo} alt="CSP" width={32} height={32} />
              <span className="font-serif text-xl font-bold text-stone-900">
                Cambridge Scholars Publishing
              </span>
            </Link>
            <span className="mx-2 h-5 w-px bg-stone-300" />
            <span className="font-sans text-base text-[#0E3D2F]">Reviewer Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 font-sans text-xs font-semibold text-sky-700">
              {initialsFromName(reviewerName)}
            </div>
            <span className="font-sans text-sm font-medium text-stone-800">
              {reviewerName}
            </span>
            <span className="h-5 w-px bg-stone-300" />
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 font-sans text-sm text-stone-600 hover:text-stone-900"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Two-pane layout */}
      <div className="grid min-h-0 w-full flex-1 grid-cols-1 gap-6 px-0 py-0 lg:grid-cols-[minmax(0,550px)_1fr]">
        {/* LEFT — Review form */}
        <section className="min-h-0 overflow-y-auto bg-white px-6 py-4">
          <Link
            to="/dashboard/reviewer"
            className="mb-1 inline-flex items-center gap-1 font-sans text-xs text-[#7A6A5A] hover:underline"
          >
            <ChevronLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <h1 className="mt-3 font-serif text-base font-bold leading-snug text-[#2C1A0E] line-clamp-2">
            {proposal.title}
          </h1>
          <p className="mt-1 font-sans text-xs text-[#7A6A5A]">
            {proposal.authorName} · {proposal.authorAffiliation}
          </p>

          <hr className="my-6 border-stone-200" />

          {/* Comments */}
          <p className="mb-2 font-sans text-xs font-semibold uppercase tracking-wide text-[#7A6A5A]">
            Comments{comments.length > 0 ? ` (${comments.length})` : ""}
          </p>
          {comments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-white/60 px-6 py-10 text-center">
              <p className="font-sans text-sm font-medium text-stone-700">No comments yet</p>
              <p className="mt-1 font-sans text-xs text-stone-500">
                Add your first comment below
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((c, i) => (
                <div key={i} className="rounded-2xl border border-stone-200 bg-white p-4">
                  <div className="flex items-start gap-2">
                    <select
                      value={c.type}
                      onChange={(e) => updateComment(i, { type: e.target.value as CommentType })}
                      className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-sans text-xs font-medium text-slate-600 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    >
                      <option>General</option>
                      <option>Major Concern</option>
                      <option>Minor Concern</option>
                      <option>Suggestion</option>
                      <option>Question</option>
                    </select>
                    <input
                      type="text"
                      value={c.section}
                      onChange={(e) => updateComment(i, { section: e.target.value })}
                      placeholder="Section / Chapter"
                      className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-sans text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    />
                    <input
                      type="text"
                      value={c.page}
                      onChange={(e) => updateComment(i, { page: e.target.value })}
                      placeholder="Page"
                      className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-sans text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    />
                    <button
                      type="button"
                      onClick={() => removeComment(i)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                      aria-label="Remove comment"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    value={c.text}
                    onChange={(e) => updateComment(i, { text: e.target.value })}
                    rows={4}
                    placeholder="Enter your comment…"
                    className="mt-2 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-sans text-xs text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addComment}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sky-300 bg-white px-4 py-4 font-sans text-sm font-semibold text-sky-600 hover:border-sky-400 hover:bg-sky-50"
          >
            <Plus className="h-4 w-4" />
            Add comment
          </button>

          {/* Overall summary */}
          <div className="mt-8">
            <label className="block mb-2 font-sans text-xs font-semibold uppercase tracking-wide text-[#7A6A5A]">
              Overall Summary{" "}
              <span className="font-normal normal-case text-[#7A6A5A]/70">(optional)</span>
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={5}
              placeholder="Summarise your overall assessment of the manuscript — strengths, weaknesses, and your key recommendation…"
              className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-sans text-xs text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <hr className="my-6 border-stone-200" />

          {/* Recommendation */}
          <div>
            <label className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-700">
              Recommendation <span className="text-rose-500">*</span>
            </label>
            <div className="mt-3 space-y-3">
              {RECOMMENDATIONS.map((r) => {
                const checked = recommendation === r.key;
                return (
                  <label
                    key={r.key}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                      checked
                        ? "border-sky-400 bg-sky-50/60 ring-2 ring-sky-100"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="recommendation"
                      className="mt-1 h-4 w-4 cursor-pointer accent-sky-600"
                      checked={checked}
                      onChange={() => setRecommendation(r.key)}
                    />
                    <div>
                      <div className="font-sans text-sm font-semibold text-stone-900">
                        {r.label}
                      </div>
                      <div className="mt-0.5 font-sans text-sm text-stone-600">
                        {r.sub}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Footer actions */}
          <div className="mt-8 mb-4 flex items-center gap-3">
            <button
              type="button"
              className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 font-sans text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-3 font-sans text-sm font-semibold transition-colors ${
                canSubmit
                  ? "bg-sky-600 text-white hover:bg-sky-700"
                  : "bg-sky-200 text-white"
              }`}
            >
              Submit Review
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* RIGHT — Proposal context */}
        <section className="min-h-0 space-y-4 overflow-y-auto px-6 py-4">
          {/* Title card */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="font-serif text-xl font-bold leading-tight text-[#2C1A0E]">
              {proposal.title}
            </h2>
            {proposal.subtitle && (
              <p className="mt-1 font-sans text-sm font-medium text-[#A6814A]">{proposal.subtitle}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill>{proposal.kind}</Pill>
              <Pill>{proposal.wordCount.toLocaleString()} words</Pill>
              {proposal.estCompletion && proposal.estCompletion !== "—" && (
                <Pill>{proposal.estCompletion}</Pill>
              )}
            </div>
          </div>

          {/* Primary Author */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <h3 className="font-serif text-sm font-bold text-[#2C1A0E]">Primary Author</h3>
            <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <Field label="Name" value={proposal.authorName} />
              <Field label="Email" value={proposal.authorEmail} />
              <Field label="Institution" value={proposal.authorAffiliation} />
              <Field label="Country" value={proposal.country} />
            </div>
            <div className="mt-5">
              <div className="font-sans text-xs font-medium text-stone-500">Biography</div>
              <p className="mt-1 font-sans text-sm leading-relaxed text-stone-700">
                {proposal.biography}
              </p>
            </div>
          </div>

          {/* Summary & Description */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <div className="flex items-baseline gap-2">
              <h3 className="font-serif text-sm font-bold text-[#2C1A0E]">
                Summary &amp; Description
              </h3>
              <span className="font-sans text-sm text-emerald-700">{proposal.discipline}</span>
            </div>

            <div className="mt-5">
              <div className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-500">
                Overview
              </div>
              <p className="mt-2 font-sans text-sm leading-relaxed text-stone-700">
                {proposal.overview}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1 font-sans text-xs font-medium text-stone-700">
      {children}
    </span>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-sans text-xs font-medium text-stone-500">{label}</div>
      <div className="mt-1 font-sans text-sm text-stone-800">{value}</div>
    </div>
  );
}