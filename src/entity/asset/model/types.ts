export type TokenBalanceEntry = {
  contractAddress: string;
  tokenBalance: string;
};

export type TokenMeta = {
  symbol: string;
  name: string;
  decimals: number;
  logo?: string | null;
};

export type AssetDTO = {
  id: string;
  chainId: number;
  type: "erc20";
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  raw: string;
  logo?: string | null;
  usdPrice: number | null;
  usdValue: number | null;
  isScam: boolean;
  scamReason?: string | null;
};

export type GetAssetsParams = {
  address: string;
  withPrices: boolean;
  metaLimit: number;
  heavyOnchain: boolean;
  aiDetect?: boolean;
};
