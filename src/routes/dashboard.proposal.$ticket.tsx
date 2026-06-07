import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, LogOut, UserRound, Mail, Building2, Calendar, FileText } from "lucide-react";
import cspLogo from "@/assets/csp-logo.png";
import { formatDate, initialsFromName, displayNameFromEmail } from "@/lib/proposals";

const API_BASE = "https://api.cambridgescholars.com/api/proposals";

type Assignment = {
  reviewer_email: string;
  assigned_at: string;
  peer_reviewer_status: string;
  display_status?: string;
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

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("csp.session");
      if (!raw) {
        navigate({ to: "/login" });
        return;
      }
      const session = JSON.parse(raw) as { role: string; email: string; name?: string };
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
        const token = sessionStorage.getItem("csp.token") || "";
        const res = await fetch(`${API_BASE}/${encodeURIComponent(ticket)}`, {
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
    try {
      sessionStorage.removeItem("csp.session");
      sessionStorage.removeItem("csp.token");
    } catch {
      // ignore
    }
    navigate({ to: "/login" });
  };

  const cd = data?.current_data ?? {};
  const title = cd.main_title || ticket;

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
            <section className="mt-6 rounded-2xl border border-stone-200 bg-white px-8 py-7">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="font-sans text-xs uppercase tracking-wider text-stone-500">
                    {data.ticket_number}
                  </p>
                  <h1 className="mt-1 font-serif text-3xl font-bold leading-tight text-stone-900">
                    {title}
                  </h1>
                  {cd.sub_title && (
                    <p className="mt-1 font-sans text-base text-stone-600">{cd.sub_title}</p>
                  )}
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 font-sans text-xs font-medium text-stone-700">
                  {data.status}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-2 font-sans text-sm text-stone-600">
                {cd.corresponding_author_name && (
                  <Meta icon={UserRound} text={cd.corresponding_author_name} />
                )}
                {cd.email && <Meta icon={Mail} text={cd.email} />}
                {cd.institution && <Meta icon={Building2} text={cd.institution} />}
                <Meta icon={Calendar} text={formatDate(data.submitted_at)} />
              </div>
            </section>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
              <div className="space-y-6">
                <Card title="Proposal Details">
                  <Field label="Book Type" value={cd.book_type} />
                  <Field label="Word Count" value={cd.word_count} />
                  <Field label="Expected Completion" value={cd.expected_completion_date} />
                  <Field label="Keywords" value={cd.keywords} />
                  <Field label="Co-authors / Editors" value={cd.co_authors_editors} />
                  <Field label="Figures / Tables" value={cd.figures_tables_count} />
                </Card>

                {cd.short_description && (
                  <Card title="Short Description">
                    <p className="whitespace-pre-line font-sans text-sm leading-relaxed text-stone-700">
                      {cd.short_description}
                    </p>
                  </Card>
                )}

                {cd.detailed_description && (
                  <Card title="Detailed Description">
                    <p className="whitespace-pre-line font-sans text-sm leading-relaxed text-stone-700">
                      {cd.detailed_description}
                    </p>
                  </Card>
                )}

                {cd.table_of_contents && (
                  <Card title="Table of Contents">
                    <p className="whitespace-pre-line font-sans text-sm leading-relaxed text-stone-700">
                      {cd.table_of_contents}
                    </p>
                  </Card>
                )}

                {cd.biography && (
                  <Card title="Author Biography">
                    <p className="whitespace-pre-line font-sans text-sm leading-relaxed text-stone-700">
                      {cd.biography}
                    </p>
                  </Card>
                )}

                {(cd.marketing_info || cd.permissions_required || cd.referees_reviewers ||
                  cd.under_review_elsewhere || cd.additional_info) && (
                  <Card title="Additional Information">
                    <Field label="Marketing Info" value={cd.marketing_info} />
                    <Field label="Permissions Required" value={cd.permissions_required} />
                    <Field label="Suggested Referees" value={cd.referees_reviewers} />
                    <Field label="Under Review Elsewhere" value={cd.under_review_elsewhere} />
                    <Field label="Additional Info" value={cd.additional_info} />
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                {data.assignments && data.assignments.length > 0 && (
                  <Card title="Assignments">
                    <ul className="space-y-3">
                      {data.assignments.map((a, i) => (
                        <li
                          key={`${a.reviewer_email}-${i}`}
                          className="rounded-xl border border-stone-200 p-3"
                        >
                          <p className="font-sans text-sm font-semibold text-stone-900">
                            {a.reviewer_email}
                          </p>
                          <p className="mt-0.5 font-sans text-xs text-stone-500">
                            Assigned {formatDate(a.assigned_at)}
                          </p>
                          <span className="mt-2 inline-flex rounded-full bg-stone-100 px-2.5 py-1 font-sans text-xs font-medium text-stone-700">
                            {a.display_status || a.peer_reviewer_status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {data.timeline && data.timeline.length > 0 && (
                  <Card title="Timeline">
                    <ol className="space-y-3">
                      {data.timeline.map((s) => (
                        <li key={s.stage_name} className="flex items-start gap-3">
                          <span
                            className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                              s.is_completed
                                ? "bg-emerald-500"
                                : s.is_current
                                  ? "bg-amber-500"
                                  : "bg-stone-300"
                            }`}
                          />
                          <div>
                            <p className="font-sans text-sm font-medium text-stone-900">
                              {s.display_name}
                            </p>
                            {(s.completed_at || s.started_at) && (
                              <p className="font-sans text-xs text-stone-500">
                                {formatDate(s.completed_at || s.started_at || "")}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </Card>
                )}

                <Card title="Meta">
                  <Field label="Status" value={data.status} />
                  <Field label="Internal Status" value={data.internal_status} />
                  <Field label="Submitted" value={formatDate(data.submitted_at)} />
                  {data.updated_at && (
                    <Field label="Updated" value={formatDate(data.updated_at)} />
                  )}
                </Card>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Meta({
  icon: Icon,
  text,
}: {
  icon: typeof FileText;
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-4 w-4 text-stone-400" />
      {text}
    </span>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="border-b border-stone-200 px-6 py-4">
        <h2 className="font-serif text-lg font-bold text-stone-900">{title}</h2>
      </div>
      <div className="space-y-3 px-6 py-5">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="font-sans text-xs font-semibold uppercase tracking-wide text-stone-500">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-line font-sans text-sm text-stone-800">{value}</p>
    </div>
  );
}