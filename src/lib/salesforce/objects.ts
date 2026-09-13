export const SF_API_VERSION = "v62.0";

export type SfFieldType =
  | "text"
  | "textarea"
  | "email"
  | "tel"
  | "url"
  | "number"
  | "currency"
  | "date"
  | "picklist";

export interface SfFieldConfig {
  /** Salesforce API field name */
  name: string;
  label: string;
  type: SfFieldType;
  /** Show as a column in the data table */
  inTable?: boolean;
  /** Field can be sent on create/update */
  editable?: boolean;
  required?: boolean;
  /** Render value as a badge (status/stage/priority style fields) */
  badge?: boolean;
  /** Included in the search filter (text-like fields only) */
  searchable?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface SfObjectConfig {
  /** Salesforce API object name */
  name: string;
  label: string;
  plural: string;
  /** SOQL ORDER BY clause */
  orderBy: string;
  fields: SfFieldConfig[];
}

const INDUSTRIES = [
  "Agriculture",
  "Banking",
  "Consulting",
  "Education",
  "Electronics",
  "Energy",
  "Engineering",
  "Finance",
  "Healthcare",
  "Manufacturing",
  "Media",
  "Retail",
  "Technology",
  "Telecommunications",
  "Transportation",
  "Other",
];

export const SF_OBJECTS: Record<string, SfObjectConfig> = {
  Account: {
    name: "Account",
    label: "Account",
    plural: "Accounts",
    orderBy: "CreatedDate DESC",
    fields: [
      { name: "Id", label: "Record ID", type: "text" },
      {
        name: "Name",
        label: "Account Name",
        type: "text",
        inTable: true,
        editable: true,
        required: true,
        searchable: true,
        placeholder: "ABC Technologies",
      },
      {
        name: "Phone",
        label: "Phone",
        type: "tel",
        inTable: true,
        editable: true,
        searchable: true,
        placeholder: "+1 415 555 0100",
      },
      {
        name: "Website",
        label: "Website",
        type: "url",
        inTable: true,
        editable: true,
        searchable: true,
        placeholder: "abc.com",
      },
      {
        name: "Industry",
        label: "Industry",
        type: "picklist",
        inTable: true,
        editable: true,
        badge: true,
        options: INDUSTRIES,
      },
      {
        name: "Type",
        label: "Type",
        type: "picklist",
        editable: true,
        options: [
          "Prospect",
          "Customer - Direct",
          "Customer - Channel",
          "Channel Partner / Reseller",
          "Installation Partner",
          "Technology Partner",
          "Other",
        ],
      },
    ],
  },

  Opportunity: {
    name: "Opportunity",
    label: "Opportunity",
    plural: "Opportunities",
    orderBy: "CreatedDate DESC",
    fields: [
      { name: "Id", label: "Record ID", type: "text" },
      {
        name: "Name",
        label: "Opportunity Name",
        type: "text",
        inTable: true,
        editable: true,
        required: true,
        searchable: true,
        placeholder: "Enterprise licence renewal",
      },
      {
        name: "Amount",
        label: "Amount",
        type: "currency",
        inTable: true,
        editable: true,
        placeholder: "50000",
      },
      {
        name: "StageName",
        label: "Stage",
        type: "picklist",
        inTable: true,
        editable: true,
        required: true,
        badge: true,
        options: [
          "Prospecting",
          "Qualification",
          "Needs Analysis",
          "Value Proposition",
          "Id. Decision Makers",
          "Proposal/Price Quote",
          "Negotiation/Review",
          "Closed Won",
          "Closed Lost",
        ],
      },
      {
        name: "CloseDate",
        label: "Close Date",
        type: "date",
        inTable: true,
        editable: true,
        required: true,
      },
      {
        name: "Probability",
        label: "Probability (%)",
        type: "number",
        editable: true,
        placeholder: "60",
      },
    ],
  },

  Lead: {
    name: "Lead",
    label: "Lead",
    plural: "Leads",
    orderBy: "CreatedDate DESC",
    fields: [
      { name: "Id", label: "Record ID", type: "text" },
      {
        name: "FirstName",
        label: "First Name",
        type: "text",
        inTable: true,
        editable: true,
        searchable: true,
      },
      {
        name: "LastName",
        label: "Last Name",
        type: "text",
        inTable: true,
        editable: true,
        required: true,
        searchable: true,
      },
      {
        name: "Company",
        label: "Company",
        type: "text",
        inTable: true,
        editable: true,
        required: true,
        searchable: true,
      },
      {
        name: "Email",
        label: "Email",
        type: "email",
        inTable: true,
        editable: true,
        searchable: true,
      },
      { name: "Phone", label: "Phone", type: "tel", inTable: true, editable: true, searchable: true },
      {
        name: "Status",
        label: "Status",
        type: "picklist",
        editable: true,
        badge: true,
        options: ["Open - Not Contacted", "Working - Contacted", "Closed - Converted", "Closed - Not Converted"],
      },
    ],
  },

  Contact: {
    name: "Contact",
    label: "Contact",
    plural: "Contacts",
    orderBy: "CreatedDate DESC",
    fields: [
      { name: "Id", label: "Record ID", type: "text" },
      {
        name: "FirstName",
        label: "First Name",
        type: "text",
        inTable: true,
        editable: true,
        searchable: true,
      },
      {
        name: "LastName",
        label: "Last Name",
        type: "text",
        inTable: true,
        editable: true,
        required: true,
        searchable: true,
      },
      {
        name: "Email",
        label: "Email",
        type: "email",
        inTable: true,
        editable: true,
        searchable: true,
      },
      { name: "Phone", label: "Phone", type: "tel", inTable: true, editable: true, searchable: true },
      {
        name: "Title",
        label: "Title",
        type: "text",
        inTable: true,
        editable: true,
        searchable: true,
        placeholder: "Head of Operations",
      },
      {
        name: "AccountId",
        label: "Account ID",
        type: "text",
        editable: true,
        placeholder: "001XXXXXXXXXXXXXXX",
      },
    ],
  },

  Case: {
    name: "Case",
    label: "Case",
    plural: "Cases",
    orderBy: "CreatedDate DESC",
    fields: [
      { name: "Id", label: "Record ID", type: "text" },
      { name: "CaseNumber", label: "Case Number", type: "text", inTable: true, searchable: true },
      {
        name: "Subject",
        label: "Subject",
        type: "text",
        inTable: true,
        editable: true,
        required: true,
        searchable: true,
        placeholder: "Unable to log in",
      },
      {
        name: "Status",
        label: "Status",
        type: "picklist",
        inTable: true,
        editable: true,
        badge: true,
        options: ["New", "Working", "Escalated", "Closed"],
      },
      {
        name: "Priority",
        label: "Priority",
        type: "picklist",
        inTable: true,
        editable: true,
        badge: true,
        options: ["High", "Medium", "Low"],
      },
      {
        name: "Origin",
        label: "Origin",
        type: "picklist",
        inTable: true,
        editable: true,
        badge: true,
        options: ["Phone", "Email", "Web"],
      },
      { name: "Description", label: "Description", type: "textarea", editable: true },
    ],
  },
};

export const ALLOWED_OBJECTS = Object.keys(SF_OBJECTS);

export type SfObjectName = keyof typeof SF_OBJECTS;

export const PAGE_SIZE = 20;

export interface SfRecord {
  Id: string;
  attributes?: { type: string; url: string };
  [key: string]: unknown;
}

export interface SfListResponse {
  records: SfRecord[];
  totalSize: number;
  done: boolean;
  nextUrl: string | null;
}

export function isAllowedObject(name: string | undefined): name is string {
  return !!name && Object.prototype.hasOwnProperty.call(SF_OBJECTS, name);
}

/** Salesforce IDs are 15 or 18 alphanumeric characters. */
export function isValidSfId(id: string | undefined): boolean {
  return !!id && /^[a-zA-Z0-9]{15}([a-zA-Z0-9]{3})?$/.test(id);
}

/** Whitelisted lookup — throws for anything outside the supported objects. */
export function getObjectConfig(object: string): SfObjectConfig {
  const config = SF_OBJECTS[object];
  if (!config) throw new Error(`Unsupported Salesforce object: ${object}`);
  return config;
}

export function tableFields(object: string): SfFieldConfig[] {
  return getObjectConfig(object).fields.filter((f) => f.inTable);
}

export function editableFields(object: string): SfFieldConfig[] {
  return getObjectConfig(object).fields.filter((f) => f.editable);
}

export function queryFields(object: string): string[] {
  const fields = getObjectConfig(object).fields.map((f) => f.name);
  return fields.includes("Id") ? fields : ["Id", ...fields];
}

export function formatFieldValue(field: SfFieldConfig, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (field.type === "currency") {
    const n = Number(value);
    return Number.isFinite(n)
      ? n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })
      : String(value);
  }
  if (field.type === "date") {
    const d = new Date(String(value));
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
  }
  return String(value);
}

export function recordTitle(object: string, record: SfRecord): string {
  if (object === "Case") return `Case ${record["CaseNumber"] ?? ""}`.trim();
  if (object === "Lead" || object === "Contact") {
    return [record["FirstName"], record["LastName"]].filter(Boolean).join(" ") || String(record.Id);
  }
  return String(record["Name"] ?? record.Id);
}
