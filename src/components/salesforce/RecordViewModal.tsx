import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  getObjectConfig,
  formatFieldValue,
  recordTitle,
  type SfRecord,
} from "@/lib/salesforce/objects";
import { StatusBadge } from "./StatusBadge";

interface RecordViewModalProps {
  object: string;
  record: SfRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordViewModal({ object, record, open, onOpenChange }: RecordViewModalProps) {
  if (!record) return null;
  const config = getObjectConfig(object);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{config.label} Details</DialogTitle>
          <DialogDescription>{recordTitle(object, record)}</DialogDescription>
        </DialogHeader>

        <dl className="divide-y divide-border rounded-lg border border-border">
          {config.fields.map((field) => (
            <div key={field.name} className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:items-center">
              <dt className="text-sm text-muted-foreground">{field.label}</dt>
              <dd className="break-words text-sm font-medium sm:col-span-2">
                {field.badge && record[field.name] ? (
                  <StatusBadge value={String(record[field.name])} />
                ) : (
                  formatFieldValue(field, record[field.name])
                )}
              </dd>
            </div>
          ))}
        </dl>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
