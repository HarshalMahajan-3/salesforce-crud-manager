import { ALLOWED_OBJECTS, getObjectConfig } from "@/lib/salesforce/objects";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ObjectSelectorProps {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean | undefined;
}

export function ObjectSelector({ value, onChange, compact }: ObjectSelectorProps) {
  return (
    <div className={compact ? "" : "space-y-2"}>
      {!compact && (
        <Label htmlFor="object-selector" className="text-sm text-muted-foreground">
          Select Salesforce Object
        </Label>
      )}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="object-selector" className="w-full" aria-label="Select Salesforce object">
          <SelectValue placeholder="Select Salesforce Object" />
        </SelectTrigger>
        <SelectContent>
          {ALLOWED_OBJECTS.map((name) => (
            <SelectItem key={name} value={name}>
              {getObjectConfig(name).label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
