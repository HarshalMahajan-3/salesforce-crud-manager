import { Eye, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatFieldValue, recordTitle, tableFields, type SfRecord } from "@/lib/salesforce/objects";
import { StatusBadge } from "./StatusBadge";

interface DataTableProps {
  object: string;
  records: SfRecord[];
  onView: (record: SfRecord) => void;
  onEdit: (record: SfRecord) => void;
  onDelete: (record: SfRecord) => void;
}

export function DataTable({ object, records, onView, onEdit, onDelete }: DataTableProps) {
  const fields = tableFields(object);

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {fields.map((field) => (
                <TableHead key={field.name} className="whitespace-nowrap text-xs uppercase tracking-wide">
                  {field.label}
                </TableHead>
              ))}
              <TableHead className="w-[140px] text-right text-xs uppercase tracking-wide">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.Id} className="transition-colors hover:bg-secondary/50">
                {fields.map((field) => (
                  <TableCell key={field.name} className="max-w-[240px] truncate align-middle">
                    {field.badge && record[field.name] ? (
                      <StatusBadge value={String(record[field.name])} />
                    ) : (
                      formatFieldValue(field, record[field.name])
                    )}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <RowActions
                    record={record}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card list */}
      <ul className="divide-y divide-border md:hidden">
        {records.map((record) => (
          <li key={record.Id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium leading-tight">{recordTitle(object, record)}</p>
              <RowActions record={record} onView={onView} onEdit={onEdit} onDelete={onDelete} />
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              {fields.slice(1).map((field) => (
                <div key={field.name} className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{field.label}</dt>
                  <dd className="truncate">
                    {field.badge && record[field.name] ? (
                      <StatusBadge value={String(record[field.name])} />
                    ) : (
                      formatFieldValue(field, record[field.name])
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

function RowActions({
  record,
  onView,
  onEdit,
  onDelete,
}: {
  record: SfRecord;
  onView: (r: SfRecord) => void;
  onEdit: (r: SfRecord) => void;
  onDelete: (r: SfRecord) => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-end gap-1">
      <Button variant="ghost" size="icon" aria-label="View record" onClick={() => onView(record)}>
        <Eye className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Edit record" onClick={() => onEdit(record)}>
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Delete record"
        className="text-destructive hover:text-destructive"
        onClick={() => onDelete(record)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
