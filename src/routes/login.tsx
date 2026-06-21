import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/components/portal-login-page";

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

        {step === "password" && (
          <form onSubmit={onSubmitLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block font-sans text-sm font-medium text-foreground/80">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                readOnly
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@university.edu"
                className="w-full rounded-xl border border-foreground/20 bg-foreground/5 px-3 py-2.5 font-sans text-sm text-foreground/70 placeholder:text-foreground/30 transition-colors focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block font-sans text-sm font-medium text-foreground/80">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-foreground/20 bg-foreground/10 px-3 py-2.5 font-sans text-sm text-foreground placeholder:text-foreground/30 transition-colors focus:outline-none focus:ring-2 focus:ring-foreground/30"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`mt-1 w-full rounded-xl ${portal.toneClass} py-2.5 font-sans text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50`}
            >
              {loading ? "Signing in…" : "Log in"}
            </button>

            {error && <p role="alert" className="text-center font-sans text-xs text-red-300">{error}</p>}
            {info && !error && <p className="text-center font-sans text-xs text-foreground/60">{info}</p>}

            <button
              type="button"
              onClick={onForgotPassword}
              disabled={loading}
              className="w-full text-center font-sans text-sm text-foreground/40 transition-colors hover:text-foreground/70 disabled:opacity-50"
            >
              Forgot password?
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={onSubmitOtp} className="space-y-4">
            <div>
              <label htmlFor="otp" className="mb-1.5 block font-sans text-sm font-medium text-foreground/80">
                Verification code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit code"
                className="w-full rounded-xl border border-foreground/20 bg-foreground/10 px-3 py-2.5 font-sans text-sm tracking-widest text-foreground placeholder:text-foreground/30 transition-colors focus:outline-none focus:ring-2 focus:ring-foreground/30"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`mt-1 w-full rounded-xl ${portal.toneClass} py-2.5 font-sans text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50`}
            >
              {loading ? "Verifying…" : "Verify code"}
            </button>
            {error && <p role="alert" className="text-center font-sans text-xs text-red-300">{error}</p>}
            {info && !error && <p className="text-center font-sans text-xs text-foreground/60">{info}</p>}
          </form>
        )}

        {step === "set-password" && (
          <form onSubmit={onSubmitSetPassword} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="mb-1.5 block font-sans text-sm font-medium text-foreground/80">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-foreground/20 bg-foreground/10 px-3 py-2.5 font-sans text-sm text-foreground placeholder:text-foreground/30 transition-colors focus:outline-none focus:ring-2 focus:ring-foreground/30"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block font-sans text-sm font-medium text-foreground/80">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full rounded-xl border border-foreground/20 bg-foreground/10 px-3 py-2.5 font-sans text-sm text-foreground placeholder:text-foreground/30 transition-colors focus:outline-none focus:ring-2 focus:ring-foreground/30"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`mt-1 w-full rounded-xl ${portal.toneClass} py-2.5 font-sans text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50`}
            >
              {loading ? "Saving…" : "Set password & continue"}
            </button>
            {error && <p role="alert" className="text-center font-sans text-xs text-red-300">{error}</p>}
            {info && !error && <p className="text-center font-sans text-xs text-foreground/60">{info}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
