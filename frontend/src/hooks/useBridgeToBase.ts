"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { useAccount, useBalance, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { sepolia, baseSepolia } from "wagmi/chains";
import { CONTRACTS, BRIDGE_SOURCE_ABI } from "@/config/contracts";
import { useRelayerStatus } from "@/hooks/useRelayerStatus";
import { BridgeTransaction } from "@/hooks/useTransactionHistory";
import { TransactionDetails, TransactionStep } from "@/components/transaction-progress";

// State machine for transaction flow
type BridgeState = {
  showProgress: boolean;
  amount: string;
  balanceBefore?: string;
  balanceAfter?: string;
  txHash?: string;
  destTxHash?: string;
  blockNumber?: bigint;
  gasUsed?: bigint;
  step: TransactionStep;
  error?: string;
};

type BridgeAction =
  | { type: "START_BRIDGE"; amount: string; balanceBefore?: string }
  | { type: "TX_SUBMITTED"; txHash: string }
  | { type: "TX_CONFIRMED"; blockNumber: bigint; gasUsed: bigint }
  | { type: "RELAYER_PROCESSING" }
  | { type: "COMPLETE"; destTxHash?: string; balanceAfter?: string }
  | { type: "ERROR"; error: string }
  | { type: "CLOSE" }
  | { type: "SET_AMOUNT"; amount: string };

const initialState: BridgeState = {
  showProgress: false,
  amount: "",
  step: "idle",
};

function bridgeReducer(state: BridgeState, action: BridgeAction): BridgeState {
  switch (action.type) {
    case "START_BRIDGE":
      return {
        ...state,
        showProgress: true,
        amount: action.amount,
        balanceBefore: action.balanceBefore,
        step: "awaiting-signature",
        error: undefined,
        txHash: undefined,
        destTxHash: undefined,
        balanceAfter: undefined,
      };
    case "TX_SUBMITTED":
      return { ...state, step: "confirming", txHash: action.txHash };
    case "TX_CONFIRMED":
      return {
        ...state,
        step: "awaiting-relayer",
        blockNumber: action.blockNumber,
        gasUsed: action.gasUsed,
      };
    case "RELAYER_PROCESSING":
      return { ...state, step: "relayer-processing" };
    case "COMPLETE":
      return { ...state, step: "complete", destTxHash: action.destTxHash, balanceAfter: action.balanceAfter };
    case "ERROR":
      return { ...state, step: "error", error: action.error };
    case "CLOSE":
      return initialState;
    case "SET_AMOUNT":
      return { ...state, amount: action.amount };
    default:
      return state;
  }
}

interface UseBridgeToBaseProps {
  addTransaction: (tx: Omit<BridgeTransaction, "id" | "timestamp">) => string;
  updateTransaction: (sourceTxHash: string, updates: Partial<BridgeTransaction>) => void;
  onComplete: () => void;
}

export function useBridgeToBase({ addTransaction, updateTransaction, onComplete }: UseBridgeToBaseProps) {
  const [state, dispatch] = useReducer(bridgeReducer, initialState);
  const txAddedRef = useRef<string | null>(null);

  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const { data: sepoliaBalance, refetch: refetchSepoliaBalance } = useBalance({
    address,
    chainId: sepolia.id,
  });

  // writeContract with onSuccess/onError callbacks - no useEffect needed
  const { writeContract, data: hash, isPending, reset } = useWriteContract({
    mutation: {
      onSuccess: (txHash) => {
        dispatch({ type: "TX_SUBMITTED", txHash });
        // Only add to history once
        if (txAddedRef.current !== txHash) {
          txAddedRef.current = txHash;
          addTransaction({
            direction: "to-base",
            amount: state.amount,
            sourceTxHash: txHash,
            status: "pending",
            sourceChain: "Sepolia",
            destChain: "Base Sepolia",
            balanceBefore: state.balanceBefore,
          });
        }
      },
      onError: (error) => {
        const message = error.message.includes("User rejected") ? "Transaction rejected" : error.message;
        dispatch({ type: "ERROR", error: message });
      },
    },
  });

  // Watch for transaction receipt - need useEffect since it's external data
  const { data: receipt } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  useEffect(() => {
    if (receipt && state.step === "confirming") {
      dispatch({ type: "TX_CONFIRMED", blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed });
    }
  }, [receipt, state.step]);

  // Poll relayer for status
  const { status: relayerStatus } = useRelayerStatus({
    txHash: hash,
    enabled: state.step === "awaiting-relayer" || state.step === "relayer-processing",
  });

  // Watch relayer status - need useEffect since it's external polling
  useEffect(() => {
    if (relayerStatus.status === "processing" && state.step === "awaiting-relayer") {
      dispatch({ type: "RELAYER_PROCESSING" });
      if (hash) updateTransaction(hash, { status: "processing" });
    }

    if (relayerStatus.status === "complete" && state.step !== "complete" && state.step !== "idle") {
      refetchSepoliaBalance().then((result) => {
        const balanceAfter = result.data ? parseFloat(formatEther(result.data.value)).toFixed(6) : undefined;
        dispatch({ type: "COMPLETE", destTxHash: relayerStatus.destTxHash, balanceAfter });
        if (hash) {
          updateTransaction(hash, {
            status: "complete",
            destTxHash: relayerStatus.destTxHash,
            balanceAfter,
          });
        }
        onComplete();
      });
    }

    if (relayerStatus.status === "failed" && state.step !== "error" && state.step !== "idle") {
      dispatch({ type: "ERROR", error: relayerStatus.error || "Relayer failed" });
      if (hash) updateTransaction(hash, { status: "failed", error: relayerStatus.error });
    }
  }, [relayerStatus.status, relayerStatus.destTxHash, relayerStatus.error, state.step, hash, updateTransaction, refetchSepoliaBalance, onComplete]);

  const isOnSepolia = chainId === sepolia.id;

  const handleBridge = useCallback(() => {
    if (!address || !state.amount) return;

    const currentBalance = sepoliaBalance ? parseFloat(formatEther(sepoliaBalance.value)).toFixed(6) : undefined;
    dispatch({ type: "START_BRIDGE", amount: state.amount, balanceBefore: currentBalance });

    writeContract({
      address: CONTRACTS.bridgeSource.address,
      abi: BRIDGE_SOURCE_ABI,
      functionName: "lockEth",
      args: [address, BigInt(baseSepolia.id)],
      value: parseEther(state.amount),
      chainId: sepolia.id,
    });
  }, [address, state.amount, sepoliaBalance, writeContract]);

  const handleClose = useCallback(() => {
    dispatch({ type: "CLOSE" });
    reset();
    txAddedRef.current = null;
  }, [reset]);

  const handleSwitchChain = useCallback(() => {
    switchChain({ chainId: sepolia.id });
  }, [switchChain]);

  const setAmount = useCallback((amount: string) => {
    dispatch({ type: "SET_AMOUNT", amount });
  }, []);

  // Build TransactionDetails from state
  const txDetails: TransactionDetails = {
    step: state.step,
    direction: "to-base",
    amount: state.amount,
    txHash: state.txHash,
    destTxHash: state.destTxHash,
    blockNumber: state.blockNumber,
    gasUsed: state.gasUsed,
    error: state.error,
    sourceChain: "Sepolia",
    destChain: "Base Sepolia",
    balanceBefore: state.balanceBefore,
    balanceAfter: state.balanceAfter,
  };

  return {
    amount: state.amount,
    setAmount,
    showProgress: state.showProgress,
    txDetails,
    sepoliaBalance,
    isOnSepolia,
    isPending,
    isConfirming: state.step === "confirming",
    handleBridge,
    handleClose,
    handleSwitchChain,
  };
}
