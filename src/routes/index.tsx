import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { UserRound, FileText, ClipboardCheck, ArrowRight } from "lucide-react";
import libraryBg from "@/assets/library-bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CSP Proposal Portal — Cambridge Scholars Publishing" },
      {
        name: "description",
        content:
          "Sign in to the Cambridge Scholars Publishing Proposal Management Portal as an Author, Editor, or Reviewer.",
      },
    ],
  }),
  component: Index,
});

const portals = [
  {
    to: "/login/author" as const,
    title: "Author Portal",
    description: "Track your submission through every stage of the publishing journey.",
    Icon: UserRound,
    tone: "bg-portal-author",
  },
  {
    to: "/login/editor" as const,
    title: "Editor Portal",
    description: "Manage the full proposal pipeline from intake to decision.",
    Icon: FileText,
    tone: "bg-portal-editor",
  },
  {
    to: "/login/reviewer" as const,
    title: "Reviewer Portal",
    description: "Review assigned proposals and submit your recommendations.",
    Icon: ClipboardCheck,
    tone: "bg-portal-reviewer",
  },
];

function Index() {
  return (
    <main className="relative min-h-screen overflow-hidden font-sans text-foreground">
      <img
        src={libraryBg}
        alt=""
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-background/75 backdrop-blur-[2px]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16">
        <div className="mb-14 flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background/40 backdrop-blur">
            <span className="font-serif text-2xl text-foreground">CS</span>
          </div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Cambridge Scholars Publishing
          </h1>
          <p className="mt-3 text-sm tracking-wide text-muted-foreground sm:text-base">
            Proposal Management Portal
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
          {portals.map(({ to, title, description, Icon, tone }) => (
            <Link
              key={to}
              to={to}
              className="group relative flex flex-col rounded-2xl border border-border bg-background/40 p-7 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-foreground/30 hover:bg-background/55"
            >
              <div
                className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${tone} text-white shadow-lg`}
              >
                <Icon className="h-6 w-6" strokeWidth={2} />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-foreground">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
              <span className="mt-8 inline-flex items-center gap-2 font-serif text-base text-foreground/90 transition-all group-hover:gap-3">
                Sign in
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
