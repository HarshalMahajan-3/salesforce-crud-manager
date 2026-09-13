/** Validates and narrows incoming record payloads to whitelisted editable fields. */

import { getObjectConfig } from "./objects";

export function sanitizePayload(object: string, raw: Record<string, unknown>): Record<string, unknown> {
  const config = getObjectConfig(object);
  const result: Record<string, unknown> = {};

  for (const field of config.fields) {
    if (!field.editable) continue;
    const value = raw[field.name];
    if (value === undefined || value === null || value === "") continue;

    if (field.type === "number" || field.type === "currency") {
      const num = Number(value);
      if (!Number.isFinite(num)) continue;
      result[field.name] = num;
      continue;
    }

    if (field.type === "picklist" && field.options && !field.options.includes(String(value))) {
      continue;
    }

    result[field.name] = String(value).slice(0, field.type === "textarea" ? 32000 : 255);
  }

  return result;
}
