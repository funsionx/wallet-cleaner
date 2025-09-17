"use client";

import { useTranslations } from "next-intl";
import { Header } from "./(components)/header";
import { useState } from "react";
import { AssetList } from "@/components/wallet/asset-list";
import { ReviewModal } from "@/components/wallet/review-modal";
import { Footer } from "./(components)/footer";
import { cleanWallet } from "./actions/clean";

export default function HomePage() {
  const t = useTranslations("app");

  const [selected, setSelected] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen p-6 flex flex-col gap-6 max-w-5xl mx-auto ">
      <Header />

      <main className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">{t("assets")}</h2>
          <button
            className="rounded-lg cursor-pointer font-bold bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white px-4 py-2 text-lg shadow hover:opacity-90 hover:scale-110 transition-transform duration-200"
            onClick={() => setIsOpen(true)}
          >
            {t("cleanCta")}
          </button>
        </div>
        <AssetList selected={selected} onChangeSelected={setSelected} />
      </main>

      <ReviewModal
        open={isOpen}
        onOpenChange={setIsOpen}
        selected={selected}
        onConfirm={async () => {
          await cleanWallet({
            from: "0x0000000000000000000000000000000000000000",
            assets: selected,
          });
          setIsOpen(false);
        }}
      />
      <Footer />
    </div>
  );
}
