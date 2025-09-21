import { ChainKey } from "@/shared/model/chain";
import { cacheGet, cacheSet } from "@/shared/lib/cache";

function priceHost() {
  const key =
    process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  return key
    ? `https://api.g.alchemy.com/prices/v1/${key}/tokens/by-address`
    : null;
}

function toNetwork(key: ChainKey): string {
  switch (key) {
    case "eth":
      return "eth-mainnet";
    case "base":
      return "base-mainnet";
    case "arb":
      return "arb-mainnet";
    case "opt":
      return "opt-mainnet";
    case "polygon":
      return "polygon-mainnet";
    default:
      return "eth-mainnet";
  }
}

export async function fetchTokenPricesBatch(
  entries: { chain: ChainKey; address: string }[]
): Promise<Record<string, number>> {
  const host = priceHost();
  if (!host || entries.length === 0) return {};

  // cache key by addresses+chains
  const key = entries
    .map((e) => `${e.chain}:${e.address.toLowerCase()}`)
    .sort()
    .join(",");
  const cached = cacheGet<Record<string, number>>("price", key);
  if (cached) return cached;

  const body = {
    addresses: entries.map((e) => ({
      network: toNetwork(e.chain),
      address: e.address,
    })),
  } as const;

  const res = await fetch(host, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    next: { revalidate: 60 },
  });
  if (!res.ok) return {};
  const json: {
    data?: {
      network: string;
      address: string;
      prices?: { currency: string; value: string }[];
    }[];
  } = await res.json();

  const out: Record<string, number> = {};
  for (const item of json.data ?? []) {
    const address = item.address.toLowerCase();
    const price = item.prices?.find(
      (p) => p.currency.toLowerCase() === "usd"
    )?.value;
    if (price) out[address] = Number(price);
  }
  cacheSet("price", key, out, 60_000);
  return out;
}

export async function fetchDexPrice(): Promise<number | null> {
  return null;
}
