import { useEffect, useState } from "react";
import type { Option } from "@/lib/form/reference-types";

let cached: Option[] | null = null;

// Loads the school list once. If it fails, people can still type their school.
export function useSchools(): Option[] {
  const [schools, setSchools] = useState<Option[]>(cached ?? []);

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    fetch("/api/schools")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((list: Option[]) => {
        cached = list;
        if (!cancelled) setSchools(list);
      })
      .catch((err) => console.error("Could not load schools", err));
    return () => {
      cancelled = true;
    };
  }, []);

  return schools;
}
