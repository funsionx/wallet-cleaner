import type { ChainKey } from "@/shared/model/chain";

function toNetworkString(key: ChainKey): string {
  switch (key) {
    case "eth":
      return "eth-mainnet";
    case "base":
      return "base-mainnet";
    case "arb":
      return "arb-mainnet";
    case "opt":
      return "opt-mainnet";
    default:
      return "eth-mainnet";
  }
}

function priceApiUrl(): string | null {
  const key =
    process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  return key
    ? `https://api.g.alchemy.com/data/v1/${key}/assets/tokens/by-address`
    : null;
}

export type PortfolioToken = {
  address: string; // wallet address
  network: string; // "eth-mainnet" etc
  tokenAddress: string | null; // null for native
  tokenBalance: string; // hex
  tokenMetadata: {
    decimals: number | null;
    logo: string | null;
    name: string | null;
    symbol: string | null;
  } | null;
  tokenPrices?: { currency: string; value: string }[];
};

export async function fetchPortfolioTokens(params: {
  address: string;
  networks: ChainKey[];
  withPrices: boolean;
  includeNative?: boolean;
}): Promise<PortfolioToken[]> {
  const url = priceApiUrl();
  if (!url) return [];
  const networks = params.networks.map(toNetworkString);
  const body: {
    addresses: { address: string; networks: string[] }[];
    withMetadata: boolean;
    withPrices: boolean;
    includeNativeTokens: boolean;
    includeErc20Tokens: boolean;
    pageKey?: string;
  } = {
    addresses: [
      {
        address: params.address,
        networks,
      },
    ],
    withMetadata: true,
    withPrices: params.withPrices,
    includeNativeTokens: Boolean(params.includeNative ?? false),
    includeErc20Tokens: true,
  };

  const tokens: PortfolioToken[] = [];
  let pageKey: string | null = null;
  for (let i = 0; i < 10; i++) {
    if (pageKey) body.pageKey = pageKey;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      next: { revalidate: 60 },
    });

    if (!res.ok) break;
    const json: {
      data?: { tokens?: PortfolioToken[]; pageKey?: string | null };
    } = await res.json();
    const list = json.data?.tokens ?? [];
    tokens.push(...list);
    pageKey = (json.data?.pageKey ?? null) as string | null;
    if (!pageKey) break;
  }
  return tokens;
}
