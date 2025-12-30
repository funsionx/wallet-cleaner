export type CleanStep =
  | "idle"
  | "switching_chain"
  | "checking_approvals"
  | "batch_approving"
  | "transferring"
  | "completed"
  | "error";

export type ChainProgress = {
  chainId: number;
  step: CleanStep;
  currentApprovalIndex?: number;
  totalApprovals?: number;
  currentTransferIndex?: number;
  totalTransfers?: number;
  error?: string;
};

export type AssetCleanStatus = {
  assetId: string;
  assetName: string;
  chainId: number;
  step: CleanStep;
  error?: string;
  txHash?: string;
};

export type CleanProgress = {
  isActive: boolean;
  currentChainId?: number;
  totalAssets: number;
  completedAssets: number;
  chains: Map<number, ChainProgress>;
  assets: AssetCleanStatus[];
};
