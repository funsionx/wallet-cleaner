"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { mainnet, polygon, optimism, base, arbitrum } from "wagmi/chains";
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { StateSyncLoading } from "@/components/state-sync-loading";

const queryClient = new QueryClient();

// Basic wagmi config. TODO: allow dynamic chain selection and RPCs from env
export const wagmiConfig = getDefaultConfig({
  appName: "Wallet Cleaner",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "demo",
  chains: [mainnet, base, arbitrum, polygon, optimism],
  ssr: false,
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()} modalSize="compact">
          {children}
          <StateSyncLoading />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
