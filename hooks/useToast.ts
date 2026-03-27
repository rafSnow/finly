"use client";

import { useToastContext } from "@/contexts/ToastContext";

export function useToast(): { showToast: (message: string, type?: "success" | "error" | "info") => void } {
  return useToastContext();
}
