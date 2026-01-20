export type TxStatusState = "pending" | "processing" | "complete" | "failed";

export interface TxStatus {
  status: TxStatusState;
  destTxHash?: string;
  error?: string;
  timestamp: number;
}

export interface EthLockedEvent {
  sender: `0x${string}`;
  recipient: `0x${string}`;
  amount: bigint;
  nonce: bigint;
  destinationChainId: bigint;
}

export interface TokensBurnedEvent {
  wrappedToken: `0x${string}`;
  sender: `0x${string}`;
  recipient: `0x${string}`;
  amount: bigint;
  nonce: bigint;
  destinationChainId: bigint;
}
