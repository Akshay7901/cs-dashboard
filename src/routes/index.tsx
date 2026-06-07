import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getPortalSession } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const session = getPortalSession();
    if (session?.role) {
      navigate({ to: "/dashboard/$role", params: { role: session.role } });
      return;
    }
    navigate({ to: "/login" });
  }, [navigate]);

  return null;
}
