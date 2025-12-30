"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip";
import { useAssets } from "@/entity/asset/api/useAssets";
import Image from "next/image";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Filter,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import { useExcludedAssets } from "@/entity/asset";
import { useNetworkFilter } from "@/shared/model/network-filter";

export type MockAsset = {
  id: string;
  type: "erc20" | "erc721";
  symbol?: string;
  name: string;
  amount?: string;
  isScam?: boolean;
  usdValue?: number | null;
  logo?: string | null;
};

const MOCK_ASSETS: MockAsset[] = [];

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  8453: "Base",
  42161: "Arbitrum",
  10: "Optimism",
  137: "Polygon",
};

const CHAIN_COLORS: Record<number, string> = {
  1: "from-blue-500 to-blue-600",
  8453: "from-blue-400 to-indigo-500",
  42161: "from-blue-500 to-cyan-500",
  10: "from-red-500 to-pink-500",
  137: "from-purple-500 to-violet-600",
};

export function AssetList({
  selected,
  onChangeSelected,
}: {
  selected: string[];
  onChangeSelected: (next: string[]) => void;
}) {
  const t = useTranslations("app");
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [aiLoading, setAiLoading] = useState(false);
  const [query, setQuery] = useState("");
  const { networkFilter, setNetworkFilter } = useNetworkFilter();
  const [mode, setMode] = useState<"flat" | "grouped">("grouped");
  const { assets, isLoading, isFetching, refetch } = useAssets();
  const { addExcludedAsset, isExcluded, clearAll } = useExcludedAssets();

  // Auto-select scam tokens (excluding user-marked as not scam)
  useEffect(() => {
    const scam = assets
      .filter((a) => a.isScam && !isExcluded(a.id))
      .map((a) => a.id);
    if (scam.length === 0) return;

    // Only add new scam tokens that aren't already selected
    const newScamTokens = scam.filter((id) => !selected.includes(id));
    if (newScamTokens.length > 0) {
      onChangeSelected([...selected, ...newScamTokens]);
    }
  }, [assets, isExcluded, selected, onChangeSelected]);

  // Deselect tokens from other chains when network filter changes
  const prevNetworkFilter = React.useRef(networkFilter);
  useEffect(() => {
    // Only filter when network actually changes (not on initial mount)
    if (prevNetworkFilter.current === networkFilter) return;
    prevNetworkFilter.current = networkFilter;

    if (networkFilter === "all") return;

    // When switching to a specific network, keep only tokens from that network
    const currentChainTokens = assets
      .filter((a) => a.chainId === networkFilter)
      .map((a) => a.id);
    const filteredSelected = selected.filter((id) =>
      currentChainTokens.includes(id)
    );
    if (filteredSelected.length !== selected.length) {
      onChangeSelected(filteredSelected);
    }
  }, [networkFilter, assets, selected, onChangeSelected]);

  type CardAsset = Required<
    Pick<MockAsset, "id" | "type" | "symbol" | "name">
  > & {
    amount?: string;
    usdValue?: number | null;
    isScam?: boolean;
    logo?: string | null;
    chainId?: number;
    scamReason?: string | null;
  };

  const prepared = useMemo<CardAsset[]>(() => {
    const q = query.trim().toLowerCase();
    const list: CardAsset[] =
      assets.length === 0
        ? (MOCK_ASSETS as CardAsset[])
        : assets
            .slice()
            .filter((a) =>
              networkFilter === "all" ? true : a.chainId === networkFilter
            )
            .map((a) => ({
              id: a.id,
              type: "erc20" as const,
              symbol: a.symbol,
              name: a.name,
              amount: a.balance,
              usdValue: a.usdValue,
              isScam: a.isScam && !isExcluded(a.id),
              logo: (a as unknown as { logo?: string | null }).logo ?? null,
              chainId: a.chainId,
              scamReason:
                (a as unknown as { scamReason?: string | null }).scamReason ??
                null,
            }))
            .sort((a, b) => Number(b.isScam) - Number(a.isScam));
    if (!q) return list;
    return list.filter((a) =>
      `${a.name} ${a.symbol ?? ""}`.toLowerCase().includes(q)
    );
  }, [query, assets, networkFilter, isExcluded]);

  const toggle = (id: string) => {
    const asset = prepared.find((a) => a.id === id);
    if (!asset) return;

    // If we're on a specific network filter, only allow toggling tokens from that network
    if (networkFilter !== "all" && asset.chainId !== networkFilter) {
      return;
    }

    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    onChangeSelected(next);
  };

  const handleExcludeFromScam = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    addExcludedAsset(id);
    // Remove from selected
    onChangeSelected(selected.filter((x) => x !== id));
  };

  const handlePickOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Clear all SCAM selections and only select this one SCAM token
    const asset = prepared.find((a) => a.id === id);
    if (!asset) return;

    // Keep non-SCAM tokens selected, but remove all SCAM tokens except this one
    const nonScamSelected = selected.filter((selectedId) => {
      const selectedAsset = prepared.find((a) => a.id === selectedId);
      return selectedAsset && !selectedAsset.isScam;
    });

    onChangeSelected([...nonScamSelected, id]);
  };

  const handleResetScamDetection = async () => {
    if (!address) return;
    // Clear all excluded assets
    clearAll();
    // Reload assets to re-detect SCAM
    try {
      setAiLoading(true);
      await queryClient.invalidateQueries({
        queryKey: ["assets", address],
      });
      await refetch();
    } finally {
      setAiLoading(false);
    }
  };

  const Section = ({ title, items }: { title: string; items: CardAsset[] }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white/80">
          {title}
        </h3>
        <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
        <span className="text-xs text-white/40">{items.length}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((asset) => {
          const isSelected = selected.includes(asset.id);
          return (
            <div
              key={`${asset.id}-${asset.chainId}-${asset.amount ?? ""}`}
              onClick={() => toggle(asset.id)}
              className={`group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer ${
                isSelected
                  ? "border-indigo-500/50 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 shadow-lg shadow-indigo-500/20"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10" />
              )}

              {/* Deselect button for selected items */}
              {isSelected && (
                <button
                  onClick={handleExcludeFromScam.bind(null, asset.id)}
                  className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 border border-red-500/30 text-red-400 opacity-0 transition-all hover:bg-red-500/30 hover:scale-110 group-hover:opacity-100"
                  title={
                    asset.isScam
                      ? t("language") === "EN"
                        ? "Mark as not SCAM"
                        : "Отметить как не SCAM"
                      : t("language") === "EN"
                      ? "Deselect"
                      : "Снять выделение"
                  }
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Pick One button for SCAM items */}
              {asset.isScam && scamItems.length > 1 && (
                <button
                  onClick={handlePickOne.bind(null, asset.id)}
                  className="absolute right-10 top-2 z-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 px-2 py-1 text-[10px] font-semibold text-indigo-400 opacity-0 transition-all hover:bg-indigo-500/30 hover:scale-105 group-hover:opacity-100"
                  title={
                    t("language") === "EN"
                      ? "Select only this SCAM token"
                      : "Выбрать только этот SCAM токен"
                  }
                >
                  {t("language") === "EN" ? "Pick One" : "Только этот"}
                </button>
              )}

              <div className="relative p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                      {asset.logo ? (
                        <Image
                          src={asset.logo}
                          alt={asset.symbol || asset.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-white/10 to-white/5">
                          <span className="text-xs font-bold text-white/60">
                            {(asset.symbol || asset.name).slice(0, 2)}
                          </span>
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 animate-in zoom-in duration-200">
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="truncate text-base font-bold text-white">
                          {asset.symbol || asset.name}
                        </span>
                        {asset.isScam && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400 animate-in fade-in duration-200">
                                <AlertTriangle className="h-3 w-3" />
                                SCAM
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {asset.scamReason || t("aiDefaultReason")}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <p className="truncate text-xs text-white/50">
                        {asset.name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    {asset.amount && (
                      <p className="text-sm font-semibold text-white/80">
                        {parseFloat(asset.amount).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    )}
                    {typeof asset.usdValue === "number" && (
                      <p className="text-xs text-white/50">
                        ${asset.usdValue.toFixed(4)}
                      </p>
                    )}
                  </div>
                  {asset.chainId && (
                    <div
                      className={`rounded-full bg-gradient-to-r ${
                        CHAIN_COLORS[asset.chainId] ||
                        "from-gray-500 to-gray-600"
                      } px-2 py-1 text-[10px] font-bold text-white shadow-lg`}
                    >
                      {CHAIN_NAMES[asset.chainId] || `Chain ${asset.chainId}`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const scamItems = prepared.filter((i) => i.isScam);
  const normalItems = prepared.filter((i) => !i.isScam);

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <select
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={networkFilter as unknown as string}
            onChange={(e) =>
              setNetworkFilter(
                (e.target.value === "all"
                  ? "all"
                  : (Number(e.target.value) as 1 | 8453 | 42161 | 10 | 137)) as
                  | "all"
                  | 1
                  | 8453
                  | 42161
                  | 10
                  | 137
              )
            }
          >
            <option value="all">{t("allNetworks")}</option>
            <option value={1}>Ethereum</option>
            <option value={8453}>Base</option>
            <option value={42161}>Arbitrum</option>
            <option value={10}>Optimism</option>
            <option value={137}>Polygon</option>
          </select>

          <select
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={mode}
            onChange={(e) => setMode(e.target.value as "flat" | "grouped")}
          >
            <option value="grouped">{t("grouped")}</option>
            <option value="flat">{t("flat")}</option>
          </select>

          <button
            onClick={handleResetScamDetection}
            disabled={isFetching || isLoading || aiLoading}
            className="group relative flex items-center gap-2 overflow-hidden rounded-lg border border-indigo-500/30 bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/20 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:border-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              t("language") === "EN"
                ? "Reset SCAM detection and clear exclusions"
                : "Сбросить определение SCAM и очистить исключения"
            }
          >
            <Sparkles className="h-4 w-4" />
            <span>{aiLoading ? t("aiAnalyzing") : t("aiSelectScam")}</span>
            {!aiLoading && (
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            )}
          </button>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 backdrop-blur-xl">
        {(isLoading || isFetching || aiLoading) && (
          <div className="flex items-center justify-center gap-3 py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
            <span className="text-sm text-white/60">{t("processing")}</span>
          </div>
        )}

        {!isLoading && prepared.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <Filter className="h-8 w-8 text-white/40" />
            </div>
            <p className="text-sm text-white/60">{t("empty")}</p>
          </div>
        )}

        {!isLoading && !isFetching && !aiLoading && prepared.length > 0 && (
          <div className="space-y-8">
            {mode === "grouped" ? (
              <>
                {scamItems.length > 0 && (
                  <Section title="⚠️ SCAM" items={scamItems} />
                )}
                {normalItems.length > 0 && (
                  <Section title={t("tokens")} items={normalItems} />
                )}
              </>
            ) : (
              <Section title={t("assets")} items={prepared} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
