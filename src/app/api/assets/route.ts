import { getAssets } from "@/entity/asset";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const pricesParam = req.nextUrl.searchParams.get("prices");
  const withPrices = pricesParam === null ? true : pricesParam === "1";
  const metaLimitParam = req.nextUrl.searchParams.get("metaLimit");
  const heavyOnchain = req.nextUrl.searchParams.get("heavy") === "1";
  const aiDetect = req.nextUrl.searchParams.get("ai") === "1";
  const lang = req.nextUrl.searchParams.get("lang");
  // 0 = без ограничения
  const metaLimit = metaLimitParam ? Math.max(0, Number(metaLimitParam)) : 0;

  if (!address) {
    return new Response(JSON.stringify({ error: "Missing address" }), {
      status: 400,
    });
  }

  // Проброс языка в env-переменную на время запроса
  const prev = process.env.DEFAULT_LOCALE;
  if (lang === "ru" || lang === "en") process.env.DEFAULT_LOCALE = lang;

  const assets = await getAssets({
    address,
    withPrices,
    metaLimit,
    heavyOnchain,
    aiDetect,
  });

  if (lang === "ru" || lang === "en") process.env.DEFAULT_LOCALE = prev;
  return Response.json({ assets });
}
