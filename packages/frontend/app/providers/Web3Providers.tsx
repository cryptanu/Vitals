'use client';

import { useEffect, type ReactNode } from "react";
import { RainbowKitProvider, darkTheme, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, http } from "wagmi";
import { polygon, polygonAmoy } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "34a7645047c97f1c0137504b7a8bc29b";

const wagmiConfig = getDefaultConfig({
  appName: "De-concierge",
  projectId,
  chains: [polygon, polygonAmoy],
  ssr: true,
  transports: {
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Web3Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (projectId === "demo") {
      console.warn(
        "Using fallback WalletConnect project ID. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID before production."
      );
    }
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({ overlayBlur: "small" })}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}


