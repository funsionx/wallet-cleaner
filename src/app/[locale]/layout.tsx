import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AppProviders } from "./providers";
import "../globals.css";
import { getOrganizationJsonLd } from "./schema.org.json";

export const dynamic = "force-static";
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ru" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const t = await getTranslations({
    locale: (await params).locale,
    namespace: "app",
  });
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const locales = ["en", "ru"] as const;
  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  let messages: Record<string, unknown>;
  try {
    messages = (await import(`../../i18n/messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getOrganizationJsonLd(locale)),
        }}
      />
      <AppProviders>{children}</AppProviders>
    </NextIntlClientProvider>
  );
}
