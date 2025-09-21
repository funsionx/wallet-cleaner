import { ChainKey } from "@/shared/model/chain";
import { getAlchemyRpcHost } from "@/shared/utils/getRpcHost";

export function getRpcUrl(networkKey: ChainKey): string | null {
  const host = getAlchemyRpcHost(networkKey);
  const apiKey =
    process.env.ALCHEMY_API_KEY ?? process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  if (!host || !apiKey) return null;
  return `https://${host}.g.alchemy.com/v2/${apiKey}`;
}
