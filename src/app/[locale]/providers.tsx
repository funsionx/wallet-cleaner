"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, http, createConfig, Config } from "wagmi";
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
const chains = [mainnet, base, arbitrum, polygon, optimism] as const;
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "demo";
const alchemyKey =
  process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

const rkBase = getDefaultConfig({
  appName: "Wallet Cleaner",
  projectId,
  chains: chains,
  ssr: false,
});

const wagmiConfig: Config = alchemyKey
  ? createConfig({
      chains,
      transports: {
        [mainnet.id]: http(
          `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`
        ),
        [base.id]: http(`https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`),
        [arbitrum.id]: http(
          `https://arb-mainnet.g.alchemy.com/v2/${alchemyKey}`
        ),
        [polygon.id]: http(
          `https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`
        ),
        [optimism.id]: http(
          `https://opt-mainnet.g.alchemy.com/v2/${alchemyKey}`
        ),
      },
      ssr: false,
      pollingInterval: 20_000,
      batch: { multicall: true },
    })
  : rkBase;

export { wagmiConfig };

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
