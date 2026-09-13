import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/salesforce/$object")({
  server: {
    handlers: {
      // READ — SOQL query, 20 records per page, cursor via nextRecordsUrl
      GET: async ({ request, params }) => {
        const { requireSession, sfRequest, errorResponse, withRefreshedCookie, SF_API_VERSION } = await import(
          "@/lib/salesforce/session.server"
        );
        const { isAllowedObject } = await import("@/lib/salesforce/objects");
        const { buildListQuery, isValidNextRecordsUrl } = await import("@/lib/salesforce/soql.server");

        try {
          if (!isAllowedObject(params.object)) {
            return Response.json({ error: "Unsupported Salesforce object." }, { status: 400 });
          }
          const session = await requireSession(request);
          const url = new URL(request.url);
          const next = url.searchParams.get("next");

          let path: string;
          if (next) {
            if (!isValidNextRecordsUrl(next)) {
              return Response.json({ error: "Invalid pagination cursor." }, { status: 400 });
            }
            path = next;
          } else {
            const soql = buildListQuery(params.object, url.searchParams.get("search") ?? undefined);
            path = `/services/data/${SF_API_VERSION}/query?q=${encodeURIComponent(soql)}`;
          }

          const { data, session: refreshed } = await sfRequest<{
            records: Record<string, unknown>[];
            totalSize: number;
            done: boolean;
            nextRecordsUrl?: string;
          }>(request, session, path);

          const body = Response.json({
            records: data.records ?? [],
            totalSize: data.totalSize ?? 0,
            done: data.done ?? true,
            nextUrl: data.nextRecordsUrl ?? null,
          });
          return await withRefreshedCookie(body, refreshed);
        } catch (error) {
          return errorResponse(error);
        }
      },

      // CREATE
      POST: async ({ request, params }) => {
        const { requireSession, sfRequest, errorResponse, withRefreshedCookie, SF_API_VERSION } = await import(
          "@/lib/salesforce/session.server"
        );
        const { isAllowedObject } = await import("@/lib/salesforce/objects");
        const { sanitizePayload } = await import("@/lib/salesforce/payload.server");

        try {
          if (!isAllowedObject(params.object)) {
            return Response.json({ error: "Unsupported Salesforce object." }, { status: 400 });
          }
          const session = await requireSession(request);
          const raw = (await request.json()) as Record<string, unknown>;
          const payload = sanitizePayload(params.object, raw);
          if (Object.keys(payload).length === 0) {
            return Response.json({ error: "Please fill in at least one field." }, { status: 400 });
          }

          const { data, session: refreshed } = await sfRequest<{ id: string; success: boolean }>(
            request,
            session,
            `/services/data/${SF_API_VERSION}/sobjects/${params.object}`,
            { method: "POST", body: JSON.stringify(payload) },
          );

          return await withRefreshedCookie(Response.json({ id: data.id, success: true }, { status: 201 }), refreshed);
        } catch (error) {
          return errorResponse(error);
        }
      },
    },
  },
});
