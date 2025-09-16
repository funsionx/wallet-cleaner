export function getOrganizationJsonLd(locale: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Wallet Cleaner",
    applicationCategory: "FinanceApplication",
    url: `${siteUrl}/${locale}`,
    description:
      locale === "ru"
        ? "Очистка кошельков от скам-токенов и NFT в EVM сетях"
        : "Remove scam tokens & NFTs across EVM chains",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}
