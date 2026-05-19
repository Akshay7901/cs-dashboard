import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  LogOut,
} from "lucide-react";
import cspLogo from "@/assets/csp-logo.png";

export const Route = createFileRoute("/dashboard/editor")({
  head: () => ({
    meta: [{ title: "Editor Portal — Proposal Intake" }],
  }),
  component: EditorDashboard,
});

type StatusKey =
  | "submitted"
  | "revisions"
  | "in_review"
  | "review_returned"
  | "major_revisions"
  | "question"
  | "contract"
  | "signed"
  | "declined";

interface StatusMeta {
  key: StatusKey;
  label: string;
  filterLabel: string;
  dot: string;
  badgeClass: string;
  rowBar: string;
}

const STATUS_META: Record<StatusKey, StatusMeta> = {
  submitted: {
    key: "submitted",
    label: "Submitted",
    filterLabel: "Submitted",
    dot: "bg-amber-400",
    badgeClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    rowBar: "bg-amber-400",
  },
  revisions: {
    key: "revisions",
    label: "Revisions Requested",
    filterLabel: "Revisions",
    dot: "bg-orange-500",
    badgeClass: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
    rowBar: "bg-orange-500",
  },
  in_review: {
    key: "in_review",
    label: "Under Review",
    filterLabel: "In Review",
    dot: "bg-sky-500",
    badgeClass: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    rowBar: "bg-sky-500",
  },
  review_returned: {
    key: "review_returned",
    label: "Review Returned",
    filterLabel: "Review Returned",
    dot: "bg-indigo-500",
    badgeClass: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
    rowBar: "bg-indigo-500",
  },
  major_revisions: {
    key: "major_revisions",
    label: "Major Revisions Required",
    filterLabel: "Major Revisions",
    dot: "bg-rose-500",
    badgeClass: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    rowBar: "bg-rose-500",
  },
  question: {
    key: "question",
    label: "Question Raised",
    filterLabel: "Question",
    dot: "bg-teal-500",
    badgeClass: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
    rowBar: "bg-teal-500",
  },
  contract: {
    key: "contract",
    label: "Contract Issued",
    filterLabel: "Contract",
    dot: "bg-violet-500",
    badgeClass: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    rowBar: "bg-violet-400",
  },
  signed: {
    key: "signed",
    label: "Contract Signed",
    filterLabel: "Signed",
    dot: "bg-emerald-500",
    badgeClass: "bg-emerald-600 text-white",
    rowBar: "bg-emerald-500",
  },
  declined: {
    key: "declined",
    label: "Declined",
    filterLabel: "Declined",
    dot: "bg-stone-400",
    badgeClass: "bg-stone-100 text-stone-600 ring-1 ring-stone-200",
    rowBar: "bg-stone-300",
  },
};

interface Proposal {
  id: string;
  title: string;
  kind: string;
  authorName: string;
  authorAffiliation: string;
  country: string;
  submittedAt: string; // ISO
  status: StatusKey;
}

// Mock data — replace with API later
const PROPOSALS: Proposal[] = [
  {
    id: "1",
    title: "Borders, Bodies, and Belonging: Migration and the Politics of Care",
    kind: "Monograph",
    authorName: "Dr. Aisha Kamara",
    authorAffiliation: "University College London",
    country: "United Kingdom",
    submittedAt: "2025-03-10",
    status: "major_revisions",
  },
  {
    id: "2",
    title: "Gender and Power in Early Modern Europe",
    kind: "Monograph",
    authorName: "Dr. Sophie Dubois",
    authorAffiliation: "Université Libre de Bruxelles",
    country: "Belgium",
    submittedAt: "2025-03-01",
    status: "question",
  },
  {
    id: "3",
    title: "The Philosophy of Algorithmic Governance",
    kind: "Monograph",
    authorName: "Prof. James Mitchell",
    authorAffiliation: "Stanford University",
    country: "United States",
    submittedAt: "2025-02-10",
    status: "review_returned",
  },
  {
    id: "4",
    title: "Climate Change and Agricultural Adaptation in Southeast Asia",
    kind: "Monograph",
    authorName: "Dr. Sarah Chen",
    authorAffiliation: "University of Oxford",
    country: "United Kingdom",
    submittedAt: "2025-01-28",
    status: "in_review",
  },
  {
    id: "5",
    title: "Medieval Trade Routes: A Geographic Analysis",
    kind: "Edited Collection",
    authorName: "Dr. Elena Vasquez",
    authorAffiliation: "Sorbonne University",
    country: "France",
    submittedAt: "2024-12-15",
    status: "revisions",
  },
  {
    id: "6",
    title: "Contemporary African Literature: Voices and Narratives",
    kind: "Edited Collection",
    authorName: "Prof. Kwame Osei",
    authorAffiliation: "University of Ghana",
    country: "Ghana",
    submittedAt: "2024-11-03",
    status: "contract",
  },
  {
    id: "7",
    title: "Urban Planning in Post-Industrial Cities",
    kind: "Monograph",
    authorName: "Dr. Marie Garcia",
    authorAffiliation: "École Polytechnique",
    country: "France",
    submittedAt: "2024-10-22",
    status: "declined",
  },
  {
    id: "8",
    title: "The Digital Archive and Historical Memory",
    kind: "Monograph",
    authorName: "Prof. Lena Fischer",
    authorAffiliation: "Humboldt University",
    country: "Germany",
    submittedAt: "2024-09-12",
    status: "signed",
  },
];

const FILTER_ORDER: ("all" | StatusKey)[] = [
  "all",
  "submitted",
  "revisions",
  "in_review",
  "review_returned",
  "major_revisions",
  "contract",
  "question",
  "signed",
  "declined",
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string) {
  return name
    .replace(/(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)/g, "")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function EditorDashboard() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<"all" | StatusKey>("all");
  const [search, setSearch] = useState("");
  const [field, setField] = useState<"all" | "title" | "author" | "country">("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

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

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: PROPOSALS.length };
    for (const k of Object.keys(STATUS_META)) map[k] = 0;
    for (const p of PROPOSALS) map[p.status] = (map[p.status] ?? 0) + 1;
    return map;
  }, []);

  const filtered = useMemo(() => {
    let list = PROPOSALS.slice();
    if (activeFilter !== "all") list = list.filter((p) => p.status === activeFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const inTitle = p.title.toLowerCase().includes(q);
        const inAuthor = p.authorName.toLowerCase().includes(q);
        const inCountry = p.country.toLowerCase().includes(q);
        if (field === "title") return inTitle;
        if (field === "author") return inAuthor;
        if (field === "country") return inCountry;
        return inTitle || inAuthor || inCountry;
      });
    }
    list.sort((a, b) => {
      const da = new Date(a.submittedAt).getTime();
      const db = new Date(b.submittedAt).getTime();
      return sort === "newest" ? db - da : da - db;
    });
    return list;
  }, [activeFilter, search, field, sort]);

  const onLogout = () => {
    try {
      sessionStorage.removeItem("csp.session");
    } catch {
      // ignore
    }
    navigate({ to: "/login" });
  };

  const displayName = (() => {
    if (!userEmail) return "Editor";
    const local = userEmail.split("@")[0] ?? "Editor";
    return local
      .split(/[._-]/)
      .filter(Boolean)
      .map((p) => p[0]?.toUpperCase() + p.slice(1))
      .join(" ") || "Editor";
  })();

  return (
    <div className="min-h-screen bg-[#FAF6EE] font-sans text-stone-800">
      {/* Top bar */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-8 py-4">
          <div className="flex items-center gap-3">
            <Link to="/login" className="flex items-center gap-3">
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
              {initials(displayName)}
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

      <main className="mx-auto max-w-7xl px-8 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-stone-900">
            Proposal Intake
          </h1>
          <p className="mt-2 font-sans text-base text-stone-600">
            Review and manage incoming book proposals
          </p>
        </div>

        {/* Filter pills */}
        <div className="mb-5 flex flex-wrap gap-2.5">
          {FILTER_ORDER.map((key) => {
            const isAll = key === "all";
            const meta = isAll ? null : STATUS_META[key as StatusKey];
            const count = counts[key] ?? 0;
            const active = activeFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveFilter(key)}
                className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 font-sans text-sm transition-colors ${
                  active
                    ? "border-[#0E3D2F] bg-[#0E3D2F] text-white"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isAll
                      ? active
                        ? "bg-white"
                        : "bg-stone-400"
                      : meta!.dot
                  }`}
                />
                <span className="font-medium">{isAll ? "All" : meta!.filterLabel}</span>
                <span
                  className={`ml-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 font-sans text-xs font-medium ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search row */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={field}
              onChange={(e) =>
                setField(e.target.value as "all" | "title" | "author" | "country")
              }
              className="appearance-none rounded-xl border border-stone-200 bg-white py-2.5 pl-4 pr-9 font-sans text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300"
            >
              <option value="all">All fields</option>
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="country">Country</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          </div>

          <div className="relative flex-1 min-w-[260px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search proposals..."
              className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 font-sans text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>

          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
              className="appearance-none rounded-xl border border-stone-200 bg-white py-2.5 pl-4 pr-9 font-sans text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          </div>
        </div>

        <p className="mb-3 font-sans text-sm text-stone-600">
          {filtered.length} proposals
        </p>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="hidden grid-cols-[1.6fr_1.1fr_0.9fr_0.9fr_1fr_auto] items-center gap-4 border-b border-stone-200 bg-stone-50/60 px-6 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-stone-500 md:grid">
            <HeaderCell label="Title" />
            <HeaderCell label="Author" />
            <HeaderCell label="Country" />
            <HeaderCell label="Submitted" active sort={sort === "newest" ? "desc" : "asc"} />
            <HeaderCell label="Status" />
            <div />
          </div>

          <ul>
            {filtered.map((p) => {
              const meta = STATUS_META[p.status];
              return (
                <li
                  key={p.id}
                  className="relative grid grid-cols-1 items-center gap-4 border-b border-stone-100 px-6 py-5 last:border-b-0 md:grid-cols-[1.6fr_1.1fr_0.9fr_0.9fr_1fr_auto]"
                >
                  <span
                    className={`absolute left-0 top-0 h-full w-1.5 ${meta.rowBar}`}
                    aria-hidden="true"
                  />
                  <div className="pl-2">
                    <p className="font-sans text-[15px] font-semibold leading-snug text-stone-900">
                      {p.title}
                    </p>
                    <p className="mt-1 font-sans text-xs text-stone-500">{p.kind}</p>
                  </div>
                  <div>
                    <p className="font-sans text-sm font-semibold text-stone-900">
                      {p.authorName}
                    </p>
                    <p className="mt-0.5 font-sans text-xs text-stone-500">
                      {p.authorAffiliation}
                    </p>
                  </div>
                  <div className="font-sans text-sm text-stone-700">{p.country}</div>
                  <div className="font-sans text-sm text-stone-700">
                    {formatDate(p.submittedAt)}
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-xs font-medium ${meta.badgeClass}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          p.status === "signed" ? "bg-white" : meta.dot
                        }`}
                      />
                      {meta.label}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 justify-self-end font-sans text-sm font-medium text-stone-700 hover:text-stone-900"
                  >
                    Review
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-6 py-10 text-center font-sans text-sm text-stone-500">
                No proposals match your filters.
              </li>
            )}
          </ul>

          <div className="border-t border-stone-200 bg-stone-50/60 px-6 py-3 font-sans text-xs text-stone-500">
            {filtered.length} results
          </div>
        </div>
      </main>
    </div>
  );
}

function HeaderCell({
  label,
  active,
  sort,
}: {
  label: string;
  active?: boolean;
  sort?: "asc" | "desc";
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 ${
        active ? "text-stone-700" : "text-stone-500"
      }`}
    >
      {label}
      <ArrowUpDown className="h-3 w-3 opacity-60" />
      {active && sort && <span className="sr-only">{sort}</span>}
    </button>
  );
}