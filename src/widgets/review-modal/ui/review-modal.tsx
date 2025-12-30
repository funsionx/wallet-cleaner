"use client";

import { useMemo, useState } from "react";
import { useAssets } from "@/entity/asset/api/useAssets";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  Loader2,
  XCircle,
  X,
  AlertTriangle,
  Heart,
} from "lucide-react";
import { useExcludedAssets } from "@/entity/asset/model/use-excluded-assets";
import { useAccount, useBalance } from "wagmi";
import {
  useCleanProgress,
  cleanAssetsWithPermit2,
  type Asset,
} from "@/features/wallet-clean";

type ReviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: string[];
  onChangeSelected: (next: string[]) => void;
  onConfirm: () => void;
};

const USDC_ADDRESSES: Record<number, string> = {
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Ethereum
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base
  42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum
  10: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // Optimism
  137: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // Polygon
};

export function ReviewModal({
  open,
  onOpenChange,
  selected,
  onChangeSelected,
  onConfirm,
}: ReviewModalProps) {
  const [tip, setTip] = useState("");
  const [tipCurrency, setTipCurrency] = useState<"ETH" | "USDC">("ETH");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const { assets } = useAssets();
  const t = useTranslations("app");
  const { addExcludedAsset } = useExcludedAssets();
  const { address, chain } = useAccount();
  const { startCleaning, updateChainProgress, updateAssetStatus, reset } =
    useCleanProgress();

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address: address,
  });

  // Get USDC balance
  const { data: usdcBalance } = useBalance({
    address: address,
    token:
      chain?.id && USDC_ADDRESSES[chain.id]
        ? (USDC_ADDRESSES[chain.id] as `0x${string}`)
        : undefined,
  });

  const selectedAssets = assets.filter((a) => selected.includes(a.id));
  const canSend = agree && selectedAssets.length > 0 && !loading;
  const selectedDisplay = useMemo(
    () =>
      selectedAssets.map((a) => ({
        id: a.id,
        title: a.symbol ? `${a.symbol}` : a.name,
        subtitle: `${a.name} · ${a.address.slice(0, 6)}…${a.address.slice(-4)}`,
        isScam: a.isScam,
      })),
    [selectedAssets]
  );

  const handleRemoveToken = (tokenId: string) => {
    addExcludedAsset(tokenId);
    // Remove from selected
    const newSelected = selected.filter((id) => id !== tokenId);
    onChangeSelected(newSelected);
  };

  const submit = async () => {
    if (!canSend || !address) return;
    try {
      setLoading(true);
      setStatus("pending");

      // Prepare assets for cleaning
      const assetsToClean: Asset[] = selectedAssets.map((a) => ({
        id: a.id,
        address: a.address as `0x${string}`,
        symbol: a.symbol,
        name: a.name,
        balance: a.balance,
        chainId: a.chainId,
        decimals: a.decimals,
      }));

      // Start progress tracking
      startCleaning(
        assetsToClean.map((a) => ({
          id: a.id,
          name: a.symbol,
          chainId: a.chainId,
        }))
      );

      // Start cleaning process with Permit2
      await cleanAssetsWithPermit2(
        assetsToClean,
        address as `0x${string}`,
        (step, data) => {
          if (data?.chainId) {
            updateChainProgress(data.chainId, step, {
              currentApprovalIndex: data.currentIndex,
              totalApprovals: data.totalInBatch,
              currentTransferIndex: data.currentIndex,
              totalTransfers: data.totalInBatch,
              error: data.error,
            });
          }

          if (data?.assetId) {
            updateAssetStatus(data.assetId, step, data.error, data.txHash);
          }
        }
      );

      // On complete
      setStatus("success");
      setLoading(false);
      setTimeout(() => {
        reset();
        onConfirm();
        onOpenChange(false);
      }, 2000);
    } catch (e) {
      console.error(e);
      setStatus("error");
      setLoading(false);
    }
  };

  const currentBalance =
    tipCurrency === "ETH"
      ? ethBalance
        ? parseFloat(ethBalance.formatted).toFixed(4)
        : "0.0000"
      : usdcBalance
      ? parseFloat(usdcBalance.formatted).toFixed(2)
      : "0.00";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10" />

        <div className="relative">
          {/* Header */}
          <div className="border-b border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {t("reviewTitle")}
                </h3>
                <p className="mt-1 text-sm text-white/60">
                  {t("reviewSubtitle")}
                </p>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Selected Assets */}
            <div className="mb-6 max-h-80 space-y-2 overflow-auto rounded-xl border border-white/10 bg-white/5 p-4">
              {selectedDisplay.map((a) => (
                <div
                  key={a.id}
                  className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 transition-all hover:bg-white/10"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        {a.title}
                      </span>
                      {a.isScam && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">
                          <AlertTriangle className="h-3 w-3" />
                          SCAM
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-white/50">
                      {a.subtitle}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveToken(a.id)}
                    className="ml-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 opacity-0 transition-all hover:bg-red-500/20 hover:scale-110 group-hover:opacity-100"
                    title={
                      t("language") === "EN"
                        ? "Remove and mark as not SCAM"
                        : "Удалить и отметить как не SCAM"
                    }
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {selected.length === 0 && (
                <div className="py-8 text-center text-sm text-white/60">
                  {t("empty")}
                </div>
              )}
            </div>

            {/* Status Messages */}
            {status !== "idle" && (
              <div
                className={`mb-6 flex flex-col gap-2 rounded-xl border p-4 ${
                  status === "pending"
                    ? "border-blue-500/30 bg-blue-500/10"
                    : status === "success"
                    ? "border-green-500/30 bg-green-500/10"
                    : "border-red-500/30 bg-red-500/10"
                }`}
              >
                {status === "pending" && (
                  <>
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                      <span className="text-sm font-medium text-blue-400">
                        {t("processing")}
                      </span>
                    </div>
                    <p className="text-xs text-white/50">
                      {t("language") === "EN"
                        ? "Check the progress widget in the bottom-left corner. This may take several minutes..."
                        : "Смотрите прогресс в левом нижнем углу. Это может занять несколько минут..."}
                    </p>
                  </>
                )}
                {status === "success" && (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <span className="text-sm font-medium text-green-400">
                      {t("done")}
                    </span>
                  </>
                )}
                {status === "error" && (
                  <>
                    <XCircle className="h-5 w-5 text-red-400" />
                    <span className="text-sm font-medium text-red-400">
                      {t("error")}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Tip Section */}
            <div className="mb-6 rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-400" />
                <label className="text-sm font-semibold text-white">
                  {t("tip")}
                </label>
              </div>

              <div className="mb-3 flex gap-2">
                <button
                  onClick={() => setTipCurrency("ETH")}
                  className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                    tipCurrency === "ETH"
                      ? "border-indigo-500/50 bg-indigo-500/20 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  ETH
                </button>
                <button
                  onClick={() => setTipCurrency("USDC")}
                  className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                    tipCurrency === "USDC"
                      ? "border-indigo-500/50 bg-indigo-500/20 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  USDC
                </button>
              </div>

              <div className="relative mb-2">
                <input
                  inputMode="decimal"
                  placeholder={t("tipPlaceholder")}
                  value={tip}
                  onChange={(e) => setTip(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/40">
                  {tipCurrency}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">
                  {t("language") === "EN"
                    ? "Optional donation to support development"
                    : "Необязательное пожертвование для поддержки разработки"}
                </span>
                <span className="font-semibold text-white/70">
                  {t("language") === "EN" ? "Balance:" : "Баланс:"}{" "}
                  {currentBalance} {tipCurrency}
                </span>
              </div>
            </div>

            {/* Disclaimer */}
            <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 h-5 w-5 cursor-pointer rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <span className="text-sm text-white/80">{t("disclaimer")}</span>
            </label>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => onOpenChange(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
              >
                {t("cancel")}
              </button>
              <button
                disabled={!canSend}
                onClick={submit}
                className="group relative flex-1 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-6 py-3 font-bold text-white shadow-lg transition-all hover:shadow-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="relative z-10">
                  {loading ? t("processing") : t("confirm")}
                </span>
                {!loading && (
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
