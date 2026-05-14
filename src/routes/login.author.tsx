import { createFileRoute } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { PortalLogin } from "@/components/PortalLogin";

export const Route = createFileRoute("/login/author")({
  head: () => ({
    meta: [
      { title: "Author Sign In — CSP Proposal Portal" },
      { name: "description", content: "Sign in to track your proposal submission with Cambridge Scholars Publishing." },
    ],
  }),
  component: () => (
    <PortalLogin
      title="Author Portal"
      subtitle="Track your submission through every stage of the publishing journey."
      Icon={UserRound}
      toneClass="bg-portal-author"
    />
  ),
});