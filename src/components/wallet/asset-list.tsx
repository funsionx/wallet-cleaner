"use client";

import { useEffect, useMemo, useState } from "react";
import { useAssets } from "@/hooks/useAssets";

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
        : assets.map((a) => ({
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
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-3">
      <div className="flex items-center gap-2 mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search assets..."
          className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
        />
      </div>
      <ul className="divide-y divide-black/5 dark:divide-white/10">
        {isLoading && (
          <li className="text-sm text-black/60 dark:text-white/60 p-3">
            Loading assets...
          </li>
        )}
        {filtered.length === 0 && (
          <li className="text-sm text-black/60 dark:text-white/60 p-3">
            {isLoading ? "" : "Empty (connect wallet to load assets)"}
          </li>
        )}
        {filtered.map((asset) => (
          <li key={asset.id} className="flex items-center justify-between p-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium flex items-center gap-2">
                {asset.symbol ? `${asset.symbol} · ${asset.name}` : asset.name}
                {asset.isScam && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-600/10 text-red-700 dark:text-red-300 border border-red-600/20">
                    SCAM
                  </span>
                )}
              </span>
              <div className="text-xs text-black/60 dark:text-white/60 flex gap-2">
                {asset.amount && <span>{asset.amount}</span>}
                {typeof (asset as { usdValue?: number }).usdValue ===
                  "number" && (
                  <span>
                    (${(asset as { usdValue?: number }).usdValue!.toFixed(4)}$)
                  </span>
                )}
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(asset.id)}
                onChange={() => toggle(asset.id)}
              />
              <span>Select</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
