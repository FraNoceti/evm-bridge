"use client";

import { useReducer, useCallback, useRef, useEffect, useState } from "react";
import { useAccount, useBalance, useSwitchChain, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseEther, formatEther } from "viem";
import { sepolia, baseSepolia } from "wagmi/chains";
import { CONTRACTS, BRIDGE_DESTINATION_ABI, WRAPPED_TOKEN_ABI } from "@/config/contracts";
import { useRelayerStatus } from "@/hooks/useRelayerStatus";
import { BridgeTransaction } from "@/hooks/useTransactionHistory";
import { TransactionDetails, TransactionStep } from "@/components/transaction-progress";

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
  isApprovalFlow: boolean;
};

type BridgeAction =
  | { type: "START_APPROVE"; amount: string }
  | { type: "START_BURN"; amount: string; balanceBefore?: string }
  | { type: "TX_SUBMITTED"; txHash: string }
  | { type: "TX_CONFIRMED"; blockNumber: bigint; gasUsed: bigint }
  | { type: "APPROVAL_COMPLETE" }
  | { type: "RELAYER_PROCESSING" }
  | { type: "COMPLETE"; destTxHash?: string; balanceAfter?: string }
  | { type: "ERROR"; error: string }
  | { type: "CLOSE" }
  | { type: "SET_AMOUNT"; amount: string };

const initialState: BridgeState = {
  showProgress: false,
  amount: "",
  step: "idle",
  isApprovalFlow: false,
};

function bridgeReducer(state: BridgeState, action: BridgeAction): BridgeState {
  switch (action.type) {
    case "START_APPROVE":
      return {
        ...state,
        showProgress: true,
        amount: action.amount,
        step: "awaiting-signature",
        error: undefined,
        isApprovalFlow: true,
      };
    case "START_BURN":
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
        isApprovalFlow: false,
      };
    case "TX_SUBMITTED":
      return { ...state, step: "confirming", txHash: action.txHash };
    case "TX_CONFIRMED":
      return {
        ...state,
        step: state.isApprovalFlow ? "idle" : "awaiting-relayer",
        blockNumber: action.blockNumber,
        gasUsed: action.gasUsed,
      };
    case "APPROVAL_COMPLETE":
      return { ...state, showProgress: false, step: "idle", isApprovalFlow: false };
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

interface UseBridgeToSepoliaProps {
  addTransaction: (tx: Omit<BridgeTransaction, "id" | "timestamp">) => string;
  updateTransaction: (sourceTxHash: string, updates: Partial<BridgeTransaction>) => void;
  onComplete: () => void;
}

export function useBridgeToSepolia({ addTransaction, updateTransaction, onComplete }: UseBridgeToSepoliaProps) {
  const [state, dispatch] = useReducer(bridgeReducer, initialState);
  const [needsApproval, setNeedsApproval] = useState(false);
  const txAddedRef = useRef<string | null>(null);

  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  // wSepETH balance on Base Sepolia
  const { data: wSepEthBalance, refetch: refetchWsepEthBalance } = useReadContract({
    address: CONTRACTS.wrappedToken.address,
    abi: WRAPPED_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: baseSepolia.id,
  });

  // ETH balance on Sepolia (destination)
  const { data: sepoliaBalance, refetch: refetchSepoliaBalance } = useBalance({
    address,
    chainId: sepolia.id,
  });

  // Allowance check
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.wrappedToken.address,
    abi: WRAPPED_TOKEN_ABI,
    functionName: "allowance",
    args: address ? [address, CONTRACTS.bridgeDestination.address] : undefined,
    chainId: baseSepolia.id,
  });

  // Approve contract
  const { writeContract: approve, data: approveHash, isPending: isApproving, reset: resetApprove } = useWriteContract({
    mutation: {
      onSuccess: (txHash) => {
        dispatch({ type: "TX_SUBMITTED", txHash });
      },
      onError: (error) => {
        const message = error.message.includes("User rejected") ? "Transaction rejected" : error.message;
        dispatch({ type: "ERROR", error: message });
      },
    },
  });

  // Burn contract
  const { writeContract: burn, data: burnHash, isPending: isBurning, reset: resetBurn } = useWriteContract({
    mutation: {
      onSuccess: (txHash) => {
        dispatch({ type: "TX_SUBMITTED", txHash });
        if (txAddedRef.current !== txHash) {
          txAddedRef.current = txHash;
          addTransaction({
            direction: "to-sepolia",
            amount: state.amount,
            sourceTxHash: txHash,
            status: "pending",
            sourceChain: "Base Sepolia",
            destChain: "Sepolia",
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

  // Watch approve receipt
  const { data: approveReceipt } = useWaitForTransactionReceipt({
    hash: approveHash,
    query: { enabled: !!approveHash },
  });

  // Watch burn receipt
  const { data: burnReceipt } = useWaitForTransactionReceipt({
    hash: burnHash,
    query: { enabled: !!burnHash },
  });

  const isOnBase = chainId === baseSepolia.id;
  const amountWei = state.amount ? parseEther(state.amount) : BigInt(0);
  const formattedBalance = wSepEthBalance ? formatEther(wSepEthBalance as bigint) : "0";

  // Check approval status when amount or allowance changes
  useEffect(() => {
    if (allowance !== undefined && amountWei > BigInt(0)) {
      setNeedsApproval(amountWei > allowance);
    }
  }, [allowance, amountWei]);

  // Handle approve receipt
  useEffect(() => {
    if (approveReceipt && state.isApprovalFlow && state.step === "confirming") {
      dispatch({ type: "APPROVAL_COMPLETE" });
      refetchAllowance();
    }
  }, [approveReceipt, state.isApprovalFlow, state.step, refetchAllowance]);

  // Handle burn receipt
  useEffect(() => {
    if (burnReceipt && !state.isApprovalFlow && state.step === "confirming") {
      dispatch({ type: "TX_CONFIRMED", blockNumber: burnReceipt.blockNumber, gasUsed: burnReceipt.gasUsed });
    }
  }, [burnReceipt, state.isApprovalFlow, state.step]);

  // Poll relayer for status
  const { status: relayerStatus } = useRelayerStatus({
    txHash: burnHash,
    enabled: state.step === "awaiting-relayer" || state.step === "relayer-processing",
  });

  // Watch relayer status
  useEffect(() => {
    if (relayerStatus.status === "processing" && state.step === "awaiting-relayer") {
      dispatch({ type: "RELAYER_PROCESSING" });
      if (burnHash) updateTransaction(burnHash, { status: "processing" });
    }

    if (relayerStatus.status === "complete" && state.step !== "complete" && state.step !== "idle") {
      refetchSepoliaBalance().then((result) => {
        const balanceAfter = result.data ? parseFloat(formatEther(result.data.value)).toFixed(6) : undefined;
        dispatch({ type: "COMPLETE", destTxHash: relayerStatus.destTxHash, balanceAfter });
        if (burnHash) {
          updateTransaction(burnHash, {
            status: "complete",
            destTxHash: relayerStatus.destTxHash,
            balanceAfter,
          });
        }
        refetchWsepEthBalance();
        onComplete();
      });
    }

    if (relayerStatus.status === "failed" && state.step !== "error" && state.step !== "idle") {
      dispatch({ type: "ERROR", error: relayerStatus.error || "Relayer failed" });
      if (burnHash) updateTransaction(burnHash, { status: "failed", error: relayerStatus.error });
    }
  }, [relayerStatus.status, relayerStatus.destTxHash, relayerStatus.error, state.step, burnHash, updateTransaction, refetchSepoliaBalance, refetchWsepEthBalance, onComplete]);

  const handleApprove = useCallback(() => {
    if (!state.amount) return;
    dispatch({ type: "START_APPROVE", amount: state.amount });

    approve({
      address: CONTRACTS.wrappedToken.address,
      abi: WRAPPED_TOKEN_ABI,
      functionName: "approve",
      args: [CONTRACTS.bridgeDestination.address, parseEther(state.amount)],
      chainId: baseSepolia.id,
    });
  }, [state.amount, approve]);

  const handleBurn = useCallback(() => {
    if (!address || !state.amount) return;

    const currentBalance = sepoliaBalance ? parseFloat(formatEther(sepoliaBalance.value)).toFixed(6) : undefined;
    dispatch({ type: "START_BURN", amount: state.amount, balanceBefore: currentBalance });

    burn({
      address: CONTRACTS.bridgeDestination.address,
      abi: BRIDGE_DESTINATION_ABI,
      functionName: "burnTokens",
      args: [CONTRACTS.wrappedToken.address, parseEther(state.amount), address, BigInt(sepolia.id)],
      chainId: baseSepolia.id,
    });
  }, [address, state.amount, sepoliaBalance, burn]);

  const handleClose = useCallback(() => {
    dispatch({ type: "CLOSE" });
    resetApprove();
    resetBurn();
    txAddedRef.current = null;
  }, [resetApprove, resetBurn]);

  const handleSwitchChain = useCallback(() => {
    switchChain({ chainId: baseSepolia.id });
  }, [switchChain]);

  const setAmount = useCallback((amount: string) => {
    dispatch({ type: "SET_AMOUNT", amount });
  }, []);

  const txDetails: TransactionDetails = {
    step: state.step,
    direction: "to-sepolia",
    amount: state.amount,
    txHash: state.txHash,
    destTxHash: state.destTxHash,
    blockNumber: state.blockNumber,
    gasUsed: state.gasUsed,
    error: state.error,
    sourceChain: "Base Sepolia",
    destChain: "Sepolia",
    balanceBefore: state.balanceBefore,
    balanceAfter: state.balanceAfter,
  };

  return {
    amount: state.amount,
    setAmount,
    showProgress: state.showProgress,
    txDetails,
    wSepEthBalance: formattedBalance,
    isOnBase,
    needsApproval,
    isApproving,
    isApproveTxPending: state.isApprovalFlow && state.step === "confirming",
    isBurning,
    isBurnTxPending: !state.isApprovalFlow && state.step === "confirming",
    handleApprove,
    handleBurn,
    handleClose,
    handleSwitchChain,
  };
}
