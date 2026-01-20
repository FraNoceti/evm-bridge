import { useCallback, useSyncExternalStore } from "react";

export interface BridgeTransaction {
  id: string;
  direction: "to-base" | "to-sepolia";
  amount: string;
  sourceTxHash: string;
  destTxHash?: string;
  status: "pending" | "processing" | "complete" | "failed";
  error?: string;
  timestamp: number;
  sourceChain: string;
  destChain: string;
  balanceBefore?: string;
  balanceAfter?: string;
}

const STORAGE_KEY = "bridge-transactions";
const MAX_TRANSACTIONS = 50;

// In-memory cache for SSR and to avoid parsing on every render
let cachedTransactions: BridgeTransaction[] = [];
const listeners = new Set<() => void>();

// Stable empty array for SSR - must be the same reference
const EMPTY_TRANSACTIONS: BridgeTransaction[] = [];

function notify() {
  listeners.forEach((l) => l());
}

function loadFromStorage(): BridgeTransaction[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveToStorage(txs: BridgeTransaction[]): void {
  try {
    const trimmed = txs.slice(0, MAX_TRANSACTIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage might be full or disabled
  }
}

// Store API
const transactionStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getSnapshot(): BridgeTransaction[] {
    return cachedTransactions;
  },

  getServerSnapshot(): BridgeTransaction[] {
    return EMPTY_TRANSACTIONS;
  },

  initialize() {
    cachedTransactions = loadFromStorage();
  },

  addTransaction(tx: Omit<BridgeTransaction, "id" | "timestamp">): string {
    const newTx: BridgeTransaction = {
      ...tx,
      id: `${tx.sourceTxHash}-${Date.now()}`,
      timestamp: Date.now(),
    };
    cachedTransactions = [newTx, ...cachedTransactions];
    saveToStorage(cachedTransactions);
    notify();
    return newTx.id;
  },

  updateTransaction(sourceTxHash: string, updates: Partial<BridgeTransaction>): void {
    cachedTransactions = cachedTransactions.map((tx) =>
      tx.sourceTxHash === sourceTxHash ? { ...tx, ...updates } : tx
    );
    saveToStorage(cachedTransactions);
    notify();
  },

  clearHistory(): void {
    cachedTransactions = [];
    saveToStorage(cachedTransactions);
    notify();
  },
};

// Initialize on client side
if (typeof window !== "undefined") {
  transactionStore.initialize();
}

export function useTransactionHistory() {
  const transactions = useSyncExternalStore(
    transactionStore.subscribe,
    transactionStore.getSnapshot,
    transactionStore.getServerSnapshot
  );

  const addTransaction = useCallback((tx: Omit<BridgeTransaction, "id" | "timestamp">) => {
    return transactionStore.addTransaction(tx);
  }, []);

  const updateTransaction = useCallback((sourceTxHash: string, updates: Partial<BridgeTransaction>) => {
    transactionStore.updateTransaction(sourceTxHash, updates);
  }, []);

  const getTransaction = useCallback(
    (sourceTxHash: string) => transactions.find((tx) => tx.sourceTxHash === sourceTxHash),
    [transactions]
  );

  const getPendingTransactions = useCallback(
    () => transactions.filter((tx) => tx.status === "pending" || tx.status === "processing"),
    [transactions]
  );

  const clearHistory = useCallback(() => {
    transactionStore.clearHistory();
  }, []);

  return {
    transactions,
    addTransaction,
    updateTransaction,
    getTransaction,
    getPendingTransactions,
    clearHistory,
  };
}
