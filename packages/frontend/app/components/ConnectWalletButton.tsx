'use client';

import { ConnectButton } from "@rainbow-me/rainbowkit";

export const ConnectWalletButton = () => (
  <ConnectButton.Custom>
    {({ account, chain, mounted, openAccountModal, openChainModal, openConnectModal }) => {
      const ready = mounted;
      const connected = ready && account && chain;

      if (!connected) {
        return (
          <button
            type="button"
            onClick={openConnectModal}
            className="brand-gradient inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-950 shadow-lg shadow-emerald-400/30 transition hover:shadow-emerald-200/60 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
          >
            Connect Wallet
          </button>
        );
      }

      if (chain?.unsupported) {
        return (
          <button
            type="button"
            onClick={openChainModal}
            className="inline-flex items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-rose-200 transition hover:border-rose-400/60 focus:outline-none focus:ring-2 focus:ring-rose-400/60"
          >
            Switch Network
          </button>
        );
      }

      return (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openChainModal}
            className="inline-flex items-center justify-center rounded-full border border-emerald-400/30 bg-slate-900/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-100 transition hover:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
          >
            {chain?.name ?? "Network"}
          </button>
          <button
            type="button"
            onClick={openAccountModal}
            className="inline-flex items-center justify-center rounded-full border border-slate-500/30 bg-slate-900/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-200 transition hover:border-emerald-400/40 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
          >
            {account?.displayName ?? "Wallet"}
          </button>
        </div>
      );
    }}
  </ConnectButton.Custom>
);


