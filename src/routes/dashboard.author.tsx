import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Plus,
  ChevronRight,
  Pencil,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  HelpCircle,
  FileText,
  XCircle,
} from "lucide-react";
import cspLogo from "@/assets/csp-logo.png";
import { portalLogout, getPortalSession, getPortalToken } from "@/lib/auth";
import { formatDate, initialsFromName, type Proposal, type StatusKey } from "@/lib/proposals";
import { proposalApiFetch } from "@/lib/proposalApi";

export const Route = createFileRoute("/dashboard/author")({
  head: () => ({ meta: [{ title: "Author Portal — My Proposals" }] }),
  component: AuthorDashboard,
});

type PillKey =
  | "all"
  | "attention"
  | "in_review"
  | "revisions"
  | "contract"
  | "major_revisions"
  | "signed"
  | "declined";

const ATTENTION: StatusKey[] = ["revisions", "contract", "major_revisions", "question"];

// API → local status mapping (mirrors dashboard.decision_reviewer.tsx).
const STATUS_MAP: Record<string, StatusKey> = {
  new: "submitted",
  submitted: "submitted",
  in_review: "in_review",
  review_returned: "review_returned",
  contract_issued: "contract",
  contract_received: "contract",
  awaiting_author_approval: "contract",
  queries_raised: "question",
  question_raised: "question",
  author_approved: "signed",
  locked: "signed",
  contract_signed: "signed",
  declined: "declined",
  awaiting_more_info: "revisions",
  revisions_requested: "revisions",
  major_revisions: "major_revisions",
};

const DISPLAY_STATUS_MAP: Record<string, StatusKey> = {
  "in review": "in_review",
  "under review": "in_review",
  "review returned": "review_returned",
  "contract issued": "contract",
  "contract received": "contract",
  "awaiting author approval": "contract",
  "queries raised": "question",
  "question raised": "question",
  "author approved": "signed",
  "contract signed": "signed",
  "awaiting more info": "revisions",
  "additional info required": "revisions",
  "revisions requested": "revisions",
  "major revisions required": "major_revisions",
  "major revisions": "major_revisions",
};

const EXTRA_STATUSES = [
  "new",
  "in_review",
  "review_returned",
  "contract_issued",
  "contract_received",
  "awaiting_author_approval",
  "queries_raised",
  "author_approved",
  "locked",
  "contract_signed",
  "declined",
  "awaiting_more_info",
  "major_revisions",
];

function normalizeStatus(raw?: string, display?: string): StatusKey {
  if (display) {
    const k = display.trim().toLowerCase();
    if (DISPLAY_STATUS_MAP[k]) return DISPLAY_STATUS_MAP[k];
  }
  if (raw) {
    const lower = raw.trim().toLowerCase();
    const snake = lower.replace(/\s+/g, "_");
    if (STATUS_MAP[snake]) return STATUS_MAP[snake];
    if (DISPLAY_STATUS_MAP[lower]) return DISPLAY_STATUS_MAP[lower];
  }
  return "submitted";
}

type ApiProposalItem = {
  ticket_number: string;
  title?: string;
  status?: string;
  display_status?: string;
  submitted_at?: string;
  updated_at?: string;
  corresponding_author?: string;
  email?: string;
  current_data?: Record<string, string | undefined>;
};

function toProposal(p: ApiProposalItem): Proposal {
  const cd = p.current_data || {};
  const title = p.title || cd.main_title || p.ticket_number;
  const kind = cd.book_type || cd.proposal_type || "Proposal";
  return {
    id: p.ticket_number,
    ref: p.ticket_number,
    title,
    kind,
    status: normalizeStatus(p.status, p.display_status),
    authorName: p.corresponding_author || cd.author_name || "",
    authorEmail: p.email || "",
    authorAffiliation: cd.affiliation || cd.institution || "",
    country: cd.country || "",
    mailingAddress: "",
    biography: "",
    submittedAt: p.submitted_at || "",
    updatedAt: p.updated_at || p.submitted_at || "",
    wordCount: 0,
    illustrations: 0,
    nonEnglish: false,
    estCompletion: "",
    discipline: cd.discipline || "",
    subdiscipline: "",
    overview: cd.overview || "",
    keywords: [],
    keyFeatures: "",
    intendedAudience: "",
    tableOfContents: [],
    whyNeeded: "",
    competingTitles: "",
    suggestedReviewers: [],
    additionalNotes: "",
    supportingDocs: [],
    decisionSummary: "",
  };
}

const PILLS: { key: PillKey; label: string; dot: string; match: (p: Proposal) => boolean }[] = [
  { key: "all", label: "All proposals", dot: "", match: () => true },
  {
    key: "attention",
    label: "Needs attention",
    dot: "bg-orange-500",
    match: (p) => ATTENTION.includes(p.status),
  },
  { key: "in_review", label: "Under review", dot: "bg-sky-500", match: (p) => p.status === "in_review" },
  {
    key: "revisions",
    label: "Revisions required",
    dot: "bg-violet-500",
    match: (p) => p.status === "revisions",
  },
  {
    key: "contract",
    label: "Contract ready",
    dot: "bg-violet-400",
    match: (p) => p.status === "contract",
  },
  {
    key: "major_revisions",
    label: "Revisions requested",
    dot: "bg-orange-500",
    match: (p) => p.status === "major_revisions",
  },
  { key: "signed", label: "Signed", dot: "bg-emerald-500", match: (p) => p.status === "signed" },
  {
    key: "declined",
    label: "Not progressing",
    dot: "bg-stone-400",
    match: (p) => p.status === "declined",
  },
];

interface CardConfig {
  bannerLabel: string;
  bannerDot: string;
  bannerTint: string;
  bannerText: string;
  tag?: "ACTION REQUIRED";
  iconBg: string;
  iconColor: string;
  Icon: typeof Pencil;
  eyebrow: string;
  eyebrowColor: string;
  body: string;
  cta?: { label: string; className: string };
  footnote?: string;
}

function configFor(p: Proposal): CardConfig {
  switch (p.status) {
    case "revisions":
      return {
        bannerLabel: "Revisions Requested",
        bannerDot: "bg-orange-500",
        bannerTint: "bg-orange-50",
        bannerText: "text-orange-700",
        tag: "ACTION REQUIRED",
        iconBg: "bg-orange-100",
        iconColor: "text-orange-600",
        Icon: Pencil,
        eyebrow: "Your input is needed",
        eyebrowColor: "text-orange-700",
        body: "Our editorial team has reviewed your proposal and would like you to address a few points before we can continue.",
        cta: {
          label: "Read feedback and edit your submission",
          className: "bg-orange-500 hover:bg-orange-600 text-white",
        },
        footnote: "Please open the submission, read the editor's feedback, and update your proposal accordingly.",
      };
    case "contract":
      return {
        bannerLabel: "Contract Issued",
        bannerDot: "bg-violet-500",
        bannerTint: "bg-violet-50",
        bannerText: "text-violet-700",
        tag: "ACTION REQUIRED",
        iconBg: "bg-violet-100",
        iconColor: "text-violet-600",
        Icon: CheckCircle2,
        eyebrow: "Your proposal has been accepted",
        eyebrowColor: "text-violet-700",
        body: "Congratulations — the reviewer's feedback and your publishing contract have been sent together. Please read the feedback, then sign your contract.",
        cta: {
          label: "Read feedback and sign your contract",
          className: "bg-violet-600 hover:bg-violet-700 text-white",
        },
        footnote: "Once you sign, our production team will get in touch to begin the editorial process.",
      };
    case "major_revisions":
      return {
        bannerLabel: "Major Revisions Required",
        bannerDot: "bg-rose-500",
        bannerTint: "bg-rose-50",
        bannerText: "text-rose-700",
        tag: "ACTION REQUIRED",
        iconBg: "bg-rose-100",
        iconColor: "text-rose-600",
        Icon: AlertTriangle,
        eyebrow: "Revisions needed following review",
        eyebrowColor: "text-rose-700",
        body: "Following expert peer review, there are areas of your proposal that need to be addressed before we can move forward.",
        cta: {
          label: "Read the reviewer's feedback",
          className: "bg-rose-600 hover:bg-rose-700 text-white",
        },
        footnote: "Please open the submission to read the reviewer's detailed comments and resubmit your revised proposal.",
      };
    case "question":
      return {
        bannerLabel: "Question Raised",
        bannerDot: "bg-teal-500",
        bannerTint: "bg-teal-50",
        bannerText: "text-teal-700",
        tag: "ACTION REQUIRED",
        iconBg: "bg-teal-100",
        iconColor: "text-teal-600",
        Icon: HelpCircle,
        eyebrow: "A question is awaiting your reply",
        eyebrowColor: "text-teal-700",
        body: "Our editor has a question about your proposal. Please respond so we can keep moving forward.",
        cta: {
          label: "Read the editor's question",
          className: "bg-teal-600 hover:bg-teal-700 text-white",
        },
      };
    case "in_review":
      return {
        bannerLabel: "Under Review",
        bannerDot: "bg-sky-500",
        bannerTint: "bg-sky-50",
        bannerText: "text-sky-700",
        iconBg: "bg-sky-100",
        iconColor: "text-sky-600",
        Icon: ClipboardList,
        eyebrow: "Being reviewed by an expert",
        eyebrowColor: "text-sky-700",
        body: "Your proposal is currently being assessed by one of our academic specialists. This is a normal and important part of the publishing process.",
        footnote: "This typically takes 4–6 weeks. We will contact you as soon as the review is complete.",
      };
    case "review_returned":
      return {
        bannerLabel: "Review Returned",
        bannerDot: "bg-indigo-500",
        bannerTint: "bg-indigo-50",
        bannerText: "text-indigo-700",
        iconBg: "bg-indigo-100",
        iconColor: "text-indigo-600",
        Icon: FileText,
        eyebrow: "The review is back with our editors",
        eyebrowColor: "text-indigo-700",
        body: "The reviewer's report has been returned to our editorial team. We will share the outcome with you shortly.",
      };
    case "submitted":
      return {
        bannerLabel: "Submitted",
        bannerDot: "bg-amber-400",
        bannerTint: "bg-amber-50",
        bannerText: "text-amber-700",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        Icon: FileText,
        eyebrow: "Awaiting editor assignment",
        eyebrowColor: "text-amber-700",
        body: "Your proposal has been received and is awaiting assignment to a commissioning editor.",
      };
    case "signed":
      return {
        bannerLabel: "Contract Signed",
        bannerDot: "bg-emerald-500",
        bannerTint: "bg-emerald-50",
        bannerText: "text-emerald-700",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        Icon: CheckCircle2,
        eyebrow: "You're in production",
        eyebrowColor: "text-emerald-700",
        body: "Your contract is signed and our production team is now working with you on the editorial process.",
      };
    case "declined":
    default:
      return {
        bannerLabel: "Declined",
        bannerDot: "bg-stone-400",
        bannerTint: "bg-stone-100",
        bannerText: "text-stone-600",
        iconBg: "bg-stone-100",
        iconColor: "text-stone-500",
        Icon: XCircle,
        eyebrow: "Not progressing at this time",
        eyebrowColor: "text-stone-600",
        body: "Unfortunately your proposal does not align with our current list. Thank you for considering Cambridge Scholars Publishing.",
      };
  }
}

function AuthorDashboard() {
  const navigate = useNavigate();
  const [activePill, setActivePill] = useState<PillKey>("all");
  const [authorEmail, setAuthorEmail] = useState<string>("");
  const [authorName, setAuthorName] = useState<string>("");
  const [myProposals, setMyProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const session = getPortalSession();
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      if (session.role !== "author") {
        navigate({ to: "/login" });
        return;
      }
      setAuthorEmail(session.email);
      if (session.name) setAuthorName(session.name);
      void loadMyProposals(session.email);
    } catch {
      navigate({ to: "/login" });
    }

    async function loadMyProposals(email: string) {
      setLoading(true);
      setLoadError(null);
      try {
        const token = getPortalToken();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const fetchList = async (qs = "") => {
          const r = await proposalApiFetch(qs, { headers });
          const b = (await r.json().catch(() => ({}))) as Record<string, unknown>;
          if (!r.ok) return { ok: false as const, status: r.status, error: b.error as string };
          const arr =
            (b.proposals as ApiProposalItem[]) ||
            (Array.isArray(b) ? (b as unknown as ApiProposalItem[]) : []);
          return { ok: true as const, items: arr };
        };
        const def = await fetchList("?limit=100&sort_order=desc");
        if (!def.ok) {
          setLoadError(def.error || `Failed to load proposals (${def.status}).`);
          setLoading(false);
          return;
        }
        const extras = await Promise.all(
          EXTRA_STATUSES.map((s) =>
            fetchList(`?limit=100&sort_order=desc&status=${encodeURIComponent(s)}`),
          ),
        );
        const merged = new Map<string, ApiProposalItem>();
        for (const it of def.items || []) merged.set(it.ticket_number, it);
        for (const r of extras) {
          if (!r.ok) continue;
          for (const it of r.items || []) {
            if (!merged.has(it.ticket_number)) merged.set(it.ticket_number, it);
          }
        }
        const lowerEmail = email.toLowerCase();
        const mine = Array.from(merged.values()).filter((p) => {
          const e = (p.email || p.current_data?.email || "").toLowerCase();
          return !e || e === lowerEmail;
        });
        setMyProposals(mine.map(toProposal));
      } catch {
        setLoadError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  }, [navigate]);

  const displayName = authorName || (myProposals[0]?.authorName ?? "Author");
  const initials = initialsFromName(displayName);

  const counts = useMemo(() => {
    const c: Record<PillKey, number> = {
      all: 0,
      attention: 0,
      in_review: 0,
      revisions: 0,
      contract: 0,
      major_revisions: 0,
      signed: 0,
      declined: 0,
    };
    for (const p of myProposals) {
      for (const pill of PILLS) if (pill.match(p)) c[pill.key]++;
    }
    return c;
  }, [myProposals]);

  const visible = useMemo(() => {
    const pill = PILLS.find((p) => p.key === activePill)!;
    return myProposals.filter(pill.match);
  }, [activePill, myProposals]);

  const attentionList = visible.filter((p) => ATTENTION.includes(p.status));
  const progressList = visible.filter((p) =>
    ["in_review", "review_returned", "submitted"].includes(p.status),
  );
  const doneList = visible.filter((p) => ["signed", "declined"].includes(p.status));

  const onLogout = async () => {
    await portalLogout();
    navigate({ to: "/login" });
  };

  const attentionCount = counts.attention;

  return (
    <main className="min-h-screen bg-[#FAF6EE] font-sans text-stone-900">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={cspLogo} alt="CSP" className="h-10 w-10" />
            <div className="flex items-center gap-3">
              <span className="font-serif text-base font-bold text-text">
                Cambridge Scholars Publishing
              </span>
              <span className="text-stone-300">|</span>
              <span className="font-sans text-sm font-medium text-portal-author">Author Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">
                {initials}
              </span>
              <span className="font-sans text-sm text-text">{displayName}</span>
            </div>
            <span className="text-stone-300">|</span>
            <button onClick={onLogout} className="font-sans text-sm text-text-muted transition-colors hover:text-text">
              Logout
            </button>
          </div>
        </div>
        <div className="h-[3px] bg-orange-500/80" />
      </header>

      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        {/* Hero */}
        <h1 className="font-serif text-3xl font-bold text-text">My Proposals</h1>
        <p className="mt-1.5 font-sans text-sm leading-relaxed text-text-muted">
          Here you can see all of your book proposals and what is happening with each one.
        </p>

        {loading && (
          <p className="mt-6 text-sm text-stone-500">Loading your proposals…</p>
        )}
        {loadError && (
          <p className="mt-6 text-sm text-rose-600">{loadError}</p>
        )}
        {!loading && !loadError && myProposals.length === 0 && (
          <p className="mt-6 text-sm text-stone-500">
            You don't have any proposals yet.
          </p>
        )}

        {/* Attention banner */}
        {attentionCount > 0 && (
          <div className="mt-8 flex items-start gap-4 rounded-2xl border border-orange-200 bg-orange-50/60 p-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-600">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-orange-700">
                {attentionCount} proposals need your attention
              </p>
              <p className="text-sm text-stone-600">
                Please scroll down to see what is needed and take action.
              </p>
            </div>
          </div>
        )}

        {/* Pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          {PILLS.map((pill) => {
            const active = activePill === pill.key;
            const isAll = pill.key === "all";
            return (
              <button
                key={pill.key}
                onClick={() => setActivePill(pill.key)}
                className={
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors " +
                  (active
                    ? isAll
                      ? "border-[#00422F] bg-[#00422F] text-white"
                      : "border-[#00422F] bg-[#00422F] text-white"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300")
                }
              >
                {pill.dot && <span className={`h-2 w-2 rounded-full ${pill.dot}`} />}
                <span>{pill.label}</span>
                <span
                  className={
                    "inline-grid min-w-[22px] place-items-center rounded-full px-2 text-xs " +
                    (active ? "bg-white/15 text-white" : "bg-stone-100 text-stone-600")
                  }
                >
                  {counts[pill.key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Submit a proposal */}
        <div className="mb-6 mt-6 flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4">
          <div>
            <p className="font-sans text-sm font-semibold text-text">Have a new book idea?</p>
            <p className="font-sans text-xs text-text-muted mt-0.5">Submit a new proposal to our editorial team.</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl bg-[#E6674A] px-4 py-2.5 font-sans text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#d35a3f]">
            <Plus className="h-4 w-4" />
            Submit a proposal
          </button>
        </div>

        {/* Sections */}
        {attentionList.length > 0 && (
          <Section title="NEEDS YOUR ATTENTION" dot="bg-orange-500">
            {attentionList.map((p) => (
              <ProposalCard key={p.id} p={p} />
            ))}
          </Section>
        )}
        {progressList.length > 0 && (
          <Section title="IN PROGRESS" dot="bg-sky-500">
            {progressList.map((p) => (
              <ProposalCard key={p.id} p={p} />
            ))}
          </Section>
        )}
        {doneList.length > 0 && (
          <Section title="COMPLETED" dot="bg-emerald-500">
            {doneList.map((p) => (
              <ProposalCard key={p.id} p={p} />
            ))}
          </Section>
        )}
      </div>
    </main>
  );
}

function Section({
  title,
  dot,
  children,
}: {
  title: string;
  dot: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted">{title}</h2>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function ProposalCard({ p }: { p: Proposal }) {
  const cfg = configFor(p);
  const Icon = cfg.Icon;
  return (
    <article
      className={
        "overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md"
      }
    >
      {/* Banner */}
      <div className={`flex items-center justify-between gap-3 border-b border-orange-100 px-5 py-3 ${cfg.bannerTint}`}>
        <div className="flex items-center gap-2 text-sm">
          <span className={`h-2 w-2 rounded-full ${cfg.bannerDot}`} />
          <span className={`font-sans text-sm font-semibold ${cfg.bannerText}`}>{cfg.bannerLabel}</span>
          {cfg.tag && (
            <>
              <span className="text-stone-400">—</span>
              <span className={`font-sans text-xs font-bold tracking-wider ${cfg.bannerText}`}>
                {cfg.tag}
              </span>
            </>
          )}
        </div>
        <span className="font-sans text-xs text-text-muted">{formatDate(p.updatedAt)}</span>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${cfg.iconBg}`}>
            <Icon className={`h-5 w-5 ${cfg.iconColor}`} />
          </span>
          <div className="min-w-0 flex-1">
            <p className={`font-sans text-xs font-semibold ${cfg.eyebrowColor}`}>{cfg.eyebrow}</p>
            <h3 className="mt-0.5 font-serif text-base font-bold leading-snug text-text">{p.title}</h3>
            <p className="mt-1 font-sans text-xs text-text-muted">{p.kind}</p>
          </div>
        </div>

        <p className="mt-4 font-sans text-sm leading-relaxed text-text">{cfg.body}</p>

        {cfg.cta && (
          <Link
            to="/dashboard/author_proposal/$id"
            params={{ id: p.id }}
            className={
              "mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-sans text-sm font-semibold shadow-sm transition-colors " +
              cfg.cta.className
            }
          >
            {cfg.cta.label}
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}

        {cfg.footnote && (
          <p className="mt-4 flex items-start gap-2 font-sans text-xs text-text-muted">
            <span className="mt-0.5">→</span>
            <span>{cfg.footnote}</span>
          </p>
        )}

        {!cfg.cta && !cfg.footnote && (
          <div className="mt-4 border-t border-stone-100 pt-4 text-right">
            <Link
              to="/dashboard/author_proposal/$id"
              params={{ id: p.id }}
              className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 hover:text-emerald-900"
            >
              View full details <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {!cfg.cta && cfg.footnote && (
          <div className="mt-4 border-t border-stone-100 pt-4 text-right">
            <Link
              to="/dashboard/author_proposal/$id"
              params={{ id: p.id }}
              className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 hover:text-emerald-900"
            >
              View full details <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}