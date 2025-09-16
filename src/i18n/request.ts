import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    return {
      locale: "en",
      messages: (await import(`../messages/en.json`)).default,
    };
  }
  const messages = (await import(`../messages/${locale}.json`)).default;
  return {
    locale,
    messages,
  };
});
