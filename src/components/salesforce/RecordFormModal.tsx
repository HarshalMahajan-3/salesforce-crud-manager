import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getObjectConfig, editableFields, type SfRecord } from "@/lib/salesforce/objects";

type FormValues = Record<string, string>;

interface RecordFormModalProps {
  object: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Record being edited; null means create mode. */
  record: SfRecord | null;
  submitting: boolean;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
}

function initialValues(object: string, record: SfRecord | null): FormValues {
  const values: FormValues = {};
  for (const field of editableFields(object)) {
    const raw = record?.[field.name];
    values[field.name] = raw === null || raw === undefined ? "" : String(raw);
  }
  return values;
}

export function RecordFormModal({
  object,
  open,
  onOpenChange,
  record,
  submitting,
  onSubmit,
}: RecordFormModalProps) {
  const config = getObjectConfig(object);
  const fields = editableFields(object);
  const [values, setValues] = useState<FormValues>(() => initialValues(object, record));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setValues(initialValues(object, record));
      setErrors({});
    }
  }, [open, object, record]);

  const setValue = (name: string, value: string) =>
    setValues((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    for (const field of fields) {
      const value = (values[field.name] ?? "").trim();
      if (field.required && !value) nextErrors[field.name] = `${field.label} is required.`;
      if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        nextErrors[field.name] = "Enter a valid email address.";
      }
      if ((field.type === "number" || field.type === "currency") && value && !Number.isFinite(Number(value))) {
        nextErrors[field.name] = "Enter a valid number.";
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      const value = (values[field.name] ?? "").trim();
      if (value !== "") payload[field.name] = value;
    }
    await onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (submitting ? undefined : onOpenChange(next))}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {record ? `Edit ${config.label}` : `Create ${config.label}`}
          </DialogTitle>
          <DialogDescription>
            {record
              ? "Update the fields below and save your changes to Salesforce."
              : `Add a new ${config.label} record to your Salesforce org.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-1.5">
              <Label htmlFor={`field-${field.name}`}>
                {field.label}
                {field.required && <span className="ml-1 text-destructive">*</span>}
              </Label>

              {field.type === "picklist" ? (
                <Select
                  value={values[field.name] ?? ""}
                  onValueChange={(value) => setValue(field.name, value)}
                >
                  <SelectTrigger id={`field-${field.name}`}>
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options ?? []).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === "textarea" ? (
                <Textarea
                  id={`field-${field.name}`}
                  rows={4}
                  value={values[field.name] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(event) => setValue(field.name, event.target.value)}
                />
              ) : (
                <Input
                  id={`field-${field.name}`}
                  type={
                    field.type === "date"
                      ? "date"
                      : field.type === "number" || field.type === "currency"
                        ? "number"
                        : field.type === "email"
                          ? "email"
                          : field.type === "tel"
                            ? "tel"
                            : "text"
                  }
                  value={values[field.name] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(event) => setValue(field.name, event.target.value)}
                />
              )}

              {errors[field.name] && (
                <p className="text-xs text-destructive">{errors[field.name]}</p>
              )}
            </div>
          ))}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {record ? "Save changes" : "Create record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
