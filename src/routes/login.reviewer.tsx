import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck } from "lucide-react";
import { PortalLogin } from "@/components/PortalLogin";

export const Route = createFileRoute("/login/reviewer")({
  head: () => ({
    meta: [
      { title: "Reviewer Sign In — CSP Proposal Portal" },
      { name: "description", content: "Sign in to review assigned proposals and submit recommendations." },
    ],
  }),
  component: () => (
    <PortalLogin
      title="Reviewer Portal"
      subtitle="Review assigned proposals and submit your recommendations."
      Icon={ClipboardCheck}
      toneClass="bg-portal-reviewer"
    />
  ),
});