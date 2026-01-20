"use client";

import { useState } from "react";
import { BridgeTransaction } from "@/hooks/useTransactionHistory";

interface PendingTransactionsProps {
  transactions: BridgeTransaction[];
  onSelect: (tx: BridgeTransaction) => void;
}

export function PendingTransactions({ transactions, onSelect }: PendingTransactionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const pendingTxs = transactions.filter(
    (tx) => tx.status === "pending" || tx.status === "processing"
  );

  if (pendingTxs.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isExpanded && (
        <div className="mb-2 bg-card border rounded-lg shadow-lg w-72 max-h-64 overflow-hidden">
          <div className="p-3 border-b flex justify-between items-center">
            <span className="text-sm font-medium">Pending Transactions</span>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto max-h-48">
            {pendingTxs.map((tx) => (
              <button
                key={tx.id}
                onClick={() => {
                  onSelect(tx);
                  setIsExpanded(false);
                }}
                className="w-full p-3 hover:bg-secondary/50 text-left border-b last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {tx.direction === "to-base" ? "→ Base" : "→ Sepolia"}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-600 rounded">
                    {tx.status}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {tx.amount} {tx.direction === "to-base" ? "ETH" : "wSepETH"}
                </div>
                <div className="text-xs text-muted-foreground font-mono truncate mt-1">
                  {tx.sourceTxHash.slice(0, 10)}...{tx.sourceTxHash.slice(-8)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-yellow-950 rounded-full shadow-lg hover:bg-yellow-400 transition-colors"
      >
        <div className="w-2 h-2 bg-yellow-950 rounded-full animate-pulse" />
        <span className="text-sm font-medium">
          {pendingTxs.length} Pending
        </span>
      </button>
    </div>
  );
}
