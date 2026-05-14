import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import libraryBg from "@/assets/library-bg.jpg";

interface PortalLoginProps {
  title: string;
  subtitle: string;
  Icon: LucideIcon;
  toneClass: string;
}

export function PortalLogin({ title, subtitle, Icon, toneClass }: PortalLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // UI only — wire to auth later
    console.log("sign in", { title, email });
  };

  return (
    <main className="relative min-h-screen overflow-hidden font-sans text-foreground">
      <img
        src={libraryBg}
        alt=""
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-background/80" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <Link
          to="/"
          className="mb-8 inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Choose a different portal
        </Link>

        <div className="rounded-2xl border border-border bg-background/50 p-8 backdrop-blur-md">
          <div
            className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${toneClass} text-white shadow-lg`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-background/40 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground/50"
                placeholder="you@institution.edu"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                <button type="button" className="text-xs text-muted-foreground hover:text-foreground">
                  Forgot?
                </button>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-background/40 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground/50"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-md bg-foreground py-3 font-serif text-base text-background transition-opacity hover:opacity-90"
            >
              Sign in
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Need access? Contact your editorial coordinator.
          </p>
        </div>
      </div>
    </main>
  );
}