import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { PortalLogin } from "@/components/PortalLogin";

export const Route = createFileRoute("/login/editor")({
  head: () => ({
    meta: [
      { title: "Editor Sign In — CSP Proposal Portal" },
      { name: "description", content: "Sign in to manage the proposal pipeline from intake to decision." },
    ],
  }),
  component: () => (
    <PortalLogin
      title="Editor Portal"
      subtitle="Manage the full proposal pipeline from intake to decision."
      Icon={FileText}
      toneClass="bg-portal-editor"
    />
  ),
});