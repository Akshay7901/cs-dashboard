import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ChevronRight,
  LogOut,
  User2,
  FileText,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import cspLogo from "@/assets/csp-logo.png";
import { initialsFromName, displayNameFromEmail } from "@/lib/proposals";

export const Route = createFileRoute("/dashboard/reviewer")({
  head: () => ({ meta: [{ title: "Reviewer Portal — Your Reviews" }] }),
  component: ReviewerDashboard,
});

type ReviewStatus = "pending" | "completed";

interface ReviewItem {
  id: string;
  proposalId: string;
  subject: string;
  kind: string;
  title: string;
  subtitle?: string;
  authorName: string;
  authorAffiliation: string;
  wordCount: string;
  assignedAt: string;
  completedAt?: string;
  decision?: "accept" | "minor" | "major" | "reject";
  abstract: string;
  status: ReviewStatus;
}

const REVIEWS: ReviewItem[] = [
  {
    id: "rev-001",
    proposalId: "sub-004",
    subject: "Life Sciences",
    kind: "Monograph",
    title: "Climate Change and Agricultural Adaptation in Southeast Asia",
    subtitle: "Smallholder Strategies and Policy Frameworks",
    authorName: "Dr. Sarah Chen",
    authorAffiliation: "University of Oxford",
    wordCount: "90,000 words",
    assignedAt: "5 Feb 2025",
    abstract:
      "This monograph examines the impact of climate change on agricultural practices across Southeast Asia, with a particular focus on adaptation strategies employed by smallholder farmers. Drawing on five years of fieldwork across Thailand, Vietnam, and Indonesia, the study presents empirical evidence of...",
    status: "pending",
  },
];

const REVIEWER_PROFILE = {
  name: "Dr. Anna Hoffmann",
  affiliation: "Freie Universität Berlin",
  expertise: ["Environmental Policy", "Agricultural Economics", "Climate Studies"],
};

const SUBJECT_STYLES: Record<string, string> = {
  "Life Sciences": "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  "Social Sciences": "bg-sky-100 text-sky-800 ring-1 ring-sky-200",
  Humanities: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
};

function ReviewerDashboard() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>("");
  const [assigned, setAssigned] = useState<ReviewItem[]>([]);

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
      setUserEmail(session.email);
      try {
        const aRaw = localStorage.getItem("csp.assignments");
        if (aRaw) {
          const list = JSON.parse(aRaw) as Array<{
            id: string;
            reviewerEmail: string;
            dueDate: string | null;
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
          }>;
          const mine = list
            .filter(
              (a) =>
                a.reviewerEmail.toLowerCase() === session.email.toLowerCase(),
            )
            .map<ReviewItem>((a) => ({
              id: a.id,
              proposalId: a.proposal.id,
              subject: a.proposal.subject,
              kind: a.proposal.kind,
              title: a.proposal.title,
              subtitle: a.proposal.subtitle,
              authorName: a.proposal.authorName,
              authorAffiliation: a.proposal.authorAffiliation,
              wordCount: `${a.proposal.wordCount.toLocaleString()} words`,
              assignedAt: new Date(a.assignedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
              abstract: a.proposal.overview,
              status: "pending",
            }));
          setAssigned(mine);
        }
      } catch {
        // ignore
      }
    } catch {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  const onLogout = () => {
    try {
      sessionStorage.removeItem("csp.session");
    } catch {
      // ignore
    }
    navigate({ to: "/login" });
  };

  // Always show full reviewer profile name to match design
  void userEmail;
  const displayName = REVIEWER_PROFILE.name;

  const allReviews = [...assigned, ...REVIEWS];
  const assignedCount = allReviews.length;
  const pending = allReviews.filter((r) => r.status === "pending").length;
  const completed = allReviews.filter((r) => r.status === "completed").length;

  const pendingItems = allReviews.filter((r) => r.status === "pending");
  const completedItems = allReviews.filter((r) => r.status === "completed");

  return (
    <div className="min-h-screen bg-[#FAF6EE] font-sans text-stone-800">
      {/* Top bar */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to="/login" className="flex items-center gap-3">
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
              {initialsFromName(displayName)}
            </div>
            <span className="font-sans text-sm font-medium text-stone-800">
              {displayName}
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

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Heading */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-stone-900">
            Your Reviews
          </h1>
          <p className="mt-2 font-sans text-base text-amber-700/80">
            {REVIEWER_PROFILE.affiliation} ·{" "}
            {REVIEWER_PROFILE.expertise.join(", ")}
          </p>
        </div>

        {/* Stat cards */}
        <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <StatCard label="Assigned" value={assignedCount} tone="sky" />
          <StatCard label="Pending" value={pending} tone="amber" />
          <StatCard label="Completed" value={completed} tone="green" />
        </div>

        {/* Awaiting Your Review */}
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 font-serif text-2xl font-bold text-stone-900">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            Awaiting Your Review
          </h2>

          {pendingItems.length === 0 ? (
            <EmptyState text="No reviews awaiting your attention." />
          ) : (
            <ul className="space-y-4">
              {pendingItems.map((r) => (
                <ReviewCard key={r.id} item={r} ctaLabel="Start Review" ctaTone="sky" />
              ))}
            </ul>
          )}
        </section>

        {/* Completed */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 font-serif text-2xl font-bold text-stone-900">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Completed Reviews
          </h2>

          {completedItems.length === 0 ? (
            <EmptyState text="You haven't completed any reviews yet." />
          ) : (
            <ul className="space-y-4">
              {completedItems.map((r) => (
                <ReviewCard
                  key={r.id}
                  item={r}
                  ctaLabel="View Review"
                  ctaTone="muted"
                />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "sky" | "amber" | "green";
}) {
  const tones: Record<
    "sky" | "amber" | "green",
    { wrap: string; value: string; label: string }
  > = {
    sky: {
      wrap: "bg-sky-50 ring-2 ring-sky-200",
      value: "text-sky-900",
      label: "text-sky-800",
    },
    amber: {
      wrap: "bg-amber-50 ring-2 ring-amber-200",
      value: "text-amber-900",
      label: "text-amber-800",
    },
    green: {
      wrap: "bg-emerald-50 ring-2 ring-emerald-200",
      value: "text-emerald-900",
      label: "text-emerald-800",
    },
  };
  const t = tones[tone];
  return (
    <div className={`rounded-2xl px-5 py-5 text-center ${t.wrap}`}>
      <div className={`font-serif text-4xl font-bold leading-none ${t.value}`}>
        {value}
      </div>
      <div className={`mt-2 font-sans text-sm font-medium ${t.label}`}>{label}</div>
    </div>
  );
}

function ReviewCard({
  item,
  ctaLabel,
  ctaTone,
}: {
  item: ReviewItem;
  ctaLabel: string;
  ctaTone: "sky" | "muted";
}) {
  const subjectClass =
    SUBJECT_STYLES[item.subject] ??
    "bg-stone-100 text-stone-700 ring-1 ring-stone-200";

  const ctaClass =
    ctaTone === "sky"
      ? "bg-sky-600 text-white hover:bg-sky-700"
      : "bg-white text-stone-700 ring-1 ring-stone-300 hover:bg-stone-50";

  return (
    <li className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 font-sans text-xs font-semibold ${subjectClass}`}
          >
            {item.subject}
          </span>
          <span className="font-sans text-sm text-stone-500">{item.kind}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (ctaTone === "sky") {
              window.location.href = `/dashboard/reviewer/submission/${item.proposalId}`;
            }
          }}
          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 font-sans text-sm font-semibold transition-colors ${ctaClass}`}
        >
          {ctaTone === "muted" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          {ctaLabel}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <h3 className="mt-3 font-serif text-xl font-bold leading-snug text-stone-900">
        {item.title}
      </h3>
      {item.subtitle && (
        <p className="mt-0.5 font-sans text-[15px] text-stone-600">{item.subtitle}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-sm text-stone-600">
        <span className="inline-flex items-center gap-1.5">
          <User2 className="h-4 w-4 text-stone-400" />
          {item.authorName}, {item.authorAffiliation}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-stone-400" />
          {item.wordCount}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-stone-400" />
          {item.status === "completed" && item.completedAt
            ? `Completed ${item.completedAt}`
            : `Assigned ${item.assignedAt}`}
        </span>
      </div>

      <p className="mt-4 font-sans text-[15px] leading-relaxed text-stone-600">
        {item.abstract}
      </p>
    </li>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white/50 px-6 py-10 text-center font-sans text-sm text-stone-500">
      {text}
    </div>
  );
}