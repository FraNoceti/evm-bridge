"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export type TransactionStep =
  | "idle"
  | "awaiting-signature"
  | "broadcasting"
  | "confirming"
  | "confirmed"
  | "awaiting-relayer"
  | "relayer-processing"
  | "complete"
  | "error";

export interface TransactionDetails {
  step: TransactionStep;
  direction: "to-base" | "to-sepolia";
  amount?: string;
  txHash?: string;
  destTxHash?: string;
  blockNumber?: bigint;
  gasUsed?: bigint;
  nonce?: number;
  error?: string;
  sourceChain?: string;
  destChain?: string;
  balanceBefore?: string;
  balanceAfter?: string;
}

const STEP_CONFIG: Record<TransactionStep, { label: string; description: string; progress: number }> = {
  "idle": { label: "Ready", description: "Waiting to start", progress: 0 },
  "awaiting-signature": { label: "Awaiting Signature", description: "Please confirm the transaction in your wallet", progress: 10 },
  "broadcasting": { label: "Broadcasting", description: "Sending transaction to the network", progress: 25 },
  "confirming": { label: "Confirming", description: "Waiting for block confirmation", progress: 40 },
  "confirmed": { label: "Confirmed", description: "Transaction confirmed on source chain", progress: 60 },
  "awaiting-relayer": { label: "Awaiting Relayer", description: "Waiting for relayer to detect the event", progress: 70 },
  "relayer-processing": { label: "Relayer Processing", description: "Relayer is processing your transfer", progress: 85 },
  "complete": { label: "Complete", description: "Bridge transfer successful!", progress: 100 },
  "error": { label: "Error", description: "Transaction failed", progress: 0 },
};

interface TransactionProgressProps {
  isOpen: boolean;
  onClose: () => void;
  details: TransactionDetails;
}

export function TransactionProgress({ isOpen, onClose, details }: TransactionProgressProps) {
  const config = STEP_CONFIG[details.step];
  const isError = details.step === "error";
  const isComplete = details.step === "complete";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {!isError && !isComplete && (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
            {isComplete && (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {isError && (
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            Bridge Transaction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto max-h-[70vh]">
          {/* Direction Badge */}
          <div className="flex items-center justify-center">
            <Badge variant="outline" className="px-4 py-2 text-sm">
              {details.direction === "to-base" ? "Sepolia → Base Sepolia" : "Base Sepolia → Sepolia"}
            </Badge>
          </div>

          {/* Amount */}
          {details.amount && (
            <div className="text-center">
              <p className="text-3xl font-bold">{details.amount}</p>
              <p className="text-muted-foreground">
                {details.direction === "to-base" ? "ETH" : "wSepETH"}
              </p>
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className={isError ? "text-red-500 font-medium" : "font-medium"}>
                {config.label}
              </span>
              <span className="text-muted-foreground">{config.progress}%</span>
            </div>
            <Progress
              value={config.progress}
              className={isError ? "[&>div]:bg-red-500" : isComplete ? "[&>div]:bg-green-500" : ""}
            />
            <p className={`text-sm ${isError ? "text-red-500" : "text-muted-foreground"}`}>
              {isError && details.error ? details.error : config.description}
            </p>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between items-center">
            {["Sign", "Broadcast", "Confirm", "Relayer", "Done"].map((step, i) => {
              const stepProgress = [10, 25, 60, 85, 100];
              const isActive = config.progress >= stepProgress[i];
              const isCurrent = config.progress >= stepProgress[i] && (i === 4 || config.progress < stepProgress[i + 1]);

              return (
                <div key={step} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                      isActive
                        ? isError ? "bg-red-500 text-white" : "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    } ${isCurrent && !isError && !isComplete ? "ring-2 ring-primary ring-offset-1" : ""}`}
                  >
                    {i + 1}
                  </div>
                  <span className={`text-[10px] ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Balance Change */}
          {details.balanceBefore && details.balanceAfter && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-sm font-medium text-green-600 mb-2">Balance Change</p>
              <div className="flex items-center justify-center gap-3 text-sm">
                <span className="font-mono">{details.balanceBefore}</span>
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <span className="font-mono font-bold text-green-600">{details.balanceAfter}</span>
              </div>
            </div>
          )}

          {/* Technical Details */}
          {(details.txHash || details.destTxHash || details.blockNumber || details.gasUsed) && (
            <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">Technical Details</p>

              {details.txHash && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    Source TX ({details.direction === "to-base" ? "Sepolia" : "Base Sepolia"})
                  </span>
                  <a
                    href={`https://${details.direction === "to-base" ? "sepolia.etherscan.io" : "sepolia.basescan.org"}/tx/${details.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-primary hover:underline break-all"
                  >
                    {details.txHash}
                  </a>
                </div>
              )}

              {details.destTxHash && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    Destination TX ({details.direction === "to-base" ? "Base Sepolia" : "Sepolia"})
                  </span>
                  <a
                    href={`https://${details.direction === "to-base" ? "sepolia.basescan.org" : "sepolia.etherscan.io"}/tx/${details.destTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-primary hover:underline break-all"
                  >
                    {details.destTxHash}
                  </a>
                </div>
              )}

              {details.blockNumber && (
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Block Number</span>
                  <span className="text-xs font-mono">{details.blockNumber.toString()}</span>
                </div>
              )}

              {details.gasUsed && (
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Gas Used</span>
                  <span className="text-xs font-mono">{details.gasUsed.toString()}</span>
                </div>
              )}

              {details.nonce !== undefined && (
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Bridge Nonce</span>
                  <span className="text-xs font-mono">{details.nonce}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {(isComplete || isError) && (
            <button
              onClick={onClose}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              {isComplete ? "Done" : "Close"}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
