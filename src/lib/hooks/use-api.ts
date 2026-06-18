"use client";
import { useState, useEffect, useCallback } from "react";
import { classifyDbError, type DbError } from "@/lib/supabase/errors";

export function useApi<T>(url: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(url)
      .then(async (res) => {
        const json = await res.json();
        if (json.error) {
          const cls = classifyDbError(json.error);
          setError(cls.message);
        } else {
          setData(json);
        }
      })
      .catch((e) => {
        const cls = classifyDbError(e);
        setError(cls.message);
      })
      .finally(() => setLoading(false));
  }, [url, refreshKey]);

  return { data, loading, error, refresh };
}
