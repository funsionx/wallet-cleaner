import { getAlchemy } from "@/server/alchemy";
import { isScamToken } from "@/entity/scam/lib/scam";
import { fetchDexPrice } from "../api/getTokenDexPrice";
import { cacheGet, cacheSet } from "@/shared/lib/cache";
import type {
  GetAssetsParams,
  TokenMeta,
  TokenBalanceEntry,
  AssetDTO,
} from "../model/types";
import { SUPPORTED_NETWORKS } from "@/server/alchemy";
import { ChainKey } from "@/shared/model/chain";
import { fetchAllErc20Balances } from "./getAllErc20Balances";
import { onchainTokenMeta } from "../lib/getOnchainTokenMeta";

export async function getAssets(params: GetAssetsParams): Promise<AssetDTO[]> {
  const { address, withPrices, metaLimit, heavyOnchain } = params;
  const results: AssetDTO[] = [];

  await Promise.all(
    SUPPORTED_NETWORKS.map(async (net) => {
      const key = net.key as ChainKey;
      const listCacheKey = `${key}:${address.toLowerCase()}`;
      let list = cacheGet<TokenBalanceEntry[]>("bal", listCacheKey);
      if (!list) {
        list = await fetchAllErc20Balances(key, address);
        cacheSet("bal", listCacheKey, list, 60_000);
      }
      if (!list || list.length === 0) return;

      const nonZero = list.filter((b) => {
        try {
          return BigInt(b.tokenBalance) > BigInt(0);
        } catch {
          return false;
        }
      });
      if (nonZero.length === 0) return;

      // metadata map with caching
      const metaMap = new Map<string, TokenMeta>();
      const chunkSize = 3;
      const alchemy = getAlchemy(net.network);
      for (let i = 0; i < nonZero.length; i += chunkSize) {
        const slice = nonZero.slice(i, i + chunkSize);
        await Promise.all(
          slice.map(async (b) => {
            const mk = `${key}:${b.contractAddress.toLowerCase()}`;
            const cached = cacheGet<TokenMeta>("meta", mk);
            if (cached) {
              metaMap.set(b.contractAddress, cached);
              return;
            }
            try {
              const m = await alchemy.core.getTokenMetadata(b.contractAddress);
              const payload: TokenMeta = {
                symbol: m.symbol ?? "",
                name: m.name ?? "",
                decimals: m.decimals ?? 18,
                logo: (m as unknown as { logo?: string | null }).logo ?? null,
              };
              metaMap.set(b.contractAddress, payload);
              cacheSet("meta", mk, payload, 6 * 60_000);
            } catch {}
            if (heavyOnchain && !metaMap.get(b.contractAddress)) {
              const oc = await onchainTokenMeta(
                key,
                b.contractAddress as `0x${string}`
              );
              if (oc) {
                metaMap.set(b.contractAddress, oc);
                cacheSet("meta", mk, oc, 6 * 60_000);
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
      const toProcess = sorted.slice(0, metaLimit);

      await Promise.all(
        toProcess.map(async (b) => {
          let meta = metaMap.get(b.contractAddress) ?? {
            symbol: "",
            name: "",
            decimals: 18,
          };
          if (!meta.symbol && !meta.name) {
            const oc = await onchainTokenMeta(
              key,
              b.contractAddress as `0x${string}`
            );
            if (oc) meta = oc;
          }

          let raw: bigint;
          try {
            raw = BigInt(b.tokenBalance);
          } catch {
            return;
          }
          const base = BigInt(10) ** BigInt(meta.decimals ?? 18);
          const human = Number(raw / base) + Number(raw % base) / Number(base);

          let price: number | null = null;
          if (withPrices) {
            const pk = b.contractAddress.toLowerCase();
            const cached = cacheGet<number>("price", pk);
            if (typeof cached === "number") {
              price = cached;
            } else {
              price = await fetchDexPrice(b.contractAddress);
              if (typeof price === "number")
                cacheSet("price", pk, price, 5 * 60_000);
            }
          }
          const usdValue =
            typeof price === "number" && Number.isFinite(human)
              ? human * price
              : null;

          const symbol = (meta.symbol || "").toUpperCase();
          const name = meta.name || symbol || b.contractAddress;
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

          results.push({
            id: `${b.contractAddress}-${net.chainId}`,
            chainId: net.chainId,
            type: "erc20",
            address: b.contractAddress,
            symbol,
            name,
            decimals: meta.decimals ?? 18,
            balance: human.toString(),
            raw: raw.toString(),
            logo: meta.logo ?? null,
            usdPrice: price ?? null,
            usdValue,
            isScam,
          });
        })
      );
    })
  );

  return results;
}
