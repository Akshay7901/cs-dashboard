import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, FileText, Download } from "lucide-react";
import cspLogo from "@/assets/csp-logo.png";
import { initialsFromName, type StatusKey } from "@/lib/proposals";
import { portalLogout, getPortalSession, getPortalToken } from "@/lib/auth";
import { proposalApiFetch } from "@/lib/proposalApi";

export const Route = createFileRoute("/dashboard/author/proposal/$id")({
  head: () => ({ meta: [{ title: "Proposal Details — Author Portal" }] }),
  component: AuthorProposalDetails,
});

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

const STATUS_LABEL: Record<StatusKey, string> = {
  submitted: "Submitted",
  revisions: "Revisions Requested",
  in_review: "Under Review",
  review_returned: "Review Returned",
  major_revisions: "Major Revisions Required",
  question: "Question Raised",
  contract: "Contract Issued",
  signed: "Contract Signed",
  declined: "Declined",
};

const STATUS_TINT: Record<StatusKey, { bg: string; text: string; dot: string }> = {
  submitted: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  revisions: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  in_review: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
  review_returned: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  major_revisions: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  question: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
  contract: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
  signed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  declined: { bg: "bg-stone-100", text: "text-stone-600", dot: "bg-stone-400" },
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatBytes(n?: number) {
  if (!n || n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

type ManuscriptFile = { url: string; filename: string; size_bytes?: number };
type ManuscriptFiles = {
  sampleChapter?: ManuscriptFile;
  additionalFiles?: ManuscriptFile[];
};

type CurrentData = Record<string, unknown> & {
  main_title?: string;
  sub_title?: string;
  book_type?: string;
  subject?: string;
  secondary_subjects?: string[];
  language?: string;
  corresponding_author_name?: string;
  author_first_name?: string;
  author_last_name?: string;
  author_title?: string;
  email?: string;
  institution?: string;
  country?: string;
  biography?: string;
  estimated_word_count?: number;
  estimated_pages?: number | null;
  estimated_completion_date?: string;
  has_illustrations?: boolean;
  illustration_count?: number;
  detailed_description?: string;
  overview?: string;
  table_of_contents?: string;
  key_features?: string;
  unique_selling_points?: string;
  target_audience?: string;
  primary_market?: string;
  competing_titles?: string;
  manuscript_files?: ManuscriptFiles;
};

type ProposalState = {
  ticket: string;
  status?: string;
  displayStatus?: string;
  submittedAt?: string;
  updatedAt?: string;
  cd: CurrentData;
};

function AuthorProposalDetails() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const [proposal, setProposal] = useState<ProposalState | null>(null);
  const [authorName, setAuthorName] = useState<string>("");
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
      if (session.name) setAuthorName(session.name);
    } catch {
      navigate({ to: "/login" });
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const token = getPortalToken();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const res = await proposalApiFetch(`/${encodeURIComponent(id)}`, { headers });
        const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (!res.ok) {
          if (!cancelled) {
            setLoadError((body.error as string) || `Failed to load proposal (${res.status}).`);
            setLoading(false);
          }
          return;
        }
        const cd = (body.current_data as CurrentData) || {};
        if (!cancelled) {
          setProposal({
            ticket: (body.ticket_number as string) || id,
            status: body.status as string | undefined,
            displayStatus: body.display_status as string | undefined,
            submittedAt: body.submitted_at as string | undefined,
            updatedAt: body.updated_at as string | undefined,
            cd,
          });
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLoadError("Network error. Please try again.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, id]);

  const onLogout = async () => {
    await portalLogout();
    navigate({ to: "/login" });
  };

  const displayName = authorName || "Author";
  const initials = initialsFromName(displayName);

  return (
    <main className="min-h-screen bg-[#FAF6EE] font-sans text-stone-900">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={cspLogo} alt="CSP" className="h-10 w-10" />
            <div className="flex items-center gap-3">
              <span className="font-serif text-lg font-semibold text-stone-900">
                Cambridge Scholars Publishing
              </span>
              <span className="text-stone-300">|</span>
              <span className="text-orange-600">Author Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">
                {initials}
              </span>
              <span className="text-sm font-medium">{displayName}</span>
            </div>
            <span className="text-stone-300">|</span>
            <button onClick={onLogout} className="text-sm text-stone-600 hover:text-stone-900">
              Logout
            </button>
          </div>
        </div>
        <div className="h-[3px] bg-orange-500/80" />
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <Link
          to="/dashboard/author"
          className="inline-flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to my proposals
        </Link>

        {loading && (
          <p className="mt-6 text-sm text-stone-500">Loading proposal…</p>
        )}
        {loadError && (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {loadError}
          </div>
        )}

        {!loading && !loadError && proposal && (
          <ProposalBody proposal={proposal} />
        )}
      </div>
    </main>
  );
}

function ProposalBody({ proposal }: { proposal: ProposalState }) {
  const { cd } = proposal;
  const status = normalizeStatus(proposal.status, proposal.displayStatus);
  const tint = STATUS_TINT[status];
  const title = cd.main_title || proposal.ticket;
  const subtitle = cd.sub_title;
  const kind = cd.book_type || "Proposal";
  const files = cd.manuscript_files || {};
  const allFiles: ManuscriptFile[] = [
    ...(files.sampleChapter ? [files.sampleChapter] : []),
    ...(files.additionalFiles || []),
  ];

  return (
    <article className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      {/* Status banner */}
      <div className={`flex items-center justify-between px-6 py-3 ${tint.bg}`}>
        <div className="flex items-center gap-2 text-sm">
          <span className={`h-2 w-2 rounded-full ${tint.dot}`} />
          <span className={`font-semibold ${tint.text}`}>{STATUS_LABEL[status]}</span>
        </div>
        <span className="text-xs text-stone-500">Ref: {proposal.ticket}</span>
      </div>

      <div className="p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          {kind}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold leading-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 font-serif text-lg text-stone-600">{subtitle}</p>
        )}

        {/* Meta grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl bg-stone-50 p-5 sm:grid-cols-2 md:grid-cols-3">
          <Meta label="Submitted" value={formatDate(proposal.submittedAt)} />
          <Meta label="Last updated" value={formatDate(proposal.updatedAt)} />
          <Meta label="Subject" value={cd.subject || "—"} />
          {cd.estimated_word_count !== undefined && (
            <Meta
              label="Estimated length"
              value={`${Number(cd.estimated_word_count).toLocaleString()} words`}
            />
          )}
          {cd.estimated_completion_date && (
            <Meta label="Est. completion" value={formatDate(cd.estimated_completion_date)} />
          )}
          {cd.language && <Meta label="Language" value={cd.language} />}
        </div>

        {/* Author */}
        <Section title="Author">
          <div className="text-[15px] leading-relaxed text-stone-700">
            <p className="font-medium text-stone-900">
              {cd.corresponding_author_name ||
                [cd.author_title, cd.author_first_name, cd.author_last_name]
                  .filter(Boolean)
                  .join(" ") ||
                "—"}
            </p>
            {cd.institution && <p className="text-stone-600">{cd.institution}</p>}
            {cd.country && <p className="text-stone-600">{cd.country}</p>}
            {cd.email && <p className="text-stone-600">{cd.email}</p>}
            {cd.biography && <p className="mt-3 whitespace-pre-wrap">{cd.biography}</p>}
          </div>
        </Section>

        {/* Overview */}
        {(cd.detailed_description || cd.overview) && (
          <Section title="Overview">
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700">
              {cd.detailed_description || cd.overview}
            </p>
          </Section>
        )}

        {/* Key features */}
        {cd.key_features && (
          <Section title="Key features">
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700">
              {cd.key_features}
            </p>
          </Section>
        )}

        {/* Audience */}
        {(cd.target_audience || cd.primary_market) && (
          <Section title="Intended audience">
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700">
              {cd.target_audience || cd.primary_market}
            </p>
          </Section>
        )}

        {/* TOC */}
        {cd.table_of_contents && (
          <Section title="Table of contents">
            <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-stone-700">
              {cd.table_of_contents}
            </pre>
          </Section>
        )}

        {/* Market */}
        {cd.competing_titles && (
          <Section title="Competing titles">
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700">
              {cd.competing_titles}
            </p>
          </Section>
        )}

        {/* Files */}
        {allFiles.length > 0 && (
          <Section title="Supporting documents">
            <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200">
              {allFiles.map((f, i) => (
                <li
                  key={`${f.filename}-${i}`}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-600">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-900">
                        {f.filename}
                      </p>
                      {f.size_bytes ? (
                        <p className="text-xs text-stone-500">{formatBytes(f.size_bytes)}</p>
                      ) : null}
                    </div>
                  </div>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-1 text-sm text-stone-900">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-serif text-lg font-semibold text-stone-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}