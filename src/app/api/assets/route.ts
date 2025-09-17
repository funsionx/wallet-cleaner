import { NextRequest } from "next/server";
import { getAlchemy, SUPPORTED_NETWORKS } from "@/server/alchemy";
import { createPublicClient, http } from "viem";
import { erc20Abi as viemErc20Abi } from "viem";

type AssetResponse = {
  id: string;
  chainId: number;
  type: "erc20";
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string; // human-readable
  raw: string; // raw balance in wei (decimal string)
  usdPrice: number | null;
  usdValue: number | null;
  isScam: boolean;
};

type DexScreenerPair = { priceUsd?: string };

async function fetchDexPrice(address: string): Promise<number | null> {
  try {
    // DexScreener supports many chains; try unified endpoint
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      { next: { revalidate: 60 } }
    );

    if (!res.ok) return null;
    const data: { pairs?: DexScreenerPair[] } = await res.json();
    const pairs = data?.pairs;
    const priceUsd = pairs?.find(
      (p) => typeof p.priceUsd === "string"
    )?.priceUsd;
    return priceUsd ? Number(priceUsd) : null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const withPricesParam = req.nextUrl.searchParams.get("prices");
  const withPrices = withPricesParam === "1";
  const metaLimitParam = req.nextUrl.searchParams.get("metaLimit");
  const META_LIMIT = metaLimitParam ? Math.max(0, Number(metaLimitParam)) : 20;
  const heavyParam = req.nextUrl.searchParams.get("heavy");
  const HEAVY_ONCHAIN = heavyParam === "1"; // ончейн-фолбэк только по запросу
  if (!address) {
    return new Response(JSON.stringify({ error: "Missing address" }), {
      status: 400,
    });
  }

  const results: AssetResponse[] = [];

  // In-memory caches (no DB/KV). Persist for process lifetime.
  type CacheEntry<T> = { v: T; exp: number };
  type CacheBuckets = {
    bal: Map<string, CacheEntry<TokenBalanceEntry[]>>;
    meta: Map<
      string,
      CacheEntry<{ symbol: string; name: string; decimals: number }>
    >;
    price: Map<string, CacheEntry<number>>;
  };
  const g = globalThis as unknown as { __WL_CACHE__?: CacheBuckets };
  if (!g.__WL_CACHE__) {
    g.__WL_CACHE__ = {
      bal: new Map(),
      meta: new Map(),
      price: new Map(),
    };
  }
  const ROOT = g.__WL_CACHE__;
  // buckets are initialized above

  function getAlchemyRpcHost(key: string): string | null {
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
        return null;
    }
  }

  type TokenBalanceEntry = { contractAddress: string; tokenBalance: string };

  async function fetchAllErc20Balances(
    networkKey: string,
    owner: string
  ): Promise<TokenBalanceEntry[]> {
    const cacheKey = `${networkKey}:${owner.toLowerCase()}`;
    const cached = ROOT.bal.get(cacheKey);
    if (cached && Date.now() < cached.exp) return cached.v;
    const host = getAlchemyRpcHost(networkKey);
    const apiKey =
      process.env.ALCHEMY_API_KEY ?? process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
    if (!host || !apiKey) return [] as TokenBalanceEntry[];

    const url = `https://${host}.g.alchemy.com/v2/${apiKey}`;
    let pageKey: string | undefined;
    const all: TokenBalanceEntry[] = [];
    for (let i = 0; i < 10; i++) {
      const body = pageKey
        ? {
            id: 1,
            jsonrpc: "2.0" as const,
            method: "alchemy_getTokenBalances" as const,
            params: [owner, "erc20", { pageKey }],
          }
        : {
            id: 1,
            jsonrpc: "2.0" as const,
            method: "alchemy_getTokenBalances" as const,
            params: [owner, "erc20"],
          };
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        // Alchemy may cache; but balances should be fresh
        next: { revalidate: 60 },
      });
      if (!res.ok) break;
      const data: {
        result?: { tokenBalances?: TokenBalanceEntry[]; pageKey?: string };
      } = await res.json();
      const list = data?.result?.tokenBalances as
        | TokenBalanceEntry[]
        | undefined;
      if (Array.isArray(list)) all.push(...list);
      pageKey = data?.result?.pageKey as string | undefined;
      if (!pageKey) break;
    }
    ROOT.bal.set(cacheKey, {
      v: all,
      exp: Date.now() + 60_000,
    });
    return all;
  }

  function formatUnitsBigInt(value: bigint, decimals: number): string {
    if (decimals <= 0) return value.toString();
    const base = BigInt(10) ** BigInt(decimals);
    const whole = value / base;
    const fraction = value % base;
    if (fraction === BigInt(0)) return whole.toString();
    const fractionStr = fraction
      .toString()
      .padStart(decimals, "0")
      .replace(/0+$/, "");
    // limit to 8 decimals for UI brevity
    const trimmed = fractionStr.slice(0, 8);
    return `${whole.toString()}.${trimmed}`;
  }

  function getRpcUrl(networkKey: string): string | null {
    const host = getAlchemyRpcHost(networkKey);
    const apiKey =
      process.env.ALCHEMY_API_KEY ?? process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
    if (!host || !apiKey) return null;
    return `https://${host}.g.alchemy.com/v2/${apiKey}`;
  }

  async function fetchErc20MetaOnchain(
    networkKey: string,
    address: `0x${string}`
  ): Promise<{ symbol: string; name: string; decimals: number } | null> {
    const ck = `${networkKey}:on:${address.toLowerCase()}`;
    const cached = ROOT.meta.get(ck);
    if (cached && Date.now() < cached.exp) return cached.v;
    try {
      const url = getRpcUrl(networkKey);
      if (!url) return null;
      const client = createPublicClient({ transport: http(url) });
      const [symbol, name, decimals] = await Promise.all([
        client
          .readContract({ address, abi: viemErc20Abi, functionName: "symbol" })
          .catch(async () => {
            // bytes32 fallback
            const abi = [
              {
                name: "symbol",
                type: "function",
                stateMutability: "view",
                inputs: [],
                outputs: [{ type: "bytes32" }],
              },
            ] as const;
            const val = (await client
              .readContract({ address, abi, functionName: "symbol" })
              .catch(() => undefined)) as `0x${string}` | undefined;
            return val ? bytes32ToString(val) : undefined;
          }),
        client
          .readContract({ address, abi: viemErc20Abi, functionName: "name" })
          .catch(async () => {
            // bytes32 fallback
            const abi = [
              {
                name: "name",
                type: "function",
                stateMutability: "view",
                inputs: [],
                outputs: [{ type: "bytes32" }],
              },
            ] as const;
            const val = (await client
              .readContract({ address, abi, functionName: "name" })
              .catch(() => undefined)) as `0x${string}` | undefined;
            return val ? bytes32ToString(val) : undefined;
          }),
        client
          .readContract({
            address,
            abi: viemErc20Abi,
            functionName: "decimals",
          })
          .catch(() => undefined),
      ]);
      const res = {
        symbol: (symbol as string | undefined) ?? "",
        name: (name as string | undefined) ?? "",
        decimals: (decimals as number | undefined) ?? 18,
      } as { symbol: string; name: string; decimals: number };
      ROOT.meta.set(ck, {
        v: res,
        exp: Date.now() + 6 * 60_000,
      });
      return res;
    } catch {
      return null;
    }
  }

  function bytes32ToString(hex: `0x${string}`): string {
    try {
      const clean = hex.slice(2);
      const bytes: number[] = [];
      for (let i = 0; i < clean.length; i += 2) {
        const byte = parseInt(clean.slice(i, i + 2), 16);
        if (byte === 0) break;
        bytes.push(byte);
      }
      const decoder = new TextDecoder();
      return decoder.decode(new Uint8Array(bytes));
    } catch {
      return "";
    }
  }

  await Promise.all(
    SUPPORTED_NETWORKS.map(async (net) => {
      const alchemy = getAlchemy(net.network);
      try {
        let list = await fetchAllErc20Balances(net.key, address);
        // Fallback: try SDK if RPC returned nothing
        if (!list || list.length === 0) {
          try {
            const resp = await alchemy.core.getTokenBalances(address);
            const tb = resp?.tokenBalances ?? [];
            list = tb
              .filter((b) => typeof b.tokenBalance === "string")
              .map((b) => ({
                contractAddress: b.contractAddress,
                tokenBalance: b.tokenBalance as string,
              }));
          } catch {}
        }
        if (!list || list.length === 0) return;

        const nonZero = list.filter((b) => {
          try {
            const v = BigInt(b.tokenBalance);
            return v > BigInt(0);
          } catch {
            return false;
          }
        });
        if (nonZero.length === 0) return;

        const metadataMap = new Map<
          string,
          { symbol: string; name: string; decimals: number }
        >();

        // limit concurrency to avoid rate-limits
        const chunkSize = 3;
        for (let i = 0; i < nonZero.length; i += chunkSize) {
          const slice = nonZero.slice(i, i + chunkSize);
          await Promise.all(
            slice.map(async (b) => {
              try {
                const meta = await alchemy.core.getTokenMetadata(
                  b.contractAddress
                );
                const payload: {
                  symbol: string;
                  name: string;
                  decimals: number;
                } = {
                  symbol: meta.symbol ?? "",
                  name: meta.name ?? "",
                  decimals: meta.decimals ?? 18,
                };
                metadataMap.set(b.contractAddress, payload);
              } catch {}
              // On-chain fallback if still missing (только в heavy-режиме)
              if (HEAVY_ONCHAIN && !metadataMap.get(b.contractAddress)) {
                const onchain = await fetchErc20MetaOnchain(
                  net.key,
                  b.contractAddress as `0x${string}`
                );
                if (onchain) {
                  const payload = {
                    symbol: onchain.symbol ?? "",
                    name: onchain.name ?? "",
                    decimals: onchain.decimals ?? 18,
                  } as { symbol: string; name: string; decimals: number };
                  metadataMap.set(b.contractAddress, payload);
                }
              }
            })
          );
        }

        const sorted = nonZero.slice().sort((a, b) => {
          try {
            return Number(BigInt(b.tokenBalance) - BigInt(a.tokenBalance));
          } catch {
            return 0;
          }
        });
        const toProcess = sorted.slice(0, META_LIMIT);

        await Promise.all(
          toProcess.map(async (b) => {
            let meta =
              metadataMap.get(b.contractAddress) ??
              ({ symbol: "", name: "", decimals: 18 } as const);
            // лёгкий on-chain фолбэк для TOP токенов даже без prices/heavy
            if (!meta.symbol && !meta.name) {
              const oc = await fetchErc20MetaOnchain(
                net.key,
                b.contractAddress as `0x${string}`
              );
              if (oc) {
                meta = {
                  symbol: oc.symbol ?? "",
                  name: oc.name ?? "",
                  decimals: oc.decimals ?? 18,
                } as { symbol: string; name: string; decimals: number };
              }
            }
            const decimals = meta.decimals ?? 18;
            let raw: bigint;
            try {
              raw = BigInt(b.tokenBalance);
            } catch {
              return;
            }
            const humanStr = formatUnitsBigInt(raw, decimals);
            const humanNum = Number(humanStr);
            let price: number | null = null;
            if (withPrices) {
              const pk = b.contractAddress.toLowerCase();
              const cachedPrice = (
                ROOT.price as Map<string, CacheEntry<number>>
              ).get(pk);
              if (cachedPrice && Date.now() < cachedPrice.exp) {
                price = cachedPrice.v;
              } else {
                try {
                  price = await fetchDexPrice(b.contractAddress);
                  if (typeof price === "number")
                    (ROOT.price as Map<string, CacheEntry<number>>).set(pk, {
                      v: price,
                      exp: Date.now() + 5 * 60_000,
                    });
                } catch {}
              }
            }
            const usdValue =
              typeof price === "number" && Number.isFinite(humanNum)
                ? humanNum * price
                : null;
            const symbol = (meta.symbol ?? "").toUpperCase();
            const name = meta.name || symbol || b.contractAddress;
            const isEthNative = symbol === "ETH";
            const isScam =
              typeof usdValue === "number"
                ? !isEthNative && usdValue < 0.1
                : !isEthNative && (!symbol || humanNum < 0.000001);
            results.push({
              id: `${b.contractAddress}-${net.chainId}`,
              chainId: net.chainId,
              type: "erc20",
              address: b.contractAddress,
              symbol: symbol,
              name,
              decimals,
              balance: humanStr,
              raw: raw.toString(),
              usdPrice: typeof price === "number" ? price : null,
              usdValue,
              isScam,
            });
          })
        );
      } catch (e) {
        // ignore network errors per-chain to continue others
      }
    })
  );

  return Response.json({ assets: results });
}
