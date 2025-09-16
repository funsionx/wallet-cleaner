"use client";

import { useState } from "react";
import { useAssets } from "@/hooks/useAssets";
import { useClean } from "@/hooks/useClean";

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
  const { assets } = useAssets();
  const { clean } = useClean();

  const selectedAssets = assets.filter((a) => selected.includes(a.id));
  const canSend = agree && selectedAssets.length > 0 && !loading;

  const submit = async () => {
    if (!canSend) return;
    try {
      setLoading(true);
      await clean(selectedAssets, tip);
      onConfirm();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold">Review assets</h3>
          <button
            onClick={() => onOpenChange(false)}
            className="text-sm opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-black/60 dark:text-white/60 mb-3">
          Uncheck assets you want to keep. This action is irreversible.
        </p>

        <div className="space-y-2 max-h-64 overflow-auto mb-3">
          {selected.map((id) => (
            <div
              key={id}
              className="text-sm py-1 border-b border-black/5 dark:border-white/10"
            >
              {id}
            </div>
          ))}
          {selected.length === 0 && (
            <div className="text-sm text-black/60 dark:text-white/60">
              No assets selected
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <label className="text-sm w-40">Optional tip, ETH:</label>
          <input
            inputMode="decimal"
            placeholder="0.0"
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
          <span>I understand and accept the risks</span>
        </label>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md px-3 py-2 text-sm border"
          >
            Cancel
          </button>
          <button
            disabled={!canSend}
            onClick={submit}
            className="rounded-md px-3 py-2 text-sm text-white disabled:opacity-50 bg-gradient-to-r from-indigo-500 to-fuchsia-500"
          >
            {loading ? "Processing..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
