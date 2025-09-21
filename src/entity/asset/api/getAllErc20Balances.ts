import { ChainKey } from "@/shared/model/chain";
import { TokenBalanceEntry } from "../model/types";
import { getRpcUrl } from "../lib/getRpcUrl";

export async function fetchAllErc20Balances(
  networkKey: ChainKey,
  owner: string
): Promise<TokenBalanceEntry[]> {
  const url = getRpcUrl(networkKey);
  if (!url) return [];
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
      next: { revalidate: 60 },
    });
    if (!res.ok) break;
    const data: {
      result?: { tokenBalances?: TokenBalanceEntry[]; pageKey?: string };
    } = await res.json();
    const list = data?.result?.tokenBalances ?? [];
    all.push(...list);
    pageKey = data?.result?.pageKey;
    if (!pageKey) break;
  }
  return all;
}
