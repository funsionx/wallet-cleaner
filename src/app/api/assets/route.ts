import { getAssets } from "@/entity/asset";
import { NextRequest } from "next/server";
import { cacheGet, cacheSet } from "@/shared/lib/cache";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const pricesParam = req.nextUrl.searchParams.get("prices");
  const withPrices = pricesParam === null ? true : pricesParam === "1";
  const metaLimitParam = req.nextUrl.searchParams.get("metaLimit");
  const heavyOnchain = req.nextUrl.searchParams.get("heavy") === "1";
  const aiDetect = req.nextUrl.searchParams.get("ai") === "1";
  const lang = req.nextUrl.searchParams.get("lang");
  const ip = (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  )
    .split(",")[0]
    .trim();
  // 0 = без ограничения
  const metaLimit = metaLimitParam ? Math.max(0, Number(metaLimitParam)) : 0;

  if (!address) {
    return new Response(JSON.stringify({ error: "Missing address" }), {
      status: 400,
    });
  }

  // Rate-limit: 1 AI-запрос в 30 сек на IP+address, 3/10 мин скользящее окно
  if (aiDetect) {
    const key = `ai:${ip}:${address}`;
    const hit = cacheGet<number>("ctrl", key);
    if (hit && hit > Date.now()) {
      return new Response(JSON.stringify({ error: "Too Many Requests" }), {
        status: 429,
        headers: { "Retry-After": "30" },
      });
    }
    cacheSet("ctrl", key, Date.now() + 30_000, 30_000);
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
