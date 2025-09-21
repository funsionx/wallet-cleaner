import { ChainKey } from "@/shared/model/chain";
import { getRpcUrl } from "./getRpcUrl";
import { createPublicClient, http } from "viem";
import { erc20Abi as viemErc20Abi } from "viem";
import { bytes32ToString } from "@/shared/utils/bytes32ToString";
import { TokenMeta } from "../model/types";

export async function onchainTokenMeta(
  networkKey: ChainKey,
  address: `0x${string}`
): Promise<TokenMeta | null> {
  try {
    const url = getRpcUrl(networkKey);
    if (!url) return null;
    const client = createPublicClient({ transport: http(url) });
    const [symbol, name, decimals] = await Promise.all([
      client
        .readContract({ address, abi: viemErc20Abi, functionName: "symbol" })
        .catch(async () => {
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
        .readContract({ address, abi: viemErc20Abi, functionName: "decimals" })
        .catch(() => undefined),
    ]);
    return {
      symbol: (symbol as string | undefined) ?? "",
      name: (name as string | undefined) ?? "",
      decimals: (decimals as number | undefined) ?? 18,
      logo: null,
    };
  } catch {
    return null;
  }
}
