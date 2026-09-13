import { AlertTriangle, Inbox, Loader2, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ columns, rows = 8 }: { columns: number; rows?: number }) {
  return (
    <div className="space-y-2 p-4" aria-busy="true" aria-label="Loading records">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-5 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ label, onCreate }: { label: string; onCreate?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="rounded-full bg-secondary p-3">
        <Inbox className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-base font-semibold">No records found.</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        There are no {label} records matching your current view in this Salesforce org.
      </p>
      {onCreate && (
        <Button className="mt-5" onClick={onCreate}>
          Create the first record
        </Button>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="rounded-full bg-destructive/15 p-3">
        <AlertTriangle className="size-6 text-destructive" />
      </div>
      <h3 className="mt-4 text-base font-semibold">Unable to load Salesforce records</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" className="mt-5" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

export function LoadingMore() {
  return (
    <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      Loading more records…
    </div>
  );
}

export function EndOfResults({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
      <CheckCircle2 className="size-4 text-success" />
      You&apos;ve reached the end. {count} record{count === 1 ? "" : "s"} loaded.
    </div>
  );
}
