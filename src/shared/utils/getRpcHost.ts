import { ChainKey } from "../model/chain";

export function getAlchemyRpcHost(key: ChainKey): string | null {
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
