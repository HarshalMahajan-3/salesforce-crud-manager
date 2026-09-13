import { PAGE_SIZE, getObjectConfig, queryFields } from "./objects";

export function escapeSoqlLiteral(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/[\r\n]/g, " ");
}

export function buildListQuery(
  object: string,
  search?: string,
  offset = 0,
): string {
  const config = getObjectConfig(object);
  const fields = queryFields(object).join(", ");

  let where = "";
  const term = (search ?? "").trim().slice(0, 80);

  if (term) {
    const literal = `'%${escapeSoqlLiteral(term)}%'`;
    const clauses = config.fields
      .filter((f) => f.searchable)
      .map((f) => `${f.name} LIKE ${literal}`);

    if (clauses.length > 0) {
      where = ` WHERE ${clauses.join(" OR ")}`;
    }
  }

  return `SELECT ${fields} FROM ${config.name}${where} ORDER BY ${config.orderBy} LIMIT ${PAGE_SIZE} OFFSET ${offset}`;
}