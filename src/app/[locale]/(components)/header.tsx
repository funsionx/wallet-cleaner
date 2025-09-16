"use client";

import { useTranslations } from "next-intl";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const t = useTranslations("app");
  const pathname = usePathname();
  const isRu = pathname?.startsWith("/ru") ?? false;
  const switchTo = isRu
    ? "/en" + pathname!.slice(3)
    : "/ru" + pathname!.slice(3);
  return (
    <header className="flex items-center justify-between py-3">
      <div className="text-xl font-semibold">Wallet Cleaner</div>
      <div className="flex items-center gap-3">
        <Link className="text-sm underline" href={switchTo}>
          {t("language")}
        </Link>
        <ConnectButton />
      </div>
    </header>
  );
}
