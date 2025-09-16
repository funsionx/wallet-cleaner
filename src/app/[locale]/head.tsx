import { getTranslations } from "next-intl/server";

export default async function Head({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const t = await getTranslations({
    locale: (await params).locale,
    namespace: "app",
  });
  return (
    <>
      <title>{t("title")}</title>
      <meta name="description" content={t("description")} />
    </>
  );
}
