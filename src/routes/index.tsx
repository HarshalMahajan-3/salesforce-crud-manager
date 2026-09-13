import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CloudCog, Database, Loader2, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Salesforce CRUD Manager — Sign in with Salesforce" },
      {
        name: "description",
        content:
          "Sign in with Salesforce OAuth 2.0 to create, read, update and delete Accounts, Opportunities, Leads, Contacts and Cases from one clean interface.",
      },
      { property: "og:title", content: "Salesforce CRUD Manager — Sign in with Salesforce" },
      {
        property: "og:description",
        content:
          "Manage Accounts, Opportunities, Leads, Contacts and Cases from one simple, secure interface.",
      },
    ],
  }),
  component: LoginPage,
});

const FEATURES = [
  {
    icon: Database,
    title: "Five standard objects",
    body: "Accounts, Opportunities, Leads, Contacts and Cases with per-object fields.",
  },
  {
    icon: RefreshCw,
    title: "Full CRUD + infinite scroll",
    body: "Read 20 records at a time via SOQL, then create, edit and delete in place.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    body: "OAuth 2.0 tokens stay server-side. No credentials ever touch the browser.",
  },
];

function LoginPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error");
    if (oauthError) setError(oauthError);

    api
      .me()
      .then((me) => {
        if (me.authenticated) {
          void navigate({ to: "/dashboard" });
          return;
        }
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [navigate]);

  const startLogin = () => {
    setRedirecting(true);
    window.location.href = "/api/public/auth/salesforce";
  };

  return (
    <main className="hero-glow relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <section className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground">
              <LockKeyhole className="size-3.5" />
              Salesforce OAuth 2.0 · External Client App
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">
              Salesforce CRUD Manager
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Manage your Salesforce data from one simple interface.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
              <Button
                size="lg"
                onClick={startLogin}
                disabled={checking || redirecting}
                className="glow-ring w-full sm:w-auto"
              >
                {checking || redirecting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <CloudCog className="mr-2 size-4" />
                )}
                {redirecting ? "Redirecting to Salesforce…" : "Login with Salesforce"}
              </Button>
              <p className="text-xs text-muted-foreground">
                You&apos;ll authorise this app inside Salesforce. We never see your password.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="card-elevated flex gap-3 rounded-xl border border-border bg-card/80 p-4"
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="size-4.5" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold">{title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </div>
              </article>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
