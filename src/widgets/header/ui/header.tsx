"use client";

import { useTranslations } from "next-intl";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useAccount } from "wagmi";
import { useAssets } from "@/entity/asset/api/useAssets";
import { useNetworkFilter } from "@/shared/model/network-filter";
import { useExcludedAssets } from "@/entity/asset";
import { useMemo } from "react";

const CHAIN_NAMES: Record<number, { en: string; ru: string }> = {
  1: { en: "Ethereum", ru: "Ethereum" },
  8453: { en: "Base", ru: "Base" },
  42161: { en: "Arbitrum", ru: "Arbitrum" },
  10: { en: "Optimism", ru: "Optimism" },
  137: { en: "Polygon", ru: "Polygon" },
};

export function Header() {
  const t = useTranslations("app");
  const pathname = usePathname();
  const { address } = useAccount();
  const { assets } = useAssets();
  const { networkFilter } = useNetworkFilter();
  const { isExcluded } = useExcludedAssets();
  const isRu = pathname?.startsWith("/ru") ?? false;
  const switchTo = isRu
    ? "/en" + pathname!.slice(3)
    : "/ru" + pathname!.slice(3);

  const stats = useMemo(() => {
    const filtered = assets.filter((a) =>
      networkFilter === "all" ? true : a.chainId === networkFilter
    );
    const scamCount = filtered.filter(
      (a) => a.isScam && !isExcluded(a.id)
    ).length;
    const totalCount = filtered.length;
    return { scamCount, totalCount };
  }, [assets, networkFilter, isExcluded]);

  const networkName = useMemo(() => {
    if (networkFilter === "all") return null;
    return (
      CHAIN_NAMES[networkFilter]?.[isRu ? "ru" : "en"] ||
      `Chain ${networkFilter}`
    );
  }, [networkFilter, isRu]);

  return (
    <header className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-fuchsia-500/10 to-indigo-500/10 opacity-50" />
      <div className="relative flex items-center justify-between gap-4 p-4 max-md:flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 opacity-20 blur-xl" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold">
              <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
                Clean
              </span>
              <span className="bg-gradient-to-r from-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                Folio
              </span>
            </h1>
            {address && stats.totalCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-white/60">
                <span>
                  {isRu ? "Ваши активы" : "Your assets"}
                  {networkName && (
                    <>
                      {" "}
                      {isRu ? "в сети" : "on"}{" "}
                      <span className="text-white/80 font-semibold">
                        {networkName}
                      </span>
                    </>
                  )}
                  : {stats.totalCount}
                </span>
                {stats.scamCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-red-400 font-semibold">
                      {stats.scamCount} SCAM
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-all hover:border-white/20 hover:bg-white/10"
            href={switchTo}
          >
            <span className="relative z-10">{t("language")}</span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          </Link>
          <ConnectButton showBalance={false} />
        </div>
      </div>
    </header>
  );
}
