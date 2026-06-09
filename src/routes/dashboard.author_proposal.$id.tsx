import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, FileText, Check, X, Calendar } from "lucide-react";
import cspLogo from "@/assets/csp-logo.png";
import { initialsFromName, type StatusKey } from "@/lib/proposals";
import { portalLogout, getPortalSession, getPortalToken } from "@/lib/auth";
import { proposalApiFetch } from "@/lib/proposalApi";

export const Route = createFileRoute("/dashboard/author_proposal/$id")({
  head: () => ({ meta: [{ title: "Proposal Details — Author Portal" }] }),
  component: AuthorProposalDetails,
});

const STATUS_MAP: Record<string, StatusKey> = {
  new: "submitted",
  submitted: "submitted",
  in_review: "in_review",
  peer_review: "in_review",
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
  "peer review": "in_review",
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

function formatMonthYear(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  } catch {
    return iso;
  }
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
  phone?: string;
  secondary_email?: string;
  job_title?: string;
  address?: string;
  institution?: string;
  country?: string;
  biography?: string;
  co_authors?: unknown[];
  co_authors_editors?: string;
  estimated_word_count?: number;
  word_count?: number | string;
  estimated_pages?: number | null;
  estimated_completion_date?: string;
  expected_completion_date?: string;
  has_tables?: boolean;
  has_illustrations?: boolean;
  illustration_count?: number;
  figures_tables_count?: number | string;
  is_previously_published?: boolean;
  under_review_elsewhere?: string | boolean;
  permissions_required?: string | boolean;
  detailed_description?: string;
  short_description?: string;
  overview?: string;
  table_of_contents?: string;
  key_features?: string;
  unique_selling_points?: string;
  target_audience?: string;
  marketing_info?: string;
  additional_info?: string;
  keywords?: string;
  primary_market?: string;
  competing_titles?: string;
  conferences?: string;
  promotional_channels?: string;
  recommended_reviewers?: string;
  referees_reviewers?: string;
  website_reference_number?: string;
  source?: string;
  manuscript_files?: ManuscriptFiles;
};

type TimelineStage = {
  stage_name: string;
  display_name: string;
  completed_at?: string | null;
  started_at?: string | null;
  is_current?: boolean;
  is_completed?: boolean;
};

type ProposalState = {
  ticket: string;
  status?: string;
  displayStatus?: string;
  submittedAt?: string;
  updatedAt?: string;
  internalStatus?: string;
  websiteRef?: string;
  timeline?: TimelineStage[];
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
            internalStatus: body.internal_status as string | undefined,
            timeline: (body.timeline as TimelineStage[]) || [],
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
    <main className="min-h-screen bg-[#F9F7F2] font-sans text-stone-900">
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

      <div className="mx-auto max-w-6xl px-6 py-8">
        <Link
          to="/dashboard/author"
          className="inline-flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to dashboard
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
  const fmtBool = (v?: boolean) => (v ? "Yes" : "No");
  const authorFullName =
    cd.corresponding_author_name ||
    [cd.author_title, cd.author_first_name, cd.author_last_name]
      .filter(Boolean)
      .join(" ") ||
    "—";

  return (
    <>
      {/* Hero card: title + status pill + stepper */}
      <section id="section-hero" className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm md:p-8 scroll-mt-24">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-serif text-3xl font-bold leading-tight text-stone-900 md:text-4xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 font-serif text-lg text-stone-600">{subtitle}</p>
            )}
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-stone-500">
              <Calendar className="h-4 w-4" />
              Submitted {formatDate(proposal.submittedAt)}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-2 rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold ${tint.bg} ${tint.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${tint.dot}`} />
            {STATUS_LABEL[status]}
          </span>
        </div>

        <ProgressStepper timeline={proposal.timeline} status={status} />
      </section>

      {/* Tabs */}
      <div className="mt-6 inline-flex rounded-xl border border-stone-200 bg-white p-1 shadow-sm">
        <button className="rounded-lg bg-[#0f3a2e] px-5 py-2 text-sm font-semibold text-white">
          Proposal Details
        </button>
        <button className="rounded-lg px-5 py-2 text-sm font-semibold text-stone-600 hover:text-stone-900">
          Status History
        </button>
      </div>

      {/* Stats row + Documents sidebar */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Type" value={kind} />
          <StatCard
            label="Word Count"
            value={
              cd.estimated_word_count
                ? Number(cd.estimated_word_count).toLocaleString()
                : "—"
            }
          />
          <StatCard
            label="Illustrations"
            value={
              cd.has_illustrations
                ? String(cd.illustration_count ?? "Yes")
                : "No"
            }
          />
          <StatCard
            label="Completion"
            value={formatMonthYear(cd.estimated_completion_date)}
          />
        </div>

        <aside id="section-documents" className="row-span-2 scroll-mt-24 overflow-hidden rounded-2xl border border-stone-200 bg-stone-50/60">
          <h3 className="px-5 pt-5 pb-4 font-serif text-lg font-semibold text-stone-900">Documents</h3>
          {allFiles.length === 0 ? (
            <p className="border-t border-stone-200 px-5 py-4 text-sm text-stone-500">No documents uploaded.</p>
          ) : (
            <ul className="space-y-3 border-t border-stone-200 p-5">
              {allFiles.map((f, i) => (
                <li key={`${f.filename}-${i}`}>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-start gap-3 rounded-lg border border-transparent p-2 hover:border-stone-200 hover:bg-white"
                  >
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-900 group-hover:underline">
                        {f.filename}
                      </p>
                      {f.size_bytes ? (
                        <p className="text-xs text-stone-500">{formatBytes(f.size_bytes)}</p>
                      ) : null}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Main content stack (under stats, beside Documents) */}
        <div className="space-y-5">
          {/* Primary author card */}
          <Card title="Primary Author / Editor" id="section-author">
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              <Field label="Name" value={authorFullName} />
              <Field label="Email" value={cd.email || "—"} />
              {cd.institution && <Field label="Institution" value={cd.institution} />}
              {cd.country && <Field label="Country" value={cd.country} />}
            </div>
            {cd.address && (
              <div className="mt-6 border-t border-stone-200 pt-5">
                <p className="text-xs font-medium uppercase tracking-wider text-amber-800/80">
                  Mailing Address
                </p>
                <p className="mt-1 text-[15px] text-stone-800">{cd.address}</p>
              </div>
            )}
            {cd.biography && (
              <div className="mt-5 border-t border-stone-200 pt-5">
                <p className="text-xs font-medium uppercase tracking-wider text-amber-800/80">
                  Biography
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700">
                  {cd.biography}
                </p>
              </div>
            )}
          </Card>

          {/* Summary & Description */}
          {(cd.detailed_description ||
            cd.overview ||
            cd.key_features ||
            cd.target_audience) && (
            <Card title="Summary & Description" id="section-summary">
              <p className="-mt-2 text-sm text-amber-800/80">
                {[cd.subject, cd.secondary_subjects?.join(" / ")]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </p>
              <div className="mt-5 space-y-4">
                {(cd.detailed_description || cd.overview) && (
                  <SubCard label="Overview">
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700">
                      {cd.detailed_description || cd.overview}
                    </p>
                    {cd.secondary_subjects && cd.secondary_subjects.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {cd.secondary_subjects.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-amber-100/70 px-3 py-1 text-xs font-medium text-amber-900"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </SubCard>
                )}
                {cd.key_features && (
                  <SubCard label="Key Features & Unique Contribution">
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700">
                      {cd.key_features}
                    </p>
                  </SubCard>
                )}
                {cd.unique_selling_points && (
                  <SubCard label="Unique Selling Points">
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700">
                      {cd.unique_selling_points}
                    </p>
                  </SubCard>
                )}
                {cd.target_audience && (
                  <SubCard label="Intended Audience">
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700">
                      {cd.target_audience}
                    </p>
                  </SubCard>
                )}
                {cd.language && (
                  <SubCard label="Contains Non-English Content">
                    <p className="text-[15px] text-stone-900">
                      {cd.language.toLowerCase() === "english" ? "No" : `Yes (${cd.language})`}
                    </p>
                  </SubCard>
                )}
              </div>
            </Card>
          )}

          {/* TOC */}
          {cd.table_of_contents && (
            <Card title="Table of Contents" id="section-toc">
              <TocList raw={cd.table_of_contents} />
            </Card>
          )}

          {/* Market & Competition */}
          {(cd.unique_selling_points || cd.competing_titles || cd.primary_market) && (
            <Card title="Market & Competition" id="section-market">
              <div className="space-y-4">
                {cd.primary_market && (
                  <SubCard label="Primary Market">
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700">
                      {cd.primary_market}
                    </p>
                  </SubCard>
                )}
                {cd.unique_selling_points && (
                  <SubCard label="Why is this book needed?">
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700">
                      {cd.unique_selling_points}
                    </p>
                  </SubCard>
                )}
                {cd.competing_titles && (
                  <SubCard label="Competing Titles">
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700">
                      {cd.competing_titles}
                    </p>
                  </SubCard>
                )}
              </div>
            </Card>
          )}

          {/* Suggested reviewers */}
          {cd.recommended_reviewers && (
            <Card title="Suggested Reviewers" subtitle="Nominated for consideration" id="section-reviewers">
              <ReviewersList raw={cd.recommended_reviewers} />
            </Card>
          )}

          {/* Manuscript details / extras */}
          <Card title="Manuscript Details" id="section-manuscript">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <MiniStat label="Has tables" value={fmtBool(cd.has_tables)} />
              <MiniStat
                label="Illustrations"
                value={
                  cd.has_illustrations
                    ? cd.illustration_count
                      ? `Yes (${cd.illustration_count})`
                      : "Yes"
                    : "No"
                }
              />
              <MiniStat
                label="Previously published"
                value={fmtBool(cd.is_previously_published)}
              />
            </div>
          </Card>

          {/* Additional notes */}
          {(cd.conferences || cd.promotional_channels) && (
            <Card title="Additional Notes" subtitle="Copyright, permissions, special considerations" id="section-notes">
              <div className="space-y-4">
                {cd.conferences && (
                  <SubCard label="Conferences">
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700">
                      {cd.conferences}
                    </p>
                  </SubCard>
                )}
                {cd.promotional_channels && (
                  <SubCard label="Promotional Channels">
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700">
                      {cd.promotional_channels}
                    </p>
                  </SubCard>
                )}
              </div>
            </Card>
          )}

          {/* Catch-all: every other field from the API */}
          <ExtraFieldsCard cd={cd} />
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50/60 px-4 py-5 text-center">
      <p className="text-xs font-medium uppercase tracking-wider text-amber-800/80">{label}</p>
      <p className="mt-2 font-serif text-xl font-bold text-stone-900">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/60 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-amber-800/80">{label}</p>
      <p className="mt-1 text-sm font-semibold text-stone-900">{value}</p>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
  id,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-24 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="px-6 pb-5 pt-6 md:px-7">
        <h2 className="font-serif text-xl font-bold text-stone-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-amber-800/80">{subtitle}</p>}
      </div>
      <div className="border-t border-stone-200 px-6 py-6 md:px-7">{children}</div>
    </section>
  );
}

function SubCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-stone-200 pt-5 first:border-t-0 first:pt-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-800/80">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-amber-800/80">{label}</p>
      <p className="mt-1 text-[15px] font-semibold text-stone-900">{value}</p>
    </div>
  );
}

function TocList({ raw }: { raw: string }) {
  const items = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*\d+[\).\s-]*/, "").trim())
    .filter(Boolean);
  if (items.length === 0) return null;
  return (
    <ol className="space-y-3 text-[15px] text-stone-800">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="font-semibold text-amber-800/80">{i + 1}.</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function ReviewersList({ raw }: { raw: string }) {
  const blocks = raw
    .split(/\n\s*\n|;\s*/)
    .map((b) => b.trim())
    .filter(Boolean);
  return (
    <ol>
      {blocks.map((block, i) => {
        const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        return (
          <li key={i} className="flex gap-4 border-t border-stone-200 py-4 first:border-t-0 first:pt-0">
            <span className="font-serif text-lg font-bold text-amber-800/80">{i + 1}.</span>
            <div className="space-y-0.5 text-[15px]">
              {lines.map((l, j) => (
                <p
                  key={j}
                  className={
                    j === 0
                      ? "font-semibold text-stone-900"
                      : "text-stone-600"
                  }
                >
                  {l}
                </p>
              ))}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// Keys already rendered elsewhere on the page — exclude from the catch-all card
const HANDLED_KEYS = new Set<string>([
  "main_title",
  "sub_title",
  "subtitle",
  "book_type",
  "subject",
  "secondary_subjects",
  "language",
  "corresponding_author_name",
  "author_first_name",
  "author_last_name",
  "author_title",
  "email",
  "phone",
  "address",
  "institution",
  "country",
  "biography",
  "estimated_word_count",
  "estimated_completion_date",
  "has_tables",
  "has_illustrations",
  "illustration_count",
  "is_previously_published",
  "detailed_description",
  "overview",
  "table_of_contents",
  "key_features",
  "unique_selling_points",
  "target_audience",
  "primary_market",
  "competing_titles",
  "conferences",
  "promotional_channels",
  "recommended_reviewers",
  "manuscript_files",
  "website_reference_number",
  "source",
]);

function humanizeKey(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isEmptyValue(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v as object).length === 0;
  return false;
}

function renderValue(v: unknown): React.ReactNode {
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return v.toLocaleString();
  if (typeof v === "string") {
    return <span className="whitespace-pre-wrap">{v}</span>;
  }
  if (Array.isArray(v)) {
    if (v.every((x) => typeof x === "string" || typeof x === "number")) {
      return (
        <div className="flex flex-wrap gap-2">
          {(v as Array<string | number>).map((t, i) => (
            <span
              key={i}
              className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700"
            >
              {String(t)}
            </span>
          ))}
        </div>
      );
    }
    return (
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-stone-50 p-3 text-xs text-stone-700">
        {JSON.stringify(v, null, 2)}
      </pre>
    );
  }
  if (typeof v === "object") {
    return (
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-stone-50 p-3 text-xs text-stone-700">
        {JSON.stringify(v, null, 2)}
      </pre>
    );
  }
  return String(v);
}

function ExtraFieldsCard({ cd }: { cd: CurrentData }) {
  const entries = Object.entries(cd).filter(([, v]) => !isEmptyValue(v));
  if (entries.length === 0) return null;
  return (
    <Card title="Full Submission Data" subtitle="All fields returned by the API" id="section-extra">
      <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
        {entries.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-wider text-amber-800/80">
              {humanizeKey(k)}
            </dt>
            <dd className="mt-1 text-[15px] text-stone-800">{renderValue(v)}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function ProgressStepper({
  timeline,
  status,
}: {
  timeline?: TimelineStage[];
  status: StatusKey;
}) {
  const declined = status === "declined";

  function anchorFor(stageName?: string, label?: string): string {
    const s = `${stageName || ""} ${label || ""}`.toLowerCase();
    if (/submit|new|receiv/.test(s)) return "section-hero";
    if (/review|peer|assess/.test(s)) return "section-reviewers";
    if (/contract|sign|approv|lock/.test(s)) return "section-documents";
    if (/decision|editor/.test(s)) return "section-summary";
    if (/revis|info|question|quer/.test(s)) return "section-summary";
    if (/declin|reject/.test(s)) return "section-hero";
    if (/final|publish|product/.test(s)) return "section-documents";
    return "section-hero";
  }

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Prefer the timeline returned by the API; fall back to a 4-stage default.
  const stages: { label: string; done: boolean; current: boolean; failed: boolean; anchor: string }[] =
    timeline && timeline.length > 0
      ? timeline.map((t) => {
          const isDeclineStage = /declin|reject/i.test(t.stage_name) || /declin|reject/i.test(t.display_name);
          return {
            label: t.display_name || t.stage_name,
            done: !!t.is_completed,
            current: !!t.is_current,
            failed: isDeclineStage && (!!t.is_completed || !!t.is_current),
            anchor: anchorFor(t.stage_name, t.display_name),
          };
        })
      : [
          { label: "Submitted", done: true, current: false, failed: false, anchor: "section-hero" },
          {
            label: "Peer Review",
            done: ["review_returned", "contract", "signed", "declined", "major_revisions"].includes(status),
            current: status === "in_review",
            failed: false,
            anchor: "section-reviewers",
          },
          {
            label: "Decision",
            done: ["contract", "signed", "declined"].includes(status),
            current: status === "review_returned",
            failed: false,
            anchor: "section-summary",
          },
          {
            label: declined ? "Declined" : status === "signed" ? "Signed" : status === "contract" ? "Contract" : "Decision",
            done: ["signed", "declined"].includes(status),
            current: status === "contract",
            failed: declined,
            anchor: "section-documents",
          },
        ];

  return (
    <div className="mt-8">
      <div className="flex items-start">
        {stages.map((s, i) => (
          <div key={s.label} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {i > 0 && (
                <div
                  className={`h-[3px] flex-1 ${
                    stages[i - 1].done ? "bg-[#0f3a2e]" : "bg-stone-200"
                  }`}
                />
              )}
              <button
                type="button"
                onClick={() => scrollTo(s.anchor)}
                title={`Jump to ${s.label}`}
                className={
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-300 " +
                  (s.failed
                    ? "bg-stone-300 text-white"
                    : s.done
                      ? "bg-[#0f3a2e] text-white"
                      : s.current
                        ? "bg-amber-500 text-white ring-4 ring-amber-100"
                        : "bg-stone-200 text-stone-500")
                }
              >
                {s.failed ? (
                  <X className="h-4 w-4" />
                ) : s.done ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-semibold">{i + 1}</span>
                )}
              </button>
              {i < stages.length - 1 && (
                <div
                  className={`h-[3px] flex-1 ${
                    s.done ? "bg-[#0f3a2e]" : "bg-stone-200"
                  }`}
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => scrollTo(s.anchor)}
              className={
                "mt-2 text-center text-sm font-medium hover:underline focus:outline-none " +
                (s.current ? "text-amber-700" : s.done ? "text-stone-900" : "text-stone-500")
              }
            >
              {s.label}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}