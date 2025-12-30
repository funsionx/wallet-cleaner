"use client";

import { useTranslations } from "next-intl";
import { Header } from "@/widgets/header/ui/header";
import { useState, useCallback } from "react";
import { AssetList } from "@/entity/asset/ui/asset-list";
import { ReviewModal } from "@/widgets/review-modal/ui/review-modal";
import { Footer } from "@/widgets/footer";
import { cleanWallet } from "./actions/clean";
import { useAccount } from "wagmi";
import { Sparkles, Shield, Zap } from "lucide-react";
import { CleanProgressWidget } from "@/features/wallet-clean";

export default function HomePage() {
  const t = useTranslations("app");
  const { address, isConnected } = useAccount();

  const [selected, setSelected] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleChangeSelected = useCallback((next: string[]) => {
    setSelected(next);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      <div className="relative mx-auto max-w-7xl p-6">
        {/* Background Effects */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-pulse rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute right-1/4 bottom-1/4 h-96 w-96 animate-pulse rounded-full bg-fuchsia-500/20 blur-3xl" />
        </div>

        <div className="flex flex-col gap-6">
          <Header />

          {!isConnected ? (
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="max-w-2xl text-center">
                <div className="mb-8 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 opacity-20" />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-2xl">
                      <Sparkles className="h-12 w-12 text-white" />
                    </div>
                  </div>
                </div>
                <h2 className="mb-4 text-4xl font-bold text-white">
                  {t("connect")}
                </h2>
                <p className="mb-8 text-lg text-white/60">{t("description")}</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                    <Shield className="mx-auto mb-3 h-8 w-8 text-indigo-400" />
                    <h3 className="mb-2 font-semibold text-white">
                      {t("connect") === "Connect Wallet"
                        ? "Secure"
                        : "Безопасно"}
                    </h3>
                    <p className="text-sm text-white/60">
                      {t("connect") === "Connect Wallet"
                        ? "Your keys stay with you"
                        : "Ваши ключи остаются у вас"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                    <Zap className="mx-auto mb-3 h-8 w-8 text-fuchsia-400" />
                    <h3 className="mb-2 font-semibold text-white">
                      {t("connect") === "Connect Wallet" ? "Fast" : "Быстро"}
                    </h3>
                    <p className="text-sm text-white/60">
                      {t("connect") === "Connect Wallet"
                        ? "Clean in one click"
                        : "Очистка в один клик"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                    <Sparkles className="mx-auto mb-3 h-8 w-8 text-indigo-400" />
                    <h3 className="mb-2 font-semibold text-white">
                      {t("connect") === "Connect Wallet" ? "Smart" : "Умно"}
                    </h3>
                    <p className="text-sm text-white/60">
                      {t("connect") === "Connect Wallet"
                        ? "AI-powered detection"
                        : "ИИ-детекция"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <main className="flex flex-col gap-6">
              <div className="flex items-center justify-between gap-4 max-md:flex-wrap">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {t("assets")}
                  </h2>
                  <p className="text-sm text-white/60">
                    {selected.length > 0
                      ? `${selected.length} ${
                          t("assets") === "Your assets" ? "selected" : "выбрано"
                        }`
                      : t("assets") === "Your assets"
                      ? "Select assets to clean"
                      : "Выберите активы для очистки"}
                  </p>
                </div>
                <button
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-8 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setIsOpen(true)}
                  disabled={selected.length === 0}
                >
                  <span className="relative z-10">{t("cleanCta")}</span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>
              </div>
              <AssetList
                selected={selected}
                onChangeSelected={handleChangeSelected}
              />
            </main>
          )}

          <ReviewModal
            open={isOpen}
            onOpenChange={setIsOpen}
            selected={selected}
            onChangeSelected={handleChangeSelected}
            onConfirm={async () => {
              await cleanWallet({
                from: address || "0x0000000000000000000000000000000000000000",
                assets: selected,
              });
              setIsOpen(false);
            }}
          />
          <Footer />
        </div>
      </div>

      {/* Clean Progress Widget */}
      <CleanProgressWidget />
    </div>
  );
}
