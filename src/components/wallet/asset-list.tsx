"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useAssets } from "@/hooks/useAssets";
import { optimism } from "viem/chains";

export type MockAsset = {
  id: string;
  type: "erc20" | "erc721";
  symbol?: string;
  name: string;
  amount?: string;
  isScam?: boolean;
  usdValue?: number;
};

const MOCK_ASSETS: MockAsset[] = [];

export function AssetList({
  selected,
  onChangeSelected,
}: {
  selected: string[];
  onChangeSelected: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const { assets, isLoading } = useAssets();

  // Автовыбор подозрительных активов (SCAM)
  useEffect(() => {
    const scam = assets.filter((a) => a.isScam).map((a) => a.id);
    if (scam.length > 0) {
      onChangeSelected(Array.from(new Set([...selected, ...scam])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets.length]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list =
      assets.length === 0
        ? MOCK_ASSETS
        : assets
            .slice()
            .sort((a, b) => Number(b.isScam) - Number(a.isScam))
            .map((a) => ({
              id: a.id,
              type: "erc20" as const,
              symbol: a.symbol,
              name: a.name,
              amount: a.balance,
              usdValue: a.usdValue,
              isScam: a.isScam,
            }));
    if (!q) return list;
    return list.filter((a) =>
      `${a.name} ${a.symbol ?? ""}`.toLowerCase().includes(q)
    );
  }, [query, assets]);

  const toggle = (id: string) => {
    onChangeSelected(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id]
    );
  };

  return (
    <div className="rounded-xl flex flex-col border border-black/10 dark:border-white/10 p-3">
      <div className="flex items-center gap-2 mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search assets..."
          className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
        />
        <button
          onClick={() =>
            onChangeSelected(assets.filter((a) => a.isScam).map((a) => a.id))
          }
          className="rounded-md border px-3 py-2 text-xs"
        >
          Select SCAM
        </button>
        <button
          onClick={() =>
            onChangeSelected(
              assets
                .filter((a) => !a.isScam)
                .slice(0, 1)
                .map((a) => a.id)
            )
          }
          className="rounded-md border px-3 py-2 text-xs"
        >
          Select one
        </button>
      </div>
      <div className="space-y-2 columns-1 sm:columns-2 xl:columns-3">
        {isLoading && (
          <div className="text-sm text-black/60 dark:text-white/60 p-3">
            Loading assets...
          </div>
        )}
        {filtered.length === 0 && (
          <div className="text-sm text-black/60 dark:text-white/60 p-3">
            {isLoading ? "" : "Empty (connect wallet to load assets)"}
          </div>
        )}
        {filtered.map((asset) => {
          const isSelected = selected.includes(asset.id);
          return (
            <div
              key={asset.id}
              onClick={() => toggle(asset.id)}
              className={`rounded-xl transition-all duration-300 hover:border-indigo-500 p-[1px] cursor-pointer break-inside-avoid ${
                isSelected
                  ? "border border-indigo-500"
                  : "bg-transparent border border-black/10 dark:border-white/10"
              }`}
            >
              <div
                className={`rounded-[11px] p-3 flex flex-col gap-2 ${
                  isSelected
                    ? "bg-white/60 dark:bg-neutral-900"
                    : "bg-white/50 dark:bg-white/5"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium flex items-center gap-2 flex-wrap">
                      <span className="truncate">
                        {asset.symbol ? `${asset.symbol}` : asset.name}
                      </span>
                      {asset.isScam && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-red-600/10 text-red-700 dark:text-red-300 border border-red-600/20 flex-shrink-0">
                              SCAM
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            Suspicious/low-value token detected automatically.
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </span>
                    <span className="text-[10px] opacity-60 truncate">
                      {asset.name}
                    </span>
                  </div>
                  <div className="text-right text-xs opacity-80 ml-2 flex-shrink-0">
                    {asset.amount && (
                      <div className="truncate">{asset.amount}</div>
                    )}
                    {typeof (asset as { usdValue?: number }).usdValue ===
                      "number" && (
                      <div className="truncate">
                        ${(asset as { usdValue?: number }).usdValue!.toFixed(4)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
