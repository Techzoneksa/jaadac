"use client";

import { useState, useEffect } from "react";

export function useApi<T>(url: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch(() => setError("فشل تحميل البيانات"))
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}
