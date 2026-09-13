import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/salesforce/AppHeader";
import { DataTable } from "@/components/salesforce/DataTable";
import { DeleteConfirmDialog } from "@/components/salesforce/DeleteConfirmDialog";
import { ObjectSelector } from "@/components/salesforce/ObjectSelector";
import { RecordFormModal } from "@/components/salesforce/RecordFormModal";
import { RecordViewModal } from "@/components/salesforce/RecordViewModal";
import {
  EmptyState,
  EndOfResults,
  ErrorState,
  LoadingMore,
  TableSkeleton,
} from "@/components/salesforce/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type MeResponse } from "@/lib/api";
import { useSalesforceRecords } from "@/hooks/useSalesforceRecords";
import { getObjectConfig, recordTitle, tableFields, type SfRecord } from "@/lib/salesforce/objects";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Salesforce CRUD Manager" },
      {
        name: "description",
        content:
          "Browse, create, update and delete Salesforce Accounts, Opportunities, Leads, Contacts and Cases with 20-record infinite scrolling.",
      },
      { property: "og:title", content: "Dashboard — Salesforce CRUD Manager" },
      {
        property: "og:description",
        content: "Full CRUD over five standard Salesforce objects in one dashboard.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const [object, setObject] = useState<string>("Account");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [viewRecord, setViewRecord] = useState<SfRecord | null>(null);
  const [formRecord, setFormRecord] = useState<SfRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SfRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const records = useSalesforceRecords(object, search);
  const config = getObjectConfig(object);
  const columns = tableFields(object).length + 1;

  // Session check
  useEffect(() => {
    api
      .me()
      .then((data) => {
        if (!data.authenticated) {
          void navigate({ to: "/" });
          return;
        }
        setMe(data);
      })
      .catch(() => void navigate({ to: "/" }));
  }, [navigate]);

  // Session lost while browsing
  useEffect(() => {
    if (records.unauthorized) {
      toast.error("Your Salesforce session expired. Please sign in again.");
      void navigate({ to: "/" });
    }
  }, [records.unauthorized, navigate]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadMore = records.loadMore;
  const canLoadMore = records.hasMore && !records.loading && !records.loadingMore && !records.error;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !canLoadMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [canLoadMore, loadMore]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.logout();
    } catch {
      /* clearing the session locally is enough */
    }
    void navigate({ to: "/" });
  };

  const handleObjectChange = useCallback((next: string) => {
    setObject(next);
    setSearchInput("");
    setSearch("");
  }, []);

  const openCreate = () => {
    setFormRecord(null);
    setFormOpen(true);
  };

  const openEdit = (record: SfRecord) => {
    setFormRecord(record);
    setFormOpen(true);
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      if (formRecord) {
        await api.updateRecord(object, String(formRecord.Id), values);
        records.applyLocalUpdate(String(formRecord.Id), values);
        toast.success(`${config.label} updated in Salesforce.`);
      } else {
        await api.createRecord(object, values);
        toast.success(`${config.label} created in Salesforce.`);
        await records.reload();
      }
      setFormOpen(false);
      setFormRecord(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The record could not be saved.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteRecord(object, String(deleteTarget.Id));
      records.removeLocal(String(deleteTarget.Id));
      toast.success(`${config.label} deleted from Salesforce.`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The record could not be deleted.");
    } finally {
      setDeleting(false);
    }
  };

  const summary = useMemo(() => {
    if (records.loading) return "Loading records…";
    const loaded = records.records.length;
    return `${loaded} of ${records.totalSize || loaded} ${config.plural.toLowerCase()} loaded`;
  }, [records.loading, records.records.length, records.totalSize, config.plural]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        object={object}
        onObjectChange={handleObjectChange}
        userName={me?.user?.name}
        instanceHost={me?.instanceHost}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">{config.plural}</h1>
            <p className="text-sm text-muted-foreground">{summary}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full md:hidden">
              <ObjectSelector value={object} onChange={handleObjectChange} />
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={`Search ${config.plural.toLowerCase()}…`}
                aria-label={`Search ${config.plural}`}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => void records.reload()}
                disabled={records.loading}
                aria-label="Refresh records"
              >
                <RefreshCw className={records.loading ? "size-4 animate-spin" : "size-4"} />
                <span className="ml-1.5 hidden sm:inline">Refresh</span>
              </Button>
              <Button onClick={openCreate} className="flex-1 sm:flex-none">
                <Plus className="size-4" />
                <span className="ml-1.5">Create Record</span>
              </Button>
            </div>
          </div>
        </section>

        <section className="card-elevated overflow-hidden rounded-xl border border-border bg-card">
          {records.loading ? (
            <TableSkeleton columns={columns} />
          ) : records.error && records.records.length === 0 ? (
            <ErrorState message={records.error} onRetry={() => void records.reload()} />
          ) : records.records.length === 0 ? (
            <EmptyState label={config.plural} onCreate={openCreate} />
          ) : (
            <>
              <DataTable
                object={object}
                records={records.records}
                onView={setViewRecord}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
              />
              <div ref={sentinelRef} aria-hidden className="h-px" />
              {records.loadingMore && <LoadingMore />}
              {records.error && !records.loadingMore && (
                <div className="flex flex-col items-center gap-2 py-6 text-sm">
                  <p className="text-destructive">{records.error}</p>
                  <Button size="sm" variant="outline" onClick={() => void records.loadMore()}>
                    Retry
                  </Button>
                </div>
              )}
              {!records.hasMore && !records.loadingMore && !records.error && (
                <EndOfResults count={records.records.length} />
              )}
            </>
          )}
        </section>
      </main>

      <RecordViewModal
        object={object}
        record={viewRecord}
        open={Boolean(viewRecord)}
        onOpenChange={(open) => !open && setViewRecord(null)}
      />

      <RecordFormModal
        object={object}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setFormRecord(null);
        }}
        record={formRecord}
        submitting={submitting}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        recordLabel={deleteTarget ? recordTitle(object, deleteTarget) : undefined}
        deleting={deleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
