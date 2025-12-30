import { create } from "zustand";
import { persist } from "zustand/middleware";

type ExcludedAssetsStore = {
  excludedAssets: Set<string>;
  addExcludedAsset: (assetId: string) => void;
  removeExcludedAsset: (assetId: string) => void;
  isExcluded: (assetId: string) => boolean;
  clearAll: () => void;
};

export const useExcludedAssets = create<ExcludedAssetsStore>()(
  persist(
    (set, get) => ({
      excludedAssets: new Set<string>(),
      addExcludedAsset: (assetId: string) => {
        set((state) => ({
          excludedAssets: new Set(state.excludedAssets).add(assetId),
        }));
      },
      removeExcludedAsset: (assetId: string) => {
        set((state) => {
          const newSet = new Set(state.excludedAssets);
          newSet.delete(assetId);
          return { excludedAssets: newSet };
        });
      },
      isExcluded: (assetId: string) => {
        return get().excludedAssets.has(assetId);
      },
      clearAll: () => {
        set({ excludedAssets: new Set<string>() });
      },
    }),
    {
      name: "excluded-assets-storage",
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return {
            state: {
              ...state,
              excludedAssets: new Set(state.excludedAssets || []),
            },
          };
        },
        setItem: (name, value) => {
          const { state } = value;
          localStorage.setItem(
            name,
            JSON.stringify({
              state: {
                ...state,
                excludedAssets: Array.from(state.excludedAssets),
              },
            })
          );
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
