import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { UserRound, FileText, ClipboardCheck, ArrowRight, ArrowLeft, type LucideIcon } from "lucide-react";
import libraryBg from "@/assets/library-bg.jpg";

export const Route = createFileRoute("/login")({
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
  component: LoginPage,
});

type Role = "author" | "editor" | "reviewer";

interface PortalConfig {
  id: Role;
  title: string;
  cardDescription: string;
  formSubtitle: string;
  Icon: LucideIcon;
  toneClass: string;
  badgeClass: string;
  demoEmail: string;
  demoCode: string;
}

const portals: PortalConfig[] = [
  {
    id: "author",
    title: "Author Portal",
    cardDescription: "Track your submission through every stage of the publishing journey.",
    formSubtitle: "Submit and track your book proposals",
    Icon: UserRound,
    toneClass: "bg-portal-author",
    badgeClass: "bg-portal-author text-white",
    demoEmail: "author@university.edu",
    demoCode: "1234",
  },
  {
    id: "editor",
    title: "Editor Portal",
    cardDescription: "Manage the full proposal pipeline from intake to decision.",
    formSubtitle: "Review and manage incoming proposals",
    Icon: FileText,
    toneClass: "bg-portal-editor",
    badgeClass: "bg-portal-editor text-white",
    demoEmail: "editor@csp.com",
    demoCode: "5678",
  },
  {
    id: "reviewer",
    title: "Reviewer Portal",
    cardDescription: "Review assigned proposals and submit your recommendations.",
    formSubtitle: "Complete your assigned peer reviews",
    Icon: ClipboardCheck,
    toneClass: "bg-portal-reviewer",
    badgeClass: "bg-portal-reviewer text-white",
    demoEmail: "reviewer@cambridge.ac.uk",
    demoCode: "9012",
  },
];

function LoginPage() {
  const [selected, setSelected] = useState<Role | null>(null);
  const portal = portals.find((p) => p.id === selected) ?? null;

  return (
    <main className="relative min-h-screen overflow-hidden font-sans text-foreground">
      <img
        src={libraryBg}
        alt=""
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/35" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center px-6 py-16">
        <header className="mb-12 flex flex-col items-center text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background/40 backdrop-blur">
            <span className="font-serif text-xl text-foreground">CS</span>
          </div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Cambridge Scholars Publishing
          </h1>
          <p className="mt-2 text-sm tracking-wide text-muted-foreground">
            Proposal Management Portal
          </p>
        </header>

        {portal ? (
          <PortalLoginForm portal={portal} onBack={() => setSelected(null)} />
        ) : (
          <PortalCards onSelect={setSelected} />
        )}
      </div>
    </main>
  );
}

function PortalCards({ onSelect }: { onSelect: (role: Role) => void }) {
  return (
    <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
      {portals.map(({ id, title, cardDescription, Icon, toneClass }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          className="group relative flex flex-col rounded-2xl border border-white/15 bg-white/10 p-7 text-left backdrop-blur-md transition-all hover:-translate-y-1 hover:border-white/25 hover:bg-white/15"
        >
          <div
            className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${toneClass} text-white shadow-lg`}
          >
            <Icon className="h-6 w-6" strokeWidth={2} />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-foreground">{title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{cardDescription}</p>
          <span className="mt-8 inline-flex items-center gap-2 font-serif text-base text-foreground/90 transition-all group-hover:gap-3">
            Sign in
            <ArrowRight className="h-4 w-4" />
          </span>
        </button>
      ))}
    </div>
  );
}

function PortalLoginForm({ portal, onBack }: { portal: PortalConfig; onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("login", { role: portal.id, email, code });
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-white/15 bg-white/10 p-8 backdrop-blur-md">
        <div className="mb-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
            aria-label="Back to portal selection"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${portal.badgeClass}`}>
            {portal.title}
          </span>
        </div>

        <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{portal.formSubtitle}</p>

        <form onSubmit={onSubmit} className="mt-7 space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@university.edu"
              className="w-full rounded-md border border-border bg-background/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-foreground/50"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium text-foreground">
              Access code
            </label>
            <input
              id="code"
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your code"
              className="w-full rounded-md border border-border bg-background/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-foreground/50"
            />
          </div>

          <button
            type="submit"
            className={`mt-2 w-full rounded-md ${portal.toneClass} py-3 font-medium text-white shadow-lg transition-opacity hover:opacity-90`}
          >
            Log in
          </button>
        </form>

        <button
          type="button"
          className="mt-5 w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Get new code
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Demo: <span className="text-foreground/80">{portal.demoEmail} / {portal.demoCode}</span>
      </p>
    </div>
  );
}
