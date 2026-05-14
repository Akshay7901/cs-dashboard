import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { UserRound, FileText, ClipboardCheck, ArrowRight, ArrowLeft, type LucideIcon } from "lucide-react";
import libraryBg from "@/assets/library-reference.jpg";
import cspLogo from "@/assets/csp-logo.png";

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden font-sans text-foreground">
      <img
        src={libraryBg}
        alt="Library"
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-text/70" />

      <div className="relative z-10 w-full max-w-4xl px-6 py-12">
        <header className="mb-10 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-foreground/20 bg-foreground/10 backdrop-blur-sm">
            <img src={cspLogo} alt="CSP" width={36} height={36} className="invert" />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Cambridge Scholars Publishing
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
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
    <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
      {portals.map(({ id, title, cardDescription, Icon, toneClass }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          className="group cursor-pointer rounded-2xl border border-foreground/20 bg-foreground/10 p-7 text-left backdrop-blur-sm transition-all duration-200 hover:border-foreground/40 hover:bg-foreground/20"
        >
          <div
            className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${toneClass} text-foreground`}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
          <h2 className="mb-1 font-serif text-lg font-bold text-foreground">{title}</h2>
          <p className="text-sm leading-relaxed text-foreground/60">{cardDescription}</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm text-foreground/50 transition-colors group-hover:text-foreground/80">
            Sign in
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
    <div className="mx-auto max-w-sm">
      <div className="rounded-2xl border border-foreground/20 bg-foreground/10 p-7 shadow-xl backdrop-blur-md">
        <div className="mb-6 flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer text-foreground/50 transition-colors hover:text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className={`rounded-full px-3 py-1 font-sans text-xs font-medium ${portal.badgeClass}`}>
            {portal.title}
          </div>
        </div>

        <h2 className="mb-1 font-serif text-xl font-bold text-foreground">Welcome back</h2>
        <p className="mb-6 font-sans text-sm text-foreground/60">{portal.formSubtitle}</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block font-sans text-sm font-medium text-foreground/80">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@university.edu"
              className="w-full rounded-xl border border-foreground/20 bg-foreground/10 px-3 py-2.5 font-sans text-sm text-foreground placeholder:text-foreground/30 transition-colors focus:outline-none focus:ring-2 focus:ring-foreground/30"
            />
          </div>
          <div>
            <label htmlFor="code" className="mb-1.5 block font-sans text-sm font-medium text-foreground/80">
              Access code
            </label>
            <input
              id="code"
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your code"
              className="w-full rounded-xl border border-foreground/20 bg-foreground/10 px-3 py-2.5 font-sans text-sm text-foreground placeholder:text-foreground/30 transition-colors focus:outline-none focus:ring-2 focus:ring-foreground/30"
            />
          </div>

          <button
            type="submit"
            className={`mt-1 w-full rounded-xl ${portal.toneClass} py-2.5 font-sans text-sm font-medium text-white transition-opacity hover:opacity-90`}
          >
            Log in
          </button>

          <button
            type="button"
            className="w-full text-center font-sans text-sm text-foreground/40 transition-colors hover:text-foreground/70"
          >
            Get new code
          </button>
        </form>
      </div>

      <p className="mt-4 text-center font-sans text-xs text-foreground/30">
        Demo: <span className="text-foreground/50">{portal.demoEmail} / {portal.demoCode}</span>
      </p>
    </div>
  );
}
