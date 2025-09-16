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
  usdPrice: number | null;
  usdValue: number | null;
  isScam: boolean;
};

export function useAssets() {
  const { address } = useAccount();
  const query = useQuery({
    queryKey: ["assets", address],
    queryFn: async (): Promise<UiAsset[]> => {
      if (!address) return [];
      const url = `/api/assets?address=${address}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.assets ?? []) as UiAsset[];
    },
    staleTime: 30_000,
  });
  return {
    assets: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
