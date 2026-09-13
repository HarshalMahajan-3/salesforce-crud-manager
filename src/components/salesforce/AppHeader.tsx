import { CloudCog, LogOut, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ObjectSelector } from "./ObjectSelector";

interface AppHeaderProps {
  object: string;
  onObjectChange: (object: string) => void;
  userName?: string | undefined;
  instanceHost?: string | undefined;
  onLogout: () => void;
  loggingOut?: boolean | undefined;
}

export function AppHeader({
  object,
  onObjectChange,
  userName,
  instanceHost,
  onLogout,
  loggingOut,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="accent-gradient flex size-9 items-center justify-center rounded-xl text-primary-foreground">
            <CloudCog className="size-5" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight sm:text-lg">
            Salesforce CRUD Manager
          </span>
        </div>

        <div className="hidden md:ml-4 md:block md:w-56">
          <ObjectSelector value={object} onChange={onObjectChange} compact />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight">{userName ?? "Connected"}</p>
            <p className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success" aria-hidden />
              {instanceHost ?? "Salesforce"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onLogout} disabled={loggingOut}>
            {loggingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            <span className="ml-1.5 hidden sm:inline">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
