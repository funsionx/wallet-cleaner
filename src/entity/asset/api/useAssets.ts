"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

export type UiAsset = {
  id: string;
  chainId: number;
  type: "erc20";
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  logo?: string | null;
  usdPrice: number | null;
  usdValue: number | null;
  isScam: boolean;
  scamReason?: string | null;
};

export function useAssets() {
  const { address } = useAccount();
  const query = useQuery({
    queryKey: ["assets", address],
    queryFn: async (): Promise<UiAsset[]> => {
      if (!address) return [];
      // Базовая загрузка без AI — быстрый список активов
      const url = `/api/assets?address=${address}&prices=1`;
      const res = await fetch(url, {
        cache: "force-cache",
        next: { revalidate: 60 },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.assets ?? []) as UiAsset[];
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
  return {
    assets: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
