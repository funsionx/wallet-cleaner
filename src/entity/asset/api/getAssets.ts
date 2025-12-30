import { isScamToken } from "@/entity/scam/lib/scam";
import type { GetAssetsParams, AssetDTO } from "../model/types";
import { SUPPORTED_NETWORKS } from "@/server/alchemy";
import { ChainKey } from "@/shared/model/chain";
import { fetchPortfolioTokens } from "./fetchPortfolioTokens";
import { aiDetectScam } from "./openrouterDetectScam";

export async function getAssets(params: GetAssetsParams): Promise<AssetDTO[]> {
  const { address, withPrices, metaLimit, aiDetect } = params;

  const networks = SUPPORTED_NETWORKS.map((n) => n.key as ChainKey);
  const tokens = await fetchPortfolioTokens({
    address,
    networks,
    withPrices,
    includeNative: false,
  });

  const mapNetToChainId = (network: string): number => {
    if (network.includes("eth-mainnet")) return 1;
    if (network.includes("base-mainnet")) return 8453;
    if (network.includes("arb-mainnet")) return 42161;
    if (network.includes("opt-mainnet")) return 10;
    if (network.includes("polygon-mainnet")) return 137;
    return 1;
  };

  const nonNative = tokens.filter((t) => t.tokenAddress);
  const sorted = nonNative.slice().sort((a, b) => {
    try {
      return Number(BigInt(b.tokenBalance) - BigInt(a.tokenBalance));
    } catch {
      return 0;
    }
  });
  const slice =
    typeof metaLimit === "number" && metaLimit > 0
      ? sorted.slice(0, metaLimit)
      : sorted;

  let out: AssetDTO[] = [];
  for (const t of slice) {
    const chainId = mapNetToChainId(t.network);
    const decimals = t.tokenMetadata?.decimals ?? 18;
    const raw = BigInt(t.tokenBalance);
    const base = BigInt(10) ** BigInt(decimals);
    const human = Number(raw / base) + Number(raw % base) / Number(base);

    const priceStr = t.tokenPrices?.find(
      (p) => p.currency.toLowerCase() === "usd"
    )?.value;
    const price = priceStr ? Number(priceStr) : null;
    const usdValue = price ? price * human : null;
    const symbol = (t.tokenMetadata?.symbol || "").toUpperCase();
    const name = t.tokenMetadata?.name || symbol || t.tokenAddress!;
    const isEthNative = symbol === "ETH";
    const isScam =
      !isEthNative &&
      isScamToken({
        symbol,
        name,
        usdPrice: price,
        usdValue,
        balanceHuman: human,
        logo: t.tokenMetadata?.logo ?? null,
      });

    out.push({
      id: `${t.tokenAddress}-${chainId}`,
      chainId,
      type: "erc20",
      address: t.tokenAddress!,
      symbol,
      name,
      decimals,
      balance: human.toString(),
      raw: raw.toString(),
      logo: t.tokenMetadata?.logo ?? null,
      usdPrice: price ?? null,
      usdValue,
      isScam,
    });
  }

  // Deduplicate items by id (address+chainId). Keep the entry with larger raw balance.
  if (out.length > 1) {
    const uniq = new Map<string, AssetDTO>();
    for (const item of out) {
      const prev = uniq.get(item.id);
      if (!prev) {
        uniq.set(item.id, item);
        continue;
      }
      try {
        const a = BigInt(prev.raw);
        const b = BigInt(item.raw);
        if (b > a) uniq.set(item.id, item);
      } catch {
        // fallback: override
        uniq.set(item.id, item);
      }
    }
    out = Array.from(uniq.values());
  }

  if (aiDetect && out.length > 0) {
    const aiInput = out.map((a) => ({
      address: a.address,
      chainId: a.chainId,
      symbol: a.symbol,
      name: a.name,
      usdPrice: a.usdPrice,
      usdValue: a.usdValue,
      balance: a.balance,
    }));
    // Язык зададим через ENV-фоллбек или оставим en. Клиент дополнительно может передать ?lang=ru
    let lang: "en" | "ru" = "en";
    try {
      const langEnv = (process.env.DEFAULT_LOCALE || "en").toLowerCase();
      if (langEnv.startsWith("ru")) lang = "ru";
    } catch {}
    const resp = await aiDetectScam(aiInput, lang);
    if (resp) {
      // Нормализуем ключи из ответа в lowerCase для универсального сопоставления
      const normalized = Object.create(null) as Record<
        string,
        { isScam: boolean; reason?: string }
      >;
      for (const [key, val] of Object.entries(resp)) {
        normalized[key.toLowerCase()] = val;
      }
      for (const item of out) {
        const r = normalized[item.address.toLowerCase()];
        if (r && typeof r.isScam === "boolean") {
          item.isScam = r.isScam;
          if (r.reason) item.scamReason = r.reason;
        }
      }
    }
  }

  return out;
}
