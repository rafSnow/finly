"use client";

import { useAuth } from "@/hooks/useAuth";
import { getWealthTracking, WealthHistory } from "@/lib/firestore/patrimonio";
import { Account } from "@/types";
import { useQuery } from "@tanstack/react-query";

interface WealthData {
  currentWealth: number;
  currentInvestments: number;
  history: WealthHistory[];
  accounts: (Account & { balance: number })[];
}

export function usePatrimonio() {
  const { family, loading: authLoading } = useAuth();
  const familyId = family?.id;

  const { data, isLoading, error, refetch } = useQuery<WealthData>({
    queryKey: ["patrimonio", familyId],
    queryFn: async () => {
      if (!familyId) {
        return {
          currentWealth: 0,
          currentInvestments: 0,
          history: [],
          accounts: [],
        };
      }
      return await getWealthTracking(familyId);
    },
    enabled: !authLoading && !!familyId,
  });

  return {
    data,
    loading: isLoading || authLoading,
    error: error ? (error as Error).message : null,
    refresh: refetch,
  };
}
