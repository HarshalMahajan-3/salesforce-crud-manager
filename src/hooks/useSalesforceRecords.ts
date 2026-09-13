import { useCallback, useEffect, useRef, useState } from "react";

import { api, ApiError } from "@/lib/api";
import type { SfRecord } from "@/lib/salesforce/objects";

interface State {
  records: SfRecord[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  nextUrl: string | null;
  totalSize: number;
}

const INITIAL: State = {
  records: [],
  loading: true,
  loadingMore: false,
  error: null,
  nextUrl: null,
  totalSize: 0,
};

/**
 * Loads Salesforce records 20 at a time. The first page uses SOQL; every
 * subsequent page follows the Salesforce `nextRecordsUrl` cursor.
 */
export function useSalesforceRecords(object: string, search: string) {
  const [state, setState] = useState<State>(INITIAL);
  const [unauthorized, setUnauthorized] = useState(false);
  const inFlight = useRef(false);
  const requestId = useRef(0);

  const loadFirstPage = useCallback(async () => {
    const id = ++requestId.current;
    inFlight.current = true;
    setState({ ...INITIAL, loading: true });
    try {
      const data = await api.listRecords(object, { search });
      if (id !== requestId.current) return;
      setState({
        records: data.records,
        loading: false,
        loadingMore: false,
        error: null,
        nextUrl: data.nextUrl,
        totalSize: data.totalSize,
      });
    } catch (error) {
      if (id !== requestId.current) return;
      if (error instanceof ApiError && error.status === 401) setUnauthorized(true);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Unable to load Salesforce records.",
      }));
    } finally {
      if (id === requestId.current) inFlight.current = false;
    }
  }, [object, search]);

  const loadMore = useCallback(async () => {
    if (inFlight.current) return;
    setState((prev) => {
      if (!prev.nextUrl || prev.loading || prev.loadingMore || prev.error) return prev;
      inFlight.current = true;
      return { ...prev, loadingMore: true };
    });
  }, []);

  // Perform the actual "load more" fetch once loadingMore flips on.
  useEffect(() => {
    if (!state.loadingMore || !state.nextUrl) return;
    const id = requestId.current;
    const cursor = state.nextUrl;

    (async () => {
      try {
        const data = await api.listRecords(object, { next: cursor });
        if (id !== requestId.current) return;
        setState((prev) => {
          const seen = new Set(prev.records.map((record) => record.Id));
          const merged = [...prev.records, ...data.records.filter((record) => !seen.has(record.Id))];
          return { ...prev, records: merged, nextUrl: data.nextUrl, loadingMore: false };
        });
      } catch (error) {
        if (id !== requestId.current) return;
        if (error instanceof ApiError && error.status === 401) setUnauthorized(true);
        setState((prev) => ({
          ...prev,
          loadingMore: false,
          error: error instanceof Error ? error.message : "Unable to load more records.",
        }));
      } finally {
        inFlight.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.loadingMore]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const applyLocalUpdate = useCallback((id: string, patch: Record<string, unknown>) => {
    setState((prev) => ({
      ...prev,
      records: prev.records.map((record) => (record.Id === id ? { ...record, ...patch } : record)),
    }));
  }, []);

  const removeLocal = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      records: prev.records.filter((record) => record.Id !== id),
      totalSize: Math.max(0, prev.totalSize - 1),
    }));
  }, []);

  return {
    ...state,
    hasMore: Boolean(state.nextUrl),
    unauthorized,
    reload: loadFirstPage,
    loadMore,
    applyLocalUpdate,
    removeLocal,
  };
}
