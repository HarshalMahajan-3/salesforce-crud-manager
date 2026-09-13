

import { SF_API_VERSION } from "./objects";

const COOKIE_NAME = "sf_session";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

export interface SfIdentity {
  name: string;
  email?: string | undefined;
  username?: string | undefined;
  organizationId?: string | undefined;
}

export interface SfSession {
  accessToken: string;
  refreshToken?: string | undefined;
  instanceUrl: string;
  user: SfIdentity;
}

function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function getOAuthConfig(request: Request) {
  const origin = new URL(request.url).origin;
  return {
    clientId: env("SALESFORCE_CLIENT_ID"),
    clientSecret: env("SALESFORCE_CLIENT_SECRET"),
    loginUrl: (process.env["SALESFORCE_LOGIN_URL"] || "https://login.salesforce.com").replace(/\/$/, ""),
    redirectUri: process.env["SALESFORCE_REDIRECT_URI"] || `${origin}/api/public/auth/salesforce/callback`,
    frontendUrl: (process.env["FRONTEND_URL"] || origin).replace(/\/$/, ""),
  };
}

/* ------------------------------- cookie crypto ------------------------------ */

function b64urlEncode(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const str = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(new ArrayBuffer(str.length));
  for (let i = 0; i < str.length; i += 1) bytes[i] = str.charCodeAt(i);
  return bytes;
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env("SESSION_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(payload: string): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(), new TextEncoder().encode(payload));
  return b64urlEncode(new Uint8Array(sig));
}

export async function serializeSession(session: SfSession): Promise<string> {
  const payload = b64urlEncode(new TextEncoder().encode(JSON.stringify(session)));
  const signature = await sign(payload);
  const secure = process.env["NODE_ENV"] === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${payload}.${signature}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${secure}`;
}

export function clearSessionCookie(): string {
  const secure = process.env["NODE_ENV"] === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export async function readSession(request: Request): Promise<SfSession | null> {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;

  const raw = match.slice(COOKIE_NAME.length + 1);
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      b64urlDecode(signature),
      new TextEncoder().encode(payload),
    );
    if (!valid) return null;
    return JSON.parse(new TextDecoder().decode(b64urlDecode(payload))) as SfSession;
  } catch {
    return null;
  }
}

/* --------------------------------- OAuth ---------------------------------- */

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  instance_url: string;
  id?: string;
  error?: string;
  error_description?: string;
}

function toBase64Url(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Cryptographically random PKCE code_verifier (43-128 chars, base64url). */
export function createCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

/** S256 code_challenge derived from a code_verifier. */
export async function deriveCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return toBase64Url(new Uint8Array(digest));
}

export async function exchangeCodeForTokens(request: Request, code: string, codeVerifier?: string) {
  const cfg = getOAuthConfig(request);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirectUri,
  });
  if (codeVerifier) body.set("code_verifier", codeVerifier);
  const response = await fetch(`${cfg.loginUrl}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await response.json()) as TokenResponse;
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Salesforce token exchange failed");
  }
  return data;
}

async function refreshAccessToken(request: Request, session: SfSession): Promise<SfSession | null> {
  if (!session.refreshToken) return null;
  const cfg = getOAuthConfig(request);
  const response = await fetch(`${cfg.loginUrl}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: session.refreshToken,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
    }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as TokenResponse;
  if (!data.access_token) return null;
  return {
    ...session,
    accessToken: data.access_token,
    instanceUrl: data.instance_url || session.instanceUrl,
  };
}

export async function fetchIdentity(accessToken: string, idUrl: string): Promise<SfIdentity> {
  try {
    const response = await fetch(idUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) return { name: "Salesforce User" };
    const data = (await response.json()) as {
      display_name?: string;
      email?: string;
      username?: string;
      organization_id?: string;
    };
    return {
      name: data.display_name || data.username || "Salesforce User",
      email: data.email,
      username: data.username,
      organizationId: data.organization_id,
    };
  } catch {
    return { name: "Salesforce User" };
  }
}

/* ------------------------------ REST helpers ------------------------------ */

export class SfApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface SfCallResult<T> {
  data: T;
  /** Present when the access token was refreshed and the cookie must be re-issued. */
  session?: SfSession | undefined;
}


export async function sfRequest<T>(
  request: Request,
  session: SfSession,
  path: string,
  init: RequestInit = {},
): Promise<SfCallResult<T>> {
  const doCall = (current: SfSession) =>
    fetch(`${current.instanceUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${current.accessToken}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });

  let active = session;
  let response = await doCall(active);
  let refreshed: SfSession | undefined;

  if (response.status === 401) {
    const next = await refreshAccessToken(request, active);
    if (!next) throw new SfApiError("Your Salesforce session has expired. Please sign in again.", 401);
    active = next;
    refreshed = next;
    response = await doCall(active);
  }

  if (response.status === 204) return { data: undefined as T, session: refreshed };

  const text = await response.text();
  const parsed = text ? safeJson(text) : null;

  if (!response.ok) {
    console.error(`Salesforce API error [${response.status}] ${path}: ${text}`);
    throw new SfApiError(extractSfMessage(parsed, response.status), mapStatus(response.status));
  }

  return { data: (parsed ?? {}) as T, session: refreshed };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function mapStatus(status: number): number {
  if (status === 401) return 401;
  if (status === 403) return 403;
  if (status === 404) return 404;
  if (status === 429) return 429;
  if (status >= 400 && status < 500) return 400;
  return 502;
}

function extractSfMessage(parsed: unknown, status: number): string {
  if (Array.isArray(parsed) && parsed.length > 0) {
    const first = parsed[0] as { message?: string; errorCode?: string };
    if (first?.message) return first.message;
  }
  if (parsed && typeof parsed === "object") {
    const obj = parsed as { message?: string; error_description?: string };
    if (obj.message) return obj.message;
    if (obj.error_description) return obj.error_description;
  }
  if (status === 429) return "Salesforce API rate limit reached. Please try again shortly.";
  return "Salesforce request failed. Please try again.";
}

/** Standard JSON error response — never leaks stack traces or secrets. */
export function errorResponse(error: unknown, fallbackStatus = 500) {
  if (error instanceof SfApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("Unhandled server error:", error);
  return Response.json({ error: "Something went wrong. Please try again." }, { status: fallbackStatus });
}

export async function requireSession(request: Request): Promise<SfSession> {
  const session = await readSession(request);
  if (!session) throw new SfApiError("Not authenticated with Salesforce.", 401);
  return session;
}

export function withRefreshedCookie(response: Response, session?: SfSession): Promise<Response> | Response {
  if (!session) return response;
  return serializeSession(session).then((cookie) => {
    const headers = new Headers(response.headers);
    headers.append("Set-Cookie", cookie);
    return new Response(response.body, { status: response.status, headers });
  });
}

export { SF_API_VERSION };
