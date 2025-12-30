"use client";

import { useCleanProgress } from "../model/store";
import {
  CheckCircle2,
  Loader2,
  XCircle,
  ExternalLink,
  Network,
} from "lucide-react";
import { CleanStep } from "../model/types";

const STEP_LABELS: Record<
  CleanStep,
  { en: string; ru: string; icon: React.ReactNode }
> = {
  idle: {
    en: "Waiting...",
    ru: "Ожидание...",
    icon: <div className="h-4 w-4 rounded-full border-2 border-white/20" />,
  },
  switching_chain: {
    en: "Switching network...",
    ru: "Переключение сети...",
    icon: <Loader2 className="h-4 w-4 animate-spin text-blue-400" />,
  },
  checking_approvals: {
    en: "Checking approvals...",
    ru: "Проверка разрешений...",
    icon: <Loader2 className="h-4 w-4 animate-spin text-blue-400" />,
  },
  batch_approving: {
    en: "Approving batch...",
    ru: "Групповое одобрение...",
    icon: <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />,
  },
  transferring: {
    en: "Transferring...",
    ru: "Отправка...",
    icon: <Loader2 className="h-4 w-4 animate-spin text-fuchsia-400" />,
  },
  completed: {
    en: "Completed",
    ru: "Завершено",
    icon: <CheckCircle2 className="h-4 w-4 text-green-400" />,
  },
  error: {
    en: "Error",
    ru: "Ошибка",
    icon: <XCircle className="h-4 w-4 text-red-400" />,
  },
};

const CHAIN_NAMES: Record<number, { name: string; color: string }> = {
  1: { name: "Ethereum", color: "from-blue-500 to-blue-600" },
  8453: { name: "Base", color: "from-blue-400 to-indigo-500" },
  42161: { name: "Arbitrum", color: "from-blue-500 to-cyan-500" },
  10: { name: "Optimism", color: "from-red-500 to-pink-500" },
  137: { name: "Polygon", color: "from-purple-500 to-violet-600" },
};

const getChainExplorer = (chainId: number): string => {
  const explorers: Record<number, string> = {
    1: "https://etherscan.io/tx/",
    8453: "https://basescan.org/tx/",
    42161: "https://arbiscan.io/tx/",
    10: "https://optimistic.etherscan.io/tx/",
    137: "https://polygonscan.com/tx/",
  };
  return explorers[chainId] || "https://etherscan.io/tx/";
};

export function CleanProgressWidget() {
  const { progress, reset } = useCleanProgress();
  const isRu =
    typeof window !== "undefined" && window.location.pathname.startsWith("/ru");

  if (!progress.isActive) return null;

  const progressPercent =
    (progress.completedAssets / progress.totalAssets) * 100;
  const allCompleted = progress.completedAssets === progress.totalAssets;

  // Convert Map to Array for rendering
  const chainEntries = Array.from(progress.chains.entries());

  return (
    <div className="fixed bottom-6 left-6 z-50 w-[480px] animate-in slide-in-from-bottom-4 duration-300">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 shadow-2xl backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10" />

        <div className="relative">
          {/* Header */}
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {isRu ? "Очистка кошелька" : "Cleaning Wallet"}
                </h3>
                <p className="text-sm text-white/60">
                  {progress.completedAssets} / {progress.totalAssets}{" "}
                  {isRu ? "завершено" : "completed"}
                </p>
              </div>
              {allCompleted && (
                <button
                  onClick={reset}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/10"
                >
                  {isRu ? "Закрыть" : "Close"}
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Chains Progress */}
          <div className="max-h-96 overflow-auto p-4">
            <div className="space-y-3">
              {chainEntries.map(([chainId, chainProgress]) => {
                const chainInfo = CHAIN_NAMES[chainId];
                const stepLabel = STEP_LABELS[chainProgress.step];
                const chainAssets = progress.assets.filter(
                  (a) => a.chainId === chainId
                );
                const completedInChain = chainAssets.filter(
                  (a) => a.step === "completed"
                ).length;

                return (
                  <div
                    key={chainId}
                    className={`rounded-xl border p-3 transition-all ${
                      progress.currentChainId === chainId
                        ? "border-indigo-500/50 bg-indigo-500/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    {/* Chain Header */}
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Network className="h-4 w-4 text-white/60" />
                        <span
                          className={`rounded-full bg-gradient-to-r ${
                            chainInfo?.color || "from-gray-500 to-gray-600"
                          } px-2 py-0.5 text-xs font-bold text-white`}
                        >
                          {chainInfo?.name || `Chain ${chainId}`}
                        </span>
                        <span className="text-xs text-white/50">
                          {completedInChain}/{chainAssets.length}
                        </span>
                      </div>
                      {stepLabel.icon}
                    </div>

                    {/* Chain Status */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white/70">
                        {stepLabel[isRu ? "ru" : "en"]}
                      </span>
                      {chainProgress.step === "batch_approving" &&
                        chainProgress.totalApprovals && (
                          <span className="text-xs text-white/50">
                            ({chainProgress.currentApprovalIndex! + 1}/
                            {chainProgress.totalApprovals})
                          </span>
                        )}
                      {chainProgress.step === "transferring" &&
                        chainProgress.totalTransfers && (
                          <span className="text-xs text-white/50">
                            ({chainProgress.currentTransferIndex! + 1}/
                            {chainProgress.totalTransfers})
                          </span>
                        )}
                    </div>

                    {/* Assets in Chain */}
                    {chainAssets.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {chainAssets.slice(0, 3).map((asset) => (
                          <div
                            key={asset.assetId}
                            className="flex items-center gap-2 text-xs"
                          >
                            {STEP_LABELS[asset.step].icon}
                            <span className="flex-1 truncate text-white/60">
                              {asset.assetName}
                            </span>
                            {asset.txHash && (
                              <a
                                href={`${getChainExplorer(chainId)}${
                                  asset.txHash
                                }`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 text-indigo-400 transition-all hover:text-indigo-300"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        ))}
                        {chainAssets.length > 3 && (
                          <div className="text-xs text-white/40">
                            +{chainAssets.length - 3} {isRu ? "ещё" : "more"}...
                          </div>
                        )}
                      </div>
                    )}

                    {chainProgress.error && (
                      <div className="mt-2 text-xs text-red-400">
                        {chainProgress.error}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
