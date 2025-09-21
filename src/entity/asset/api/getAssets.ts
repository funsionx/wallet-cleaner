import { isScamToken } from "@/entity/scam/lib/scam";
import type { GetAssetsParams, AssetDTO } from "../model/types";
import { SUPPORTED_NETWORKS } from "@/server/alchemy";
import { ChainKey } from "@/shared/model/chain";
import { fetchPortfolioTokens } from "./fetchPortfolioTokens";

export async function getAssets(params: GetAssetsParams): Promise<AssetDTO[]> {
  const { address, withPrices, metaLimit } = params;

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

  const out: AssetDTO[] = [];
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

  return out;
}
