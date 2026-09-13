import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-secondary text-secondary-foreground border-border",
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-destructive/15 text-destructive border-destructive/30",
  info: "bg-primary/15 text-primary border-primary/30",
};

function toneFor(value: string): Tone {
  const v = value.toLowerCase();
  if (/(closed won|converted|customer|closed$)/.test(v)) return "success";
  if (/(closed lost|escalated|high|not converted)/.test(v)) return "danger";
  if (/(working|negotiation|medium|proposal|qualification)/.test(v)) return "warning";
  if (/(new|prospect|open|low|web|email|phone)/.test(v)) return "info";
  return "neutral";
}

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", TONE_CLASS[toneFor(value)], className)}
    >
      {value}
    </Badge>
  );
}
