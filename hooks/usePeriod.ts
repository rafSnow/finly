"use client";

import { useState, useEffect } from "react";
import { PeriodFilter } from "@/types";

export function usePeriod() {
  const [period, setPeriod] = useState<PeriodFilter>(() => {
    // Try to load from localStorage first
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("finly_last_period");
      if (saved) {
        try {
          return JSON.parse(saved) as PeriodFilter;
        } catch {
          // ignore
        }
      }
    }
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  });

  // Ensure hydration matches server (server has default date, client might have saved date)
  // To avoid UI flicker/warnings, we could just accept the small warning or use a mounted state.
  // Actually, setting state in useEffect avoids the hydration warning but causes an extra render.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const saved = localStorage.getItem("finly_last_period");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as PeriodFilter;
        setPeriod(parsed);
      } catch {
        // ignore
      }
    }
  }, []);

  const handleSetPeriod = (newPeriod: PeriodFilter) => {
    setPeriod(newPeriod);
    localStorage.setItem("finly_last_period", JSON.stringify(newPeriod));
  };

  return { period, setPeriod: handleSetPeriod, mounted };
}
