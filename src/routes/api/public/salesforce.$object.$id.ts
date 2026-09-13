import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/salesforce/$object/$id")({
  server: {
    handlers: {
      // UPDATE
      PATCH: async ({ request, params }) => {
        const { requireSession, sfRequest, errorResponse, withRefreshedCookie, SF_API_VERSION } = await import(
          "@/lib/salesforce/session.server"
        );
        const { isAllowedObject, isValidSfId } = await import("@/lib/salesforce/objects");
        const { sanitizePayload } = await import("@/lib/salesforce/payload.server");

        try {
          if (!isAllowedObject(params.object)) {
            return Response.json({ error: "Unsupported Salesforce object." }, { status: 400 });
          }
          if (!isValidSfId(params.id)) {
            return Response.json({ error: "Invalid Salesforce record ID." }, { status: 400 });
          }
          const session = await requireSession(request);
          const payload = sanitizePayload(params.object, (await request.json()) as Record<string, unknown>);
          if (Object.keys(payload).length === 0) {
            return Response.json({ error: "There is nothing to update." }, { status: 400 });
          }

          const { session: refreshed } = await sfRequest<void>(
            request,
            session,
            `/services/data/${SF_API_VERSION}/sobjects/${params.object}/${params.id}`,
            { method: "PATCH", body: JSON.stringify(payload) },
          );

          return await withRefreshedCookie(Response.json({ success: true }), refreshed);
        } catch (error) {
          return errorResponse(error);
        }
      },

      // DELETE
      DELETE: async ({ request, params }) => {
        const { requireSession, sfRequest, errorResponse, withRefreshedCookie, SF_API_VERSION } = await import(
          "@/lib/salesforce/session.server"
        );
        const { isAllowedObject, isValidSfId } = await import("@/lib/salesforce/objects");

        try {
          if (!isAllowedObject(params.object)) {
            return Response.json({ error: "Unsupported Salesforce object." }, { status: 400 });
          }
          if (!isValidSfId(params.id)) {
            return Response.json({ error: "Invalid Salesforce record ID." }, { status: 400 });
          }
          const session = await requireSession(request);

          const { session: refreshed } = await sfRequest<void>(
            request,
            session,
            `/services/data/${SF_API_VERSION}/sobjects/${params.object}/${params.id}`,
            { method: "DELETE" },
          );

          return await withRefreshedCookie(Response.json({ success: true }), refreshed);
        } catch (error) {
          return errorResponse(error);
        }
      },
    },
  },
});
