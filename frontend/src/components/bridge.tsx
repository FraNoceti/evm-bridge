"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TransactionProgress, TransactionDetails } from "@/components/transaction-progress";
import { PendingTransactions } from "@/components/pending-transactions";
import { useBridgeToBase } from "@/hooks/useBridgeToBase";
import { useBridgeToSepolia } from "@/hooks/useBridgeToSepolia";
import { useTransactionHistory, BridgeTransaction } from "@/hooks/useTransactionHistory";

// Presentational component for balance display
function BalanceDisplay({ label, balance, symbol, isConnected }: {
  label: string;
  balance: string;
  symbol: string;
  isConnected: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{balance} {symbol}</p>
      </div>
      <Badge variant={isConnected ? "default" : "secondary"}>
        {isConnected ? "Connected" : "Wrong Network"}
      </Badge>
    </div>
  );
}

// Presentational component for amount input
function AmountInput({ id, value, onChange, symbol, maxAmount, onMaxClick }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  symbol: string;
  maxAmount?: string;
  onMaxClick?: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Amount to Bridge</Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          placeholder="0.0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={symbol.length > 4 ? "pr-24" : "pr-16"}
          step="0.001"
          min="0"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          {symbol}
        </span>
      </div>
      {maxAmount && onMaxClick && (
        <button onClick={onMaxClick} className="text-xs text-primary hover:underline">
          Max: {maxAmount} {symbol}
        </button>
      )}
    </div>
  );
}

// Presentational component for direction indicator
function DirectionIndicator({ from, to }: { from: string; to: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full text-sm">
        <span>{from}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        <span>{to}</span>
      </div>
    </div>
  );
}

// Bridge to Base tab content
interface BridgeToBaseProps {
  addTransaction: (tx: Omit<BridgeTransaction, "id" | "timestamp">) => string;
  updateTransaction: (sourceTxHash: string, updates: Partial<BridgeTransaction>) => void;
  onComplete: () => void;
}

function BridgeToBase({ addTransaction, updateTransaction, onComplete }: BridgeToBaseProps) {
  const {
    amount,
    setAmount,
    showProgress,
    txDetails,
    sepoliaBalance,
    isOnSepolia,
    isPending,
    isConfirming,
    handleBridge,
    handleClose,
    handleSwitchChain,
  } = useBridgeToBase({ addTransaction, updateTransaction, onComplete });

  const formattedBalance = sepoliaBalance ? parseFloat(formatEther(sepoliaBalance.value)).toFixed(4) : "0";
  const fullBalance = sepoliaBalance ? formatEther(sepoliaBalance.value) : "0";

  return (
    <>
      <div className="space-y-6">
        <BalanceDisplay
          label="Your Sepolia ETH"
          balance={formattedBalance}
          symbol="ETH"
          isConnected={isOnSepolia}
        />

        {!isOnSepolia && (
          <Button onClick={handleSwitchChain} className="w-full" variant="outline">
            Switch to Sepolia
          </Button>
        )}

        <AmountInput
          id="amount-to-base"
          value={amount}
          onChange={setAmount}
          symbol="ETH"
          maxAmount={formattedBalance}
          onMaxClick={() => setAmount(fullBalance)}
        />

        <DirectionIndicator from="Sepolia" to="Base Sepolia" />

        <Button
          onClick={handleBridge}
          disabled={!isOnSepolia || !amount || isPending || isConfirming}
          className="w-full h-12 text-lg"
        >
          Bridge to Base
        </Button>
      </div>

      <TransactionProgress isOpen={showProgress} onClose={handleClose} details={txDetails} />
    </>
  );
}

// Bridge to Sepolia tab content
interface BridgeToSepoliaProps {
  addTransaction: (tx: Omit<BridgeTransaction, "id" | "timestamp">) => string;
  updateTransaction: (sourceTxHash: string, updates: Partial<BridgeTransaction>) => void;
  onComplete: () => void;
}

function BridgeToSepolia({ addTransaction, updateTransaction, onComplete }: BridgeToSepoliaProps) {
  const {
    amount,
    setAmount,
    showProgress,
    txDetails,
    wSepEthBalance,
    isOnBase,
    needsApproval,
    isApproving,
    isApproveTxPending,
    isBurning,
    isBurnTxPending,
    handleApprove,
    handleBurn,
    handleClose,
    handleSwitchChain,
  } = useBridgeToSepolia({ addTransaction, updateTransaction, onComplete });

  const formattedBalance = parseFloat(wSepEthBalance).toFixed(4);

  return (
    <>
      <div className="space-y-6">
        <BalanceDisplay
          label="Your wSepETH on Base"
          balance={formattedBalance}
          symbol="wSepETH"
          isConnected={isOnBase}
        />

        {!isOnBase && (
          <Button onClick={handleSwitchChain} className="w-full" variant="outline">
            Switch to Base Sepolia
          </Button>
        )}

        <AmountInput
          id="amount-to-sepolia"
          value={amount}
          onChange={setAmount}
          symbol="wSepETH"
          maxAmount={formattedBalance}
          onMaxClick={() => setAmount(wSepEthBalance)}
        />

        <DirectionIndicator from="Base Sepolia" to="Sepolia" />

        {needsApproval ? (
          <Button
            onClick={handleApprove}
            disabled={!isOnBase || !amount || isApproving || isApproveTxPending}
            className="w-full h-12 text-lg"
          >
            Approve wSepETH
          </Button>
        ) : (
          <Button
            onClick={handleBurn}
            disabled={!isOnBase || !amount || isBurning || isBurnTxPending}
            className="w-full h-12 text-lg"
          >
            Bridge to Sepolia
          </Button>
        )}
      </div>

      <TransactionProgress isOpen={showProgress} onClose={handleClose} details={txDetails} />
    </>
  );
}

// Main Bridge component
export function Bridge() {
  const [mounted, setMounted] = useState(false);
  const [selectedTx, setSelectedTx] = useState<BridgeTransaction | null>(null);
  const { isConnected } = useAccount();

  const { transactions, addTransaction, updateTransaction } = useTransactionHistory();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Callback when any bridge operation completes - can be used for notifications, etc.
  const handleBridgeComplete = useCallback(() => {
    // Balances are auto-refetched in the hooks
    // Could add toast notification here
  }, []);

  // Handle selecting a pending transaction from the floating indicator
  const handleSelectPendingTx = useCallback((tx: BridgeTransaction) => {
    setSelectedTx(tx);
  }, []);

  // Close selected transaction detail
  const handleCloseSelectedTx = useCallback(() => {
    setSelectedTx(null);
  }, []);

  // Show loading state during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>EVM Bridge</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>EVM Bridge</CardTitle>
          <CardDescription>Connect your wallet to start bridging</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          <div className="text-center text-muted-foreground">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
            </svg>
            <p>Please connect your wallet above</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Build details for selected pending transaction
  const selectedTxDetails: TransactionDetails | null = selectedTx ? {
    step: selectedTx.status === "pending" ? "awaiting-relayer" :
          selectedTx.status === "processing" ? "relayer-processing" :
          selectedTx.status === "complete" ? "complete" :
          selectedTx.status === "failed" ? "error" : "idle",
    direction: selectedTx.direction,
    amount: selectedTx.amount,
    txHash: selectedTx.sourceTxHash,
    destTxHash: selectedTx.destTxHash,
    error: selectedTx.error,
    sourceChain: selectedTx.sourceChain,
    destChain: selectedTx.destChain,
    balanceBefore: selectedTx.balanceBefore,
    balanceAfter: selectedTx.balanceAfter,
  } : null;

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Bridge Assets</CardTitle>
          <CardDescription>Transfer ETH between Sepolia and Base Sepolia</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="to-base" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="to-base">To Base</TabsTrigger>
              <TabsTrigger value="to-sepolia">To Sepolia</TabsTrigger>
            </TabsList>
            <TabsContent value="to-base">
              <BridgeToBase
                addTransaction={addTransaction}
                updateTransaction={updateTransaction}
                onComplete={handleBridgeComplete}
              />
            </TabsContent>
            <TabsContent value="to-sepolia">
              <BridgeToSepolia
                addTransaction={addTransaction}
                updateTransaction={updateTransaction}
                onComplete={handleBridgeComplete}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Floating pending transactions indicator */}
      <PendingTransactions
        transactions={transactions}
        onSelect={handleSelectPendingTx}
      />

      {/* Modal to show selected pending transaction */}
      {selectedTxDetails && (
        <TransactionProgress
          isOpen={!!selectedTx}
          onClose={handleCloseSelectedTx}
          details={selectedTxDetails}
        />
      )}
    </>
  );
}
