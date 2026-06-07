import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Check, LogOut, SquarePen, X as XIcon } from "lucide-react";
import cspLogo from "@/assets/csp-logo.png";
import { clearPortalSession, getPortalSession, getPortalToken } from "@/lib/auth";
import { formatDate, initialsFromName, displayNameFromEmail } from "@/lib/proposals";
import { proposalApiFetch } from "@/lib/proposalApi";

type Assignment = {
  reviewer_email: string;
  assigned_at: string;
  peer_reviewer_status: string;
  display_status?: string;
};

type PeerReviewer = {
  id: number;
  name: string;
  email: string;
  assigned_proposals_count?: number;
};

type TimelineStage = {
  stage_name: string;
  display_name: string;
  completed_at?: string | null;
  started_at?: string | null;
  is_current?: boolean;
  is_completed?: boolean;
};

type ProposalDetail = {
  ticket_number: string;
  status: string;
  internal_status?: string;
  submitted_at: string;
  updated_at?: string;
  current_data: Record<string, string | undefined>;
  assignments?: Assignment[];
  timeline?: TimelineStage[];
};

export const Route = createFileRoute("/dashboard/proposal/$ticket")({
  head: () => ({ meta: [{ title: "Proposal Details — Editor Portal" }] }),
  component: ProposalDetailPage,
});

function ProposalDetailPage() {
  const { ticket } = Route.useParams();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [data, setData] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [reviewersOpen, setReviewersOpen] = useState(false);
  const [reviewers, setReviewers] = useState<PeerReviewer[]>([]);
  const [reviewersLoading, setReviewersLoading] = useState(false);
  const [reviewersError, setReviewersError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const session = getPortalSession();
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      setUserEmail(session.email);
      setUserName(session.name || "");
    } catch {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getPortalToken();
        const res = await proposalApiFetch(`/${encodeURIComponent(ticket)}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (cancelled) return;
        if (!res.ok) {
          setError((body.error as string) || `Failed to load proposal (${res.status}).`);
          return;
        }
        setData(body as unknown as ProposalDetail);
      } catch {
        if (!cancelled) setError("Network error. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [ticket]);

  const displayName = userName || displayNameFromEmail(userEmail);

  const onLogout = () => {
    clearPortalSession();
    navigate({ to: "/login" });
  };

  const cd = data?.current_data ?? {};
  const title = cd.main_title || ticket;

  const keywords = useMemo(
    () =>
      (cd.keywords || "")
        .split(/[,;]/)
        .map((k) => k.trim())
        .filter(Boolean),
    [cd.keywords],
  );

  const tocItems = useMemo(
    () =>
      (cd.table_of_contents || "")
        .split(/\n+/)
        .map((l) => l.replace(/^\s*\d+[.)]\s*/, "").trim())
        .filter(Boolean),
    [cd.table_of_contents],
  );

  const suggestedReviewers = useMemo(
    () =>
      (cd.referees_reviewers || "")
        .split(/\n+/)
        .map((l) => l.trim())
        .filter(Boolean),
    [cd.referees_reviewers],
  );

  const assignedReviewer = data?.assignments?.[0];

  const onSaveNotes = (e: FormEvent) => {
    e.preventDefault();
    setSavedAt(new Date().toLocaleTimeString());
  };

  const openReviewers = async () => {
    setReviewersOpen(true);
    setReviewersLoading(true);
    setReviewersError(null);
    try {
      const token = getPortalToken();
      const res = await proposalApiFetch("/users/peer-reviewers", {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setReviewersError((body.error as string) || `Failed to load reviewers (${res.status}).`);
        return;
      }
      setReviewers((body.peer_reviewers as PeerReviewer[]) || []);
    } catch {
      setReviewersError("Network error. Please try again.");
    } finally {
      setReviewersLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] font-sans text-stone-800">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-8 py-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard/decision_reviewer" className="flex items-center gap-3">
              <img src={cspLogo} alt="CSP" width={32} height={32} />
              <span className="font-serif text-xl font-bold text-stone-900">
                Cambridge Scholars Publishing
              </span>
            </Link>
            <span className="mx-2 h-5 w-px bg-stone-300" />
            <span className="font-sans text-base text-stone-700">Editor Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0E3D2F] font-sans text-xs font-semibold text-white">
              {initialsFromName(displayName)}
            </div>
            <span className="font-sans text-sm font-medium text-stone-800">{displayName}</span>
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

      <main className="mx-auto max-w-7xl px-8 py-8">
        <Link
          to="/dashboard/decision_reviewer"
          className="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-[#0E3D2F] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        {loading && (
          <p className="mt-10 text-center font-sans text-sm text-stone-500">
            Loading proposal details…
          </p>
        )}
        {error && !loading && (
          <p className="mt-10 text-center font-sans text-sm text-red-600">{error}</p>
        )}

        {data && !loading && (
          <>
            {/* Title hero card */}
            <section className="mt-6 rounded-2xl border border-stone-200 bg-white px-8 py-7">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h1 className="font-serif text-3xl font-bold leading-tight text-stone-900">
                    {title}
                  </h1>
                  {cd.sub_title && (
                    <p className="mt-2 font-sans text-base font-medium text-amber-700">
                      {cd.sub_title}
                    </p>
                  )}
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 font-sans text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  {data.status}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-2 font-sans text-sm text-stone-600">
                {cd.corresponding_author_name && (
                  <MetaItem icon="user" text={cd.corresponding_author_name} />
                )}
                {cd.email && <MetaItem icon="mail" text={cd.email} />}
                {cd.institution && <MetaItem icon="building" text={cd.institution} />}
                <MetaItem icon="calendar" text={formatDate(data.submitted_at)} />
              </div>
            </section>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
              {/* Main column */}
              <div className="space-y-6">
                {/* Primary Author */}
                <Card>
                  <CardHeader
                    title="Primary Author / Editor"
                    subtitle="Institutional affiliation and contact"
                    right={
                      <div className="flex items-start gap-7 font-sans text-sm">
                        {cd.book_type && (
                          <Stat label="Type" value={cd.book_type} />
                        )}
                        {cd.word_count && (
                          <Stat label="Words" value={formatNumber(cd.word_count)} />
                        )}
                        {cd.expected_completion_date && (
                          <Stat label="Completion" value={cd.expected_completion_date} />
                        )}
                      </div>
                    }
                  />
                  <div className="divide-y divide-stone-300">
                    <div className="grid grid-cols-1 gap-5 px-7 py-6 sm:grid-cols-3">
                      <DataField label="Name" value={cd.corresponding_author_name} />
                      <DataField label="Email" value={cd.email} />
                      <DataField label="Institution" value={cd.institution} />
                      <DataField label="Job Title" value={cd.job_title} />
                      <DataField label="Secondary Email" value={cd.secondary_email} />
                    </div>
                    {cd.address && (
                      <div className="px-7 py-6">
                        <DataField label="Mailing Address" value={cd.address} />
                      </div>
                    )}
                    {cd.biography && (
                      <div className="px-7 py-6">
                        <DataField label="Biography" value={cd.biography} multiline />
                      </div>
                    )}
                  </div>
                </Card>

                {/* Additional Authors */}
                {cd.co_authors_editors && (
                  <Card>
                    <CardHeader
                      title="Additional Authors / Editors"
                      subtitle="Co-authors and contributors"
                    />
                    <div className="px-7 py-6">
                      <p className="whitespace-pre-line font-sans text-sm leading-relaxed text-stone-700">
                        {cd.co_authors_editors}
                      </p>
                    </div>
                  </Card>
                )}

                {/* Manuscript Details */}
                <Card>
                  <CardHeader title="Manuscript Details" />
                  <div className="grid grid-cols-2 gap-6 px-7 py-6 sm:grid-cols-4">
                    <Stat label="Word Count" value={formatNumber(cd.word_count) || "—"} large />
                    <Stat
                      label="Illustrations / Tables"
                      value={cd.figures_tables_count || "—"}
                      large
                    />
                    <Stat
                      label="Under Review Elsewhere"
                      value={cd.under_review_elsewhere || "—"}
                      large
                    />
                    <Stat
                      label="Est. Completion"
                      value={cd.expected_completion_date || "—"}
                      large
                    />
                  </div>
                </Card>

                {/* Summary & Description */}
                {(cd.short_description || cd.detailed_description || keywords.length > 0) && (
                  <Card>
                    <CardHeader
                      title="Summary & Description"
                      subtitle="Overview, key features and audience"
                    />
                    <div className="space-y-6 px-7 py-6">
                      {cd.short_description && (
                        <div>
                          <SectionLabel>Overview</SectionLabel>
                          <p className="mt-2 whitespace-pre-line font-sans text-sm leading-relaxed text-stone-700">
                            {cd.short_description}
                          </p>
                          {keywords.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {keywords.map((k) => (
                                <span
                                  key={k}
                                  className="inline-flex rounded-full bg-amber-50 px-3 py-1 font-sans text-xs font-medium text-amber-800 ring-1 ring-amber-200"
                                >
                                  {k}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {cd.detailed_description && (
                        <div className="-mx-7 border-t border-stone-300 px-7 pt-5">
                          <SectionLabel>Key Features & Unique Contribution</SectionLabel>
                          <p className="mt-2 whitespace-pre-line font-sans text-sm leading-relaxed text-stone-700">
                            {cd.detailed_description}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Table of Contents */}
                {tocItems.length > 0 && (
                  <Card>
                    <CardHeader
                      title="Table of Contents"
                      subtitle="Is this coherently planned?"
                    />
                    <div className="px-7 py-6">
                      <ol className="space-y-3 rounded-xl bg-stone-50 px-6 py-5 font-sans text-sm text-stone-800">
                        {tocItems.map((item, i) => (
                          <li key={`${i}-${item}`} className="flex gap-3">
                            <span className="text-stone-500">{i + 1}.</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </Card>
                )}

                {/* Market & Competition */}
                {cd.marketing_info && (
                  <Card>
                    <CardHeader
                      title="Market & Competition"
                      subtitle="Commercial viability and competitive landscape"
                    />
                    <div className="space-y-6 px-7 py-6">
                      <div>
                        <SectionLabel>Why is this book needed?</SectionLabel>
                        <p className="mt-2 whitespace-pre-line font-sans text-sm leading-relaxed text-stone-700">
                          {cd.marketing_info}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Author-Suggested Reviewers */}
                {suggestedReviewers.length > 0 && (
                  <Card>
                    <CardHeader
                      title="Author-Suggested Reviewers"
                      subtitle="Nominated by the author — for consideration only"
                    />
                    <ol className="divide-y divide-stone-100 px-2 py-2">
                      {suggestedReviewers.map((r, i) => (
                        <li key={`${i}-${r}`} className="flex gap-5 px-5 py-4">
                          <span className="font-sans text-sm font-medium text-stone-500">
                            {i + 1}.
                          </span>
                          <p className="whitespace-pre-line font-sans text-sm text-stone-800">
                            {r}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </Card>
                )}

                {/* Additional Notes */}
                {(cd.additional_info || cd.permissions_required) && (
                  <Card>
                    <CardHeader
                      title="Additional Notes"
                      subtitle="Copyright, permissions, special considerations"
                    />
                    <div className="space-y-4 px-7 py-6">
                      {cd.additional_info && (
                        <p className="whitespace-pre-line font-sans text-sm leading-relaxed text-stone-700">
                          {cd.additional_info}
                        </p>
                      )}
                      {cd.permissions_required && (
                        <DataField
                          label="Permissions Required"
                          value={cd.permissions_required}
                          multiline
                        />
                      )}
                    </div>
                  </Card>
                )}

                {/* Supporting Documents (placeholder — API does not return files) */}
                <Card>
                  <CardHeader
                    title="Supporting Documents"
                    subtitle="Files attached to this proposal"
                  />
                  <div className="px-7 py-8 text-center font-sans text-sm text-stone-500">
                    No supporting documents available.
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <aside className="space-y-6">
                {/* Editorial Decision */}
                <Card>
                  <div className="px-6 py-5">
                    <h2 className="font-serif text-xl font-bold text-stone-900">
                      Editorial Decision
                    </h2>
                    <p className="mt-1 font-sans text-sm text-stone-500">
                      {assignedReviewer ? "With peer reviewer" : "Awaiting initial assessment"}
                    </p>
                  </div>
                  {assignedReviewer && (
                    <div className="mx-5 mb-4 rounded-xl bg-indigo-50/60 px-4 py-4 ring-1 ring-indigo-100">
                      <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
                        Assigned Reviewer
                      </p>
                      <p className="mt-2 font-sans text-sm font-semibold text-stone-900">
                        {displayNameFromEmail(assignedReviewer.reviewer_email)}
                      </p>
                      <p className="font-sans text-xs text-stone-500">
                        {assignedReviewer.reviewer_email}
                      </p>
                      <p className="mt-2 font-sans text-xs text-stone-500">
                        Assigned {formatDate(assignedReviewer.assigned_at)}
                      </p>
                      <span className="mt-3 inline-flex rounded-full bg-white px-2.5 py-1 font-sans text-xs font-medium text-stone-700 ring-1 ring-stone-200">
                        {assignedReviewer.display_status || assignedReviewer.peer_reviewer_status}
                      </span>
                    </div>
                  )}
                  <div className="space-y-3 border-t border-stone-300 px-5 py-4">
                    <button
                      type="button"
                      className="flex w-full items-start gap-3 rounded-xl bg-[#0E3D2F] px-4 py-3 text-left text-white transition-colors hover:bg-[#0a2f24]"
                    >
                      <Check className="mt-0.5 h-4 w-4 text-white" />
                      <div>
                        <p className="font-sans text-sm font-semibold">Move to Review</p>
                        <p className="font-sans text-xs text-white/80">Assign a peer reviewer</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-left transition-colors hover:bg-amber-50"
                    >
                      <SquarePen className="mt-0.5 h-4 w-4 text-amber-700" />
                      <div>
                        <p className="font-sans text-sm font-semibold text-amber-900">Request Revisions</p>
                        <p className="font-sans text-xs text-amber-700/80">Needs more info before review</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-start gap-3 rounded-xl border border-stone-200 px-4 py-3 text-left transition-colors hover:border-red-300 hover:bg-red-50/50"
                    >
                      <XIcon className="mt-0.5 h-4 w-4 text-stone-500" />
                      <div>
                        <p className="font-sans text-sm font-semibold text-stone-900">Decline</p>
                        <p className="font-sans text-xs text-stone-500">Not moving forward</p>
                      </div>
                    </button>
                  </div>
                </Card>

                {/* Internal Notes */}
                <Card>
                  <div className="px-6 py-5">
                    <h2 className="font-serif text-xl font-bold text-stone-900">
                      Internal Notes
                    </h2>
                    <p className="mt-1 font-sans text-sm text-stone-500">
                      Not visible to the author
                    </p>
                  </div>
                  <form onSubmit={onSaveNotes} className="space-y-3 px-5 pb-5">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Editorial notes, flags, or comments..."
                      rows={5}
                      className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3.5 py-3 font-sans text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-100"
                    />
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-[#3D2A1E] px-4 py-3 font-sans text-sm font-semibold text-white hover:bg-[#2c1e15]"
                    >
                      Save Notes
                    </button>
                    {savedAt && (
                      <p className="text-center font-sans text-xs text-stone-500">
                        Saved at {savedAt}
                      </p>
                    )}
                  </form>
                </Card>

                {/* Submission Info */}
                <Card>
                  <div className="px-6 py-5">
                    <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                      Submission Info
                    </p>
                  </div>
                  <dl className="divide-y divide-stone-100 px-6 pb-5 font-sans text-sm">
                    <InfoRow label="Ref" value={data.ticket_number} />
                    {cd.book_type && <InfoRow label="Type" value={cd.book_type} />}
                    <InfoRow label="Submitted" value={formatDate(data.submitted_at)} />
                    {data.updated_at && (
                      <InfoRow label="Updated" value={formatDate(data.updated_at)} />
                    )}
                    {data.internal_status && (
                      <InfoRow label="Stage" value={data.internal_status} />
                    )}
                  </dl>
                </Card>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function MetaItem({ icon, text }: { icon: "user" | "mail" | "building" | "calendar"; text: string }) {
  const paths: Record<typeof icon, string> = {
    user:
      "M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0",
    mail: "M4 6h16v12H4z M4 6l8 7 8-7",
    building: "M4 21V5a2 2 0 012-2h8a2 2 0 012 2v16M9 9h2M9 13h2M9 17h2",
    calendar:
      "M4 7h16M4 7v12a2 2 0 002 2h12a2 2 0 002-2V7M4 7l1-3h14l1 3M9 11h6M9 15h6",
  };
  return (
    <span className="inline-flex items-center gap-2 text-stone-600">
      <svg
        className="h-4 w-4 text-stone-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={paths[icon]} />
      </svg>
      {text}
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      {children}
    </section>
  );
}

function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-stone-300 px-7 py-5">
      <div>
        <h2 className="font-serif text-xl font-bold text-stone-900">{title}</h2>
        {subtitle && (
          <p className="mt-1 font-sans text-sm text-stone-500">{subtitle}</p>
        )}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stone-500">
      {children}
    </p>
  );
}

function DataField({
  label,
  value,
  multiline,
}: {
  label: string;
  value?: string;
  multiline?: boolean;
}) {
  if (!value) return null;
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <p
        className={`mt-1.5 font-sans text-sm font-medium text-stone-900 ${
          multiline ? "whitespace-pre-line font-normal text-stone-700 leading-relaxed" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  large,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div>
      <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stone-500">
        {label}
      </p>
      <p
        className={`mt-1 font-sans font-semibold text-stone-900 ${
          large ? "text-base" : "text-sm"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="font-sans text-sm text-stone-500">{label}</dt>
      <dd className="font-sans text-sm font-semibold text-stone-900">{value}</dd>
    </div>
  );
}

function formatNumber(s?: string): string {
  if (!s) return "";
  const n = Number(s.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n === 0) return s;
  return n.toLocaleString();
}