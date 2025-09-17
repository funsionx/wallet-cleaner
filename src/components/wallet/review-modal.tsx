"use client";

import { useMemo, useState } from "react";
import { useAssets } from "@/hooks/useAssets";
import { useClean } from "@/hooks/useClean";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

type ReviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: string[];
  onConfirm: () => void;
};

export function ReviewModal({
  open,
  onOpenChange,
  selected,
  onConfirm,
}: ReviewModalProps) {
  const [tip, setTip] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const { assets } = useAssets();
  const { clean } = useClean();
  const t = useTranslations("app");

  const selectedAssets = assets.filter((a) => selected.includes(a.id));
  const canSend = agree && selectedAssets.length > 0 && !loading;
  const selectedDisplay = useMemo(
    () =>
      selectedAssets.map((a) => ({
        id: a.id,
        title: a.symbol ? `${a.symbol}` : a.name,
        subtitle: `${a.name} · ${a.address.slice(0, 6)}…${a.address.slice(-4)}`,
      })),
    [selectedAssets]
  );

  const submit = async () => {
    if (!canSend) return;
    try {
      setLoading(true);
      setStatus("pending");
      await clean(selectedAssets, tip);
      onConfirm();
      setStatus("success");
    } catch (e) {
      console.error(e);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold">{t("reviewTitle")}</h3>
          <button
            onClick={() => onOpenChange(false)}
            className="text-sm opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-black/60 dark:text-white/60 mb-3">
          {t("reviewSubtitle")}
        </p>

        <div className="space-y-2 max-h-64 overflow-auto mb-3">
          {selectedDisplay.map((a) => (
            <div
              key={a.id}
              className="py-2 border-b border-black/5 dark:border-white/10"
            >
              <div className="text-sm font-medium">{a.title}</div>
              <div className="text-[11px] opacity-60">{a.subtitle}</div>
            </div>
          ))}
          {selected.length === 0 && (
            <div className="text-sm text-black/60 dark:text-white/60">
              {t("empty")}
            </div>
          )}
        </div>

        {status !== "idle" && (
          <div className="mb-3 rounded-md border px-3 py-2 text-sm flex items-center gap-2">
            {status === "pending" && (
              <>
                <Loader2 className="animate-spin size-4" />
                <span>{t("processing")}</span>
              </>
            )}
            {status === "success" && (
              <>
                <CheckCircle2 className="text-green-500 size-4" />
                <span>{t("done")}</span>
              </>
            )}
            {status === "error" && (
              <>
                <XCircle className="text-red-500 size-4" />
                <span>{t("error")}</span>
              </>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
          <label className="text-sm w-40">{t("tip")}:</label>
          <input
            inputMode="decimal"
            placeholder={t("tipPlaceholder")}
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            className="flex-1 rounded-md border px-3 py-2 text-sm bg-transparent"
          />
        </div>

        <label className="flex items-center gap-2 text-xs mb-3">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <span>{t("disclaimer")}</span>
        </label>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md px-3 py-2 text-sm border"
          >
            {t("cancel")}
          </button>
          <button
            disabled={!canSend}
            onClick={submit}
            className="rounded-md px-3 py-2 font-bold text-sm text-white disabled:opacity-50 bg-gradient-to-r from-indigo-500 to-fuchsia-500"
          >
            {loading ? t("processing") : t("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
