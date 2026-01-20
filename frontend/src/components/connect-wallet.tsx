"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";

export function ConnectWallet() {
  const [showWallets, setShowWallets] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by rendering consistent initial state
  if (!mounted) {
    return (
      <Button disabled>
        Connect Wallet
      </Button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="font-mono text-sm">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setShowWallets(!showWallets)}
        disabled={isPending}
      >
        {isPending ? "Connecting..." : "Connect Wallet"}
      </Button>

      {showWallets && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowWallets(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-card border rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="p-3 border-b">
              <p className="font-medium text-sm">Select Wallet</p>
            </div>
            <div className="p-2">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => {
                    connect({ connector });
                    setShowWallets(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left"
                >
                  {connector.icon && (
                    <img
                      src={connector.icon}
                      alt={connector.name}
                      className="w-8 h-8 rounded-lg"
                    />
                  )}
                  <div>
                    <p className="font-medium text-sm">{connector.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {connector.type === "injected" ? "Browser Extension" : connector.type}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
