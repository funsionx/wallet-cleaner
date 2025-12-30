import { create } from "zustand";
import { CleanProgress, AssetCleanStatus, ChainProgress, CleanStep } from "./types";

type CleanProgressStore = {
  progress: CleanProgress;
  startCleaning: (assets: { id: string; name: string; chainId: number }[]) => void;
  updateChainProgress: (
    chainId: number,
    step: CleanStep,
    data?: {
      currentApprovalIndex?: number;
      totalApprovals?: number;
      currentTransferIndex?: number;
      totalTransfers?: number;
      error?: string;
    }
  ) => void;
  updateAssetStatus: (
    assetId: string,
    step: CleanStep,
    error?: string,
    txHash?: string
  ) => void;
  reset: () => void;
};

const initialProgress: CleanProgress = {
  isActive: false,
  totalAssets: 0,
  completedAssets: 0,
  chains: new Map(),
  assets: [],
};

export const useCleanProgress = create<CleanProgressStore>((set) => ({
  progress: initialProgress,

  startCleaning: (assets: { id: string; name: string; chainId: number }[]) => {
    const assetStatuses: AssetCleanStatus[] = assets.map((a) => ({
      assetId: a.id,
      assetName: a.name,
      chainId: a.chainId,
      step: "idle",
    }));

    // Group by chains
    const chains = new Map<number, ChainProgress>();
    const chainIds = [...new Set(assets.map((a) => a.chainId))];
    chainIds.forEach((chainId) => {
      chains.set(chainId, {
        chainId,
        step: "idle",
      });
    });

    set({
      progress: {
        isActive: true,
        totalAssets: assets.length,
        completedAssets: 0,
        chains,
        assets: assetStatuses,
      },
    });
  },

  updateChainProgress: (chainId, step, data) => {
    set((state) => {
      const chains = new Map(state.progress.chains);
      const chainProgress = chains.get(chainId) || {
        chainId,
        step: "idle",
      };
      
      chains.set(chainId, {
        ...chainProgress,
        step,
        ...data,
      });

      return {
        progress: {
          ...state.progress,
          currentChainId: chainId,
          chains,
        },
      };
    });
  },

  updateAssetStatus: (assetId, step, error, txHash) => {
    set((state) => {
      const assets = state.progress.assets.map((asset) =>
        asset.assetId === assetId
          ? { ...asset, step, error, txHash }
          : asset
      );

      const completedAssets = assets.filter((a) => a.step === "completed").length;

      return {
        progress: {
          ...state.progress,
          assets,
          completedAssets,
        },
      };
    });
  },

  reset: () => {
    set({ progress: initialProgress });
  },
}));
