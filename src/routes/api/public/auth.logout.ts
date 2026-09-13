import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/auth/logout")({
  server: {
    handlers: {
      POST: async () => {
        const { clearSessionCookie } = await import("@/lib/salesforce/session.server");
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Set-Cookie": clearSessionCookie() },
        });
      },
    },
  },
});
