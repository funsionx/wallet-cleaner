import { Alchemy, Network } from "alchemy-sdk";

const apiKey =
  process.env.ALCHEMY_API_KEY ?? process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ?? "";

if (!apiKey) {
  // For MVP we allow empty key, but requests will fail. Just warn.
  console.warn("[alchemy] Missing ALCHEMY_API_KEY. Add it to .env.local");
}

export const SUPPORTED_NETWORKS: {
  key: string;
  network: Network;
  chainId: number;
}[] = [
  { key: "eth", network: Network.ETH_MAINNET, chainId: 1 },
  { key: "base", network: Network.BASE_MAINNET, chainId: 8453 },
  { key: "arb", network: Network.ARB_MAINNET, chainId: 42161 },
  { key: "opt", network: Network.OPT_MAINNET, chainId: 10 },
  { key: "polygon", network: Network.MATIC_MAINNET, chainId: 137 },
];

export function getAlchemy(network: Network) {
  return new Alchemy({ apiKey, network });
}
