"use client";

import { useTranslations } from "next-intl";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrushCleaning } from "lucide-react";

export function Header() {
  const t = useTranslations("app");
  const pathname = usePathname();
  const isRu = pathname?.startsWith("/ru") ?? false;
  const switchTo = isRu
    ? "/en" + pathname!.slice(3)
    : "/ru" + pathname!.slice(3);
  return (
    <header className="flex bg-black/80 max-md:gap-5 items-center max-md:flex-wrap border-dashed sticky top-5 rounded-lg justify-between py-3 border-2 border-black dark:border-white/10  px-5">
      <div className="flex items-center gap-2">
        <BrushCleaning color="white" />
        <h1 className="text-xl text-fuchsia-500 font-bold">
          Clean<span className="text-indigo-500">Folio</span>
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <Link
          className="text-sm underline h-full bg-[#1A1B1F] rounded-lg px-3 py-2 text-white font-semibold"
          href={switchTo}
        >
          {t("language")}
        </Link>
        <ConnectButton showBalance={false} />
      </div>
    </header>
  );
}
