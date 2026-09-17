import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../lib/api";

/**
 * useDataFetch — Clean data fetching hook with deduplication, caching,
 * AbortController lifecycle cleanup, retry resilience, and skeleton-ready states.
 */
export function useDataFetch(path, options = {}) {
  const [data, setData] = useState(options.initialData || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async (forceBypassCache = false) => {
    if (!path) return;
    setLoading(true);
    setError(null);

    const controller = new AbortController();

    try {
      const res = await api.get(path, {
        signal: controller.signal,
        bypassCache: forceBypassCache || options.bypassCache,
        ttl: options.ttl,
      });

      if (isMountedRef.current) {
        setData(res);
        setLoading(false);
      }
    } catch (err) {
      if (err.name !== "AbortError" && isMountedRef.current) {
        setError(err);
        setLoading(false);
      }
    }

    return () => {
      controller.abort();
    };
  }, [path, options.bypassCache, options.ttl]);

  useEffect(() => {
    isMountedRef.current = true;
    const cleanup = fetchData();

    return () => {
      isMountedRef.current = false;
      if (typeof cleanup === "function") cleanup();
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  return { data, loading, error, refetch, setData };
}
