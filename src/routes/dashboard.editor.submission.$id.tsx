import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  UserRound,
  Mail,
  Building2,
  MapPin,
  Calendar,
  FileText,
  Download,
  LogOut,
  X,
  CheckCircle2,
  Edit3,
} from "lucide-react";
import cspLogo from "@/assets/csp-logo.png";
import {
  PROPOSALS,
  STATUS_META,
  formatDate,
  initialsFromName,
  displayNameFromEmail,
  type Proposal,
} from "@/lib/proposals";

export const Route = createFileRoute("/dashboard/editor/submission/$id")({
  head: () => ({
    meta: [{ title: "Submission — Editor Portal" }],
  }),
  loader: ({ params }) => {
    const proposal = PROPOSALS.find((p) => p.id === params.id);
    if (!proposal) throw notFound();
    return { proposal };
  },
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-[#FAF6EE] p-10 font-sans text-stone-700">
      <p>Could not load submission: {error.message}</p>
      <Link to="/dashboard/editor" className="mt-4 inline-block text-stone-900 underline">
        Back to dashboard
      </Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-[#FAF6EE] p-10 font-sans text-stone-700">
      <p>Submission not found.</p>
      <Link to="/dashboard/editor" className="mt-4 inline-block text-stone-900 underline">
        Back to dashboard
      </Link>
    </div>
  ),
  component: SubmissionDetail,
});

function SubmissionDetail() {
  const { proposal } = Route.useLoaderData() as { proposal: Proposal };
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("csp.session");
      if (!raw) {
        navigate({ to: "/login" });
        return;
      }
      const session = JSON.parse(raw) as { role: string; email: string };
      if (session.role !== "editor") {
        navigate({ to: "/login" });
        return;
      }
      setUserEmail(session.email);
    } catch {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  const displayName = userEmail ? "James Mitchell" : displayNameFromEmail(userEmail);
  const meta = STATUS_META[proposal.status];

  const onLogout = () => {
    try {
      sessionStorage.removeItem("csp.session");
    } catch {
      // ignore
    }
    navigate({ to: "/login" });
  };

  const onSaveNotes = (e: FormEvent) => {
    e.preventDefault();
    setSavedAt(new Date().toLocaleTimeString());
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] font-sans text-stone-800">
      {/* Top bar (same chrome as dashboard) */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-8 py-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard/editor" className="flex items-center gap-3">
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
          to="/dashboard/editor"
          className="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-[#0E3D2F] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        {/* Title card */}
        <section className="mt-6 rounded-2xl border border-stone-200 bg-white px-8 py-7">
          <div className="flex items-start justify-between gap-6">
            <h1 className="font-serif text-3xl font-bold leading-tight text-stone-900">
              {proposal.title}
            </h1>
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-xs font-medium ${meta.badgeClass}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  proposal.status === "signed" ? "bg-white" : meta.dot
                }`}
              />
              {meta.label}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-2 font-sans text-sm text-stone-600">
            <Meta icon={UserRound} text={proposal.authorName} />
            <Meta icon={Mail} text={proposal.authorEmail} />
            <Meta icon={Building2} text={proposal.authorAffiliation} />
            <Meta icon={MapPin} text={proposal.country} />
            <Meta icon={Calendar} text={formatDate(proposal.submittedAt)} />
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          {/* Main column */}
          <div className="space-y-6">
            {/* Primary Author / Editor */}
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-6 px-7 pt-6">
                <div>
                  <h2 className="font-serif text-xl font-bold text-stone-900">
                    Primary Author / Editor
                  </h2>
                  <p className="mt-1 font-sans text-sm text-stone-500">
                    Institutional affiliation and contact
                  </p>
                </div>
                <div className="flex gap-10 font-sans text-sm">
                  <Stat label="Type" value={proposal.kind} />
                  <Stat label="Words" value={proposal.wordCount.toLocaleString()} />
                  <Stat label="Completion" value={proposal.estCompletion} />
                </div>
              </div>
              <Divider />
              <div className="grid grid-cols-1 gap-6 px-7 py-6 md:grid-cols-3">
                <Field label="Name" value={proposal.authorName} />
                <Field label="Email" value={proposal.authorEmail} />
                <Field label="Institution" value={proposal.authorAffiliation} />
                <Field label="Country" value={proposal.country} />
              </div>
              <Divider />
              <div className="px-7 py-6">
                <p className="font-sans text-xs uppercase tracking-wide text-stone-500">
                  Mailing Address
                </p>
                <p className="mt-2 font-sans text-sm text-stone-800">
                  {proposal.mailingAddress}
                </p>
              </div>
              <Divider />
              <div className="px-7 py-6">
                <p className="font-sans text-xs uppercase tracking-wide text-stone-500">
                  Biography
                </p>
                <p className="mt-2 font-sans text-sm leading-relaxed text-stone-800">
                  {proposal.biography}
                </p>
              </div>
            </Card>

            {/* Manuscript Details */}
            <Card>
              <div className="px-7 pt-6">
                <h2 className="font-serif text-xl font-bold text-stone-900">
                  Manuscript Details
                </h2>
              </div>
              <Divider />
              <div className="grid grid-cols-2 gap-6 px-7 py-6 md:grid-cols-4">
                <Stat label="Word Count" value={proposal.wordCount.toLocaleString()} />
                <Stat label="Illustrations / Tables" value={String(proposal.illustrations)} />
                <Stat label="Non-English Content" value={proposal.nonEnglish ? "Yes" : "No"} />
                <Stat label="Est. Completion" value={proposal.estCompletion} />
              </div>
            </Card>

            {/* Summary & Description */}
            <Card>
              <div className="px-7 pt-6">
                <h2 className="font-serif text-xl font-bold text-stone-900">
                  Summary &amp; Description
                </h2>
                <p className="mt-1 font-sans text-sm text-stone-500">
                  {proposal.discipline} · {proposal.subdiscipline}
                </p>
              </div>
              <Divider />
              <div className="space-y-5 px-7 py-6">
                <Block label="Overview">
                  <p className="font-sans text-sm leading-relaxed text-stone-800">
                    {proposal.overview}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {proposal.keywords.map((k) => (
                      <span
                        key={k}
                        className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 font-sans text-xs text-stone-700"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </Block>
                <Block label="Key Features & Unique Contribution">
                  <p className="font-sans text-sm leading-relaxed text-stone-800">
                    {proposal.keyFeatures}
                  </p>
                </Block>
                <Block label="Intended Audience">
                  <p className="font-sans text-sm leading-relaxed text-stone-800">
                    {proposal.intendedAudience}
                  </p>
                </Block>
              </div>
            </Card>

            {/* Table of Contents */}
            <Card>
              <div className="px-7 pt-6">
                <h2 className="font-serif text-xl font-bold text-stone-900">
                  Table of Contents
                </h2>
                <p className="mt-1 font-sans text-sm text-stone-500">
                  Is this coherently planned?
                </p>
              </div>
              <Divider />
              <div className="px-7 py-6">
                <ol className="space-y-3 rounded-xl bg-[#FAF6EE] p-5">
                  {proposal.tableOfContents.map((chapter, idx) => (
                    <li
                      key={idx}
                      className="font-sans text-sm leading-relaxed text-stone-800"
                    >
                      <span className="mr-1.5 text-stone-500">{idx + 1}.</span>
                      {chapter}
                    </li>
                  ))}
                </ol>
              </div>
            </Card>

            {/* Market & Competition */}
            <Card>
              <div className="px-7 pt-6">
                <h2 className="font-serif text-xl font-bold text-stone-900">
                  Market &amp; Competition
                </h2>
                <p className="mt-1 font-sans text-sm text-stone-500">
                  Commercial viability and competitive landscape
                </p>
              </div>
              <Divider />
              <div className="space-y-5 px-7 py-6">
                <Block label="Why is this book needed?">
                  <p className="font-sans text-sm leading-relaxed text-stone-800">
                    {proposal.whyNeeded}
                  </p>
                </Block>
                <Block label="Competing Titles">
                  <p className="font-sans text-sm leading-relaxed text-stone-800">
                    {proposal.competingTitles}
                  </p>
                </Block>
              </div>
            </Card>

            {/* Author-Suggested Reviewers */}
            <Card>
              <div className="px-7 pt-6">
                <h2 className="font-serif text-xl font-bold text-stone-900">
                  Author-Suggested Reviewers
                </h2>
                <p className="mt-1 font-sans text-sm text-stone-500">
                  Nominated by the author — for consideration only
                </p>
              </div>
              <Divider />
              <ol className="divide-y divide-stone-100">
                {proposal.suggestedReviewers.length === 0 && (
                  <li className="px-7 py-6 font-sans text-sm text-stone-500">
                    No reviewers suggested.
                  </li>
                )}
                {proposal.suggestedReviewers.map((r, idx) => (
                  <li key={idx} className="flex gap-6 px-7 py-5">
                    <span className="font-sans text-sm font-semibold text-stone-500">
                      {idx + 1}.
                    </span>
                    <div>
                      <p className="font-sans text-sm font-semibold text-stone-900">
                        {r.name}
                      </p>
                      <p className="font-sans text-sm text-stone-600">{r.affiliation}</p>
                      <p className="font-sans text-sm text-stone-500">{r.email}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>

            {/* Additional Notes */}
            <Card>
              <div className="px-7 pt-6">
                <h2 className="font-serif text-xl font-bold text-stone-900">
                  Additional Notes
                </h2>
                <p className="mt-1 font-sans text-sm text-stone-500">
                  Copyright, permissions, special considerations
                </p>
              </div>
              <Divider />
              <div className="px-7 py-6">
                <p className="font-sans text-sm leading-relaxed text-stone-800">
                  {proposal.additionalNotes}
                </p>
              </div>
            </Card>

            {/* Supporting Documents */}
            <Card>
              <div className="px-7 pt-6">
                <h2 className="font-serif text-xl font-bold text-stone-900">
                  Supporting Documents
                </h2>
                <p className="mt-1 font-sans text-sm text-stone-500">
                  {proposal.supportingDocs.length} files — click to preview
                </p>
              </div>
              <Divider />
              <ul className="divide-y divide-stone-100">
                {proposal.supportingDocs.map((doc, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-4 px-7 py-4"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-sans text-sm font-semibold text-stone-900">
                          {doc.name}
                        </p>
                        <p className="mt-0.5 font-sans text-xs text-stone-500">
                          {doc.sizeLabel} ·{" "}
                          <span className="text-[#0E3D2F]">Click to preview</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-sans text-sm font-medium text-stone-700 hover:bg-stone-50"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            {/* Editorial Decision */}
            <Card>
              <div className="px-6 pt-6">
                <h2 className="font-serif text-xl font-bold text-stone-900">
                  Editorial Decision
                </h2>
                <p className="mt-2 font-sans text-sm text-stone-600">
                  {proposal.status === "submitted"
                    ? "Awaiting initial assessment"
                    : proposal.decisionSummary}
                </p>
              </div>
              <div className="space-y-3 px-6 pb-6 pt-5">
                {proposal.status === "submitted" ? (
                  <>
                    <button
                      type="button"
                      className="w-full rounded-xl bg-[#1F4D3A] px-4 py-3 text-left font-sans text-sm text-white shadow-sm transition-colors hover:bg-[#173A2C]"
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="h-4 w-4" />
                        Move to Review
                      </span>
                      <span className="mt-1 block text-xs text-white/85">
                        Assign a peer reviewer
                      </span>
                    </button>
                    <button
                      type="button"
                      className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left font-sans text-sm text-amber-900 hover:bg-amber-100"
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <Edit3 className="h-4 w-4" />
                        Request Revisions
                      </span>
                      <span className="mt-1 block text-xs text-amber-800/80">
                        Needs more info before review
                      </span>
                    </button>
                    <button
                      type="button"
                      className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-left font-sans text-sm text-stone-800 hover:bg-stone-50"
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <X className="h-4 w-4" />
                        Decline
                      </span>
                      <span className="mt-1 block text-xs text-stone-500">
                        Not moving forward
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="w-full rounded-xl bg-[#7C3AED] px-4 py-3 text-left font-sans text-sm text-white shadow-sm transition-colors hover:bg-[#6D28D9]"
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <FileText className="h-4 w-4" />
                        Issue Contract
                      </span>
                      <span className="mt-1 block text-xs text-white/85">
                        Send contract &amp; review comments to author
                      </span>
                    </button>
                    <button
                      type="button"
                      className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-left font-sans text-sm text-stone-800 hover:bg-stone-50"
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <X className="h-4 w-4" />
                        Decline
                      </span>
                      <span className="mt-1 block text-xs text-stone-500">
                        Not moving forward
                      </span>
                    </button>
                  </>
                )}
              </div>
            </Card>

            {/* Internal Notes */}
            <Card>
              <div className="px-6 pt-6">
                <h2 className="font-serif text-xl font-bold text-stone-900">
                  Internal Notes
                </h2>
                <p className="mt-1 font-sans text-sm text-stone-500">
                  Not visible to the author
                </p>
              </div>
              <form onSubmit={onSaveNotes} className="space-y-3 px-6 pb-6 pt-4">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  placeholder="Editorial notes, flags, or comments..."
                  className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3 py-2.5 font-sans text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#1A1208] py-2.5 font-sans text-sm font-semibold text-white hover:bg-stone-900"
                >
                  Save Notes
                </button>
                {savedAt && (
                  <p className="text-center font-sans text-xs text-emerald-700">
                    Saved at {savedAt}
                  </p>
                )}
              </form>
            </Card>

            {/* Submission Info */}
            <Card>
              <div className="px-6 pt-6">
                <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Submission Info
                </p>
              </div>
              <div className="space-y-3 px-6 pb-6 pt-4 font-sans text-sm">
                <InfoRow label="Ref" value={proposal.ref} />
                <InfoRow label="Type" value={proposal.kind} />
                <InfoRow label="Submitted" value={formatDate(proposal.submittedAt)} />
                <InfoRow label="Updated" value={formatDate(proposal.updatedAt)} />
              </div>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      {children}
    </section>
  );
}

function Divider() {
  return <hr className="border-stone-100" />;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-sans text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1.5 font-sans text-sm font-semibold text-stone-900">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-sans text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 font-sans text-sm font-semibold text-stone-900">{value}</p>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-sans text-xs font-semibold uppercase tracking-wide text-stone-500">
        {label}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium text-stone-900">{value}</span>
    </div>
  );
}

function Meta({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-4 w-4 text-stone-400" />
      {text}
    </span>
  );
}