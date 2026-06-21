import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getPortalSession } from "@/lib/auth";
import { LoginPage } from "./login";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const session = getPortalSession();
    if (session?.role) {
      if (session.role === "decision_reviewer") {
        navigate({ to: "/dashboard/decision_reviewer" });
        return;
      }
      navigate({ to: "/dashboard/$role", params: { role: session.role } });
      return;
    }
    navigate({ to: "/login" });
  }, [navigate]);

  return <LoginPage />;
}
