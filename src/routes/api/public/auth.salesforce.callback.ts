import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/auth/salesforce/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { getOAuthConfig, exchangeCodeForTokens, fetchIdentity, serializeSession } = await import(
          "@/lib/salesforce/session.server"
        );

        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const oauthError = url.searchParams.get("error_description") || url.searchParams.get("error");
        const state = url.searchParams.get("state");
        const cookies = (request.headers.get("cookie") ?? "").split(";").map((p) => p.trim());
        const readCookie = (name: string) =>
          cookies.find((p) => p.startsWith(`${name}=`))?.slice(name.length + 1);
        const cookieState = readCookie("sf_oauth_state");
        const codeVerifier = readCookie("sf_pkce_verifier");

        const clearState = "sf_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
        const clearVerifier = "sf_pkce_verifier=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";

        const fail = (message: string) => {
          let frontend = url.origin;
          try {
            frontend = getOAuthConfig(request).frontendUrl;
          } catch {
            /* config missing — fall back to this origin */
          }
          const headers = new Headers({
            Location: `${frontend}/?error=${encodeURIComponent(message)}`,
          });
          headers.append("Set-Cookie", clearState);
          headers.append("Set-Cookie", clearVerifier);
          return new Response(null, { status: 302, headers });
        };

        if (oauthError) return fail(`Salesforce authorization failed: ${oauthError}`);
        if (!code) return fail("Salesforce did not return an authorization code.");
        if (!state || !cookieState || state !== cookieState) {
          return fail("The sign-in request could not be verified. Please try again.");
        }

        try {
          const cfg = getOAuthConfig(request);
          const tokens = await exchangeCodeForTokens(request, code, codeVerifier);

          const user = tokens.id
            ? await fetchIdentity(tokens.access_token, tokens.id)
            : { name: "Salesforce User" };

          const cookie = await serializeSession({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            instanceUrl: tokens.instance_url,
            user,
          });

          const headers = new Headers({ Location: `${cfg.frontendUrl}/dashboard` });
          headers.append("Set-Cookie", cookie);
          headers.append("Set-Cookie", clearState);
          headers.append("Set-Cookie", clearVerifier);
          return new Response(null, { status: 302, headers });
        } catch (error) {
          console.error("Salesforce OAuth callback failed:", error);
          return fail("We could not complete the Salesforce sign-in. Please try again.");
        }
      },
    },
  },
});
