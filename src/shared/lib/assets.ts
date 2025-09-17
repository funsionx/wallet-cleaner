import { Address } from "viem";

export type ChainId = number;

export type TokenAsset = {
  id: string;
  chainId: ChainId;
  type: "erc20";
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  balance: string; // human-readable
};

export type NftAsset = {
  id: string;
  chainId: ChainId;
  type: "erc721";
  address: Address;
  tokenId: string;
  name: string;
};

export type WalletAsset = TokenAsset | NftAsset;

export interface AssetsProvider {
  getAssets(params: { address: Address }): Promise<WalletAsset[]>;
}

export class MockAssetsProvider implements AssetsProvider {
  async getAssets(): Promise<WalletAsset[]> {
    return [
      {
        id: "usdt-eth",
        chainId: 1,
        type: "erc20",
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        symbol: "USDT",
        name: "Tether USD",
        decimals: 6,
        balance: "12.34",
      },
      {
        id: "spam-coin",
        chainId: 1,
        type: "erc20",
        address: "0x0000000000000000000000000000000000000000",
        symbol: "SPAM",
        name: "Spam Coin",
        decimals: 18,
        balance: "1000000",
      },
      {
        id: "nft-1",
        chainId: 1,
        type: "erc721",
        address: "0x0000000000000000000000000000000000000001",
        tokenId: "1",
        name: "Weird NFT #1",
      },
    ];
  }
}
