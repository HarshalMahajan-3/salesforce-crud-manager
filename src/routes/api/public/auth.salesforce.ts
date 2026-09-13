import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/auth/salesforce")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { getOAuthConfig, createCodeVerifier, deriveCodeChallenge } = await import(
          "@/lib/salesforce/session.server"
        );
        try {
          const cfg = getOAuthConfig(request);
          const state = crypto.randomUUID();
          const codeVerifier = createCodeVerifier();
          const codeChallenge = await deriveCodeChallenge(codeVerifier);
          const params = new URLSearchParams({
            response_type: "code",
            client_id: cfg.clientId,
            redirect_uri: cfg.redirectUri,
            scope: "api refresh_token offline_access",
            state,
            code_challenge: codeChallenge,
            code_challenge_method: "S256",
          });
          const secure = process.env["NODE_ENV"] === "production" ? "; Secure" : "";
          const headers = new Headers({
            Location: `${cfg.loginUrl}/services/oauth2/authorize?${params.toString()}`,
          });
          headers.append(
            "Set-Cookie",
            `sf_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`,
          );
          headers.append(
            "Set-Cookie",
            `sf_pkce_verifier=${codeVerifier}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`,
          );
          return new Response(null, { status: 302, headers });

        } catch (error) {
          console.error("Salesforce OAuth start failed:", error);
          const origin = new URL(request.url).origin;
          return new Response(null, {
            status: 302,
            headers: {
              Location: `${origin}/?error=${encodeURIComponent(
                "Salesforce is not configured yet. Add the Salesforce credentials to continue.",
              )}`,
            },
          });
        }
      },
    },
  },
});
