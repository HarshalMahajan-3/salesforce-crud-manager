/** Client-side API service. All Salesforce traffic goes through our server. */

import type { SfListResponse } from "@/lib/salesforce/objects";

const BASE = "/api/public";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new ApiError("Network error. Please check your connection and try again.", 0);
  }

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      (data as { error?: string } | null)?.error ??
      "Unable to reach Salesforce right now. Please try again.";
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export interface MeResponse {
  authenticated: boolean;
  user?: { name: string; email?: string; username?: string; organizationId?: string };
  instanceHost?: string;
}

export const api = {
  me: () => request<MeResponse>("/auth/me"),

  logout: () => request<{ success: boolean }>("/auth/logout", { method: "POST" }),

  listRecords: (object: string, options: { next?: string | null; search?: string } = {}) => {
    const params = new URLSearchParams();
    if (options.next) params.set("next", options.next);
    if (options.search) params.set("search", options.search);
    const qs = params.toString();
    return request<SfListResponse>(`/salesforce/${object}${qs ? `?${qs}` : ""}`);
  },

  createRecord: (object: string, payload: Record<string, unknown>) =>
    request<{ id: string; success: boolean }>(`/salesforce/${object}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateRecord: (object: string, id: string, payload: Record<string, unknown>) =>
    request<{ success: boolean }>(`/salesforce/${object}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteRecord: (object: string, id: string) =>
    request<{ success: boolean }>(`/salesforce/${object}/${id}`, { method: "DELETE" }),
};
