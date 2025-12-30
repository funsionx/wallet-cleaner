import { create } from "zustand";

type NetworkFilterStore = {
  networkFilter: "all" | 1 | 8453 | 42161 | 10 | 137;
  setNetworkFilter: (filter: "all" | 1 | 8453 | 42161 | 10 | 137) => void;
};

export const useNetworkFilter = create<NetworkFilterStore>((set) => ({
  networkFilter: "all",
  setNetworkFilter: (filter) => set({ networkFilter: filter }),
}));
