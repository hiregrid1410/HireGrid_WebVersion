import { useState, useEffect } from "react";
import { api } from "../lib/api";

const cacheMap = new Map();
const listenersMap = new Map(); // path -> Set of state setters

export function useApiData(path, options = {}) {
  const { ttl = 30000, enabled = true } = options;
  
  const [data, setData] = useState(() => {
    if (!path) return null;
    const cached = cacheMap.get(path);
    if (cached) {
      return cached.data;
    }
    return null;
  });
  
  const [loading, setLoading] = useState(() => {
    if (!path || !enabled) return false;
    return !cacheMap.has(path);
  });
  
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!path || !enabled) return;

    if (!listenersMap.has(path)) {
      listenersMap.set(path, new Set());
    }
    const setters = listenersMap.get(path);
    setters.add(setData);

    const fetchData = async () => {
      const now = Date.now();
      const cached = cacheMap.get(path);
      
      if (cached && (now - cached.timestamp < ttl)) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      try {
        if (!cached) setLoading(true);
        const freshData = await api.get(path);
        
        cacheMap.set(path, {
          data: freshData,
          timestamp: Date.now(),
        });

        const activeSetters = listenersMap.get(path);
        if (activeSetters) {
          activeSetters.forEach((setter) => setter(freshData));
        }
        setError(null);
      } catch (err) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      const setters = listenersMap.get(path);
      if (setters) {
        setters.delete(setData);
        if (setters.size === 0) {
          listenersMap.delete(path);
        }
      }
    };
  }, [path, enabled, ttl]);

  const mutate = async (newData) => {
    if (!path) return;
    if (newData !== undefined) {
      cacheMap.set(path, {
        data: newData,
        timestamp: Date.now(),
      });
      const setters = listenersMap.get(path);
      if (setters) {
        setters.forEach((setter) => setter(newData));
      }
    } else {
      cacheMap.delete(path);
      setLoading(true);
      try {
        const freshData = await api.get(path);
        cacheMap.set(path, {
          data: freshData,
          timestamp: Date.now(),
        });
        const setters = listenersMap.get(path);
        if (setters) {
          setters.forEach((setter) => setter(freshData));
        }
      } catch (err) {
        setError(err.message || "Failed to refresh data");
      } finally {
        setLoading(false);
      }
    }
  };

  return { data, loading, error, mutate };
}

export function invalidateCache(pathPattern) {
  if (!pathPattern) {
    cacheMap.clear();
    return;
  }
  for (const key of cacheMap.keys()) {
    if (key.includes(pathPattern)) {
      cacheMap.delete(key);
    }
  }
}
