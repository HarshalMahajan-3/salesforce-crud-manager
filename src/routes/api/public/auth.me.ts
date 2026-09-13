import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { readSession } = await import("@/lib/salesforce/session.server");
        const session = await readSession(request);
        if (!session) return Response.json({ authenticated: false }, { status: 200 });
        return Response.json({
          authenticated: true,
          user: session.user,
          // Host only — never the token. Used to show which org is connected.
          instanceHost: new URL(session.instanceUrl).host,
        });
      },
    },
  },
});
