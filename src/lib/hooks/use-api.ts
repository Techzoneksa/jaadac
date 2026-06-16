"use client";
import { useState, useEffect } from "react";
import { classifyDbError, type DbError } from "@/lib/supabase/errors";

export function useApi<T>(url: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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
  }, [url]);

  return { data, loading, error };
}
