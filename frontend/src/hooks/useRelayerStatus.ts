import { useState, useEffect, useRef } from "react";

const RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_URL || "http://localhost:3001";

type RelayerStatusValue = "pending" | "processing" | "complete" | "failed";

interface RelayerStatusResponse {
  status: RelayerStatusValue;
  destTxHash?: string;
  error?: string;
  timestamp?: number;
}

interface UseRelayerStatusOptions {
  txHash: string | undefined;
  enabled: boolean;
  pollingInterval?: number;
}

const DEFAULT_STATUS: RelayerStatusResponse = { status: "pending" };

export function useRelayerStatus({ txHash, enabled, pollingInterval = 2000 }: UseRelayerStatusOptions) {
  const [statusData, setStatusData] = useState<{ txHash: string; response: RelayerStatusResponse } | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing interval
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    // Don't poll if not enabled or no txHash
    if (!enabled || !txHash) {
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${RELAYER_URL}/status/${txHash}?t=${Date.now()}`, {
          cache: 'no-store',
        });
        const data: RelayerStatusResponse = await res.json();

        // Store response WITH the txHash it belongs to
        setStatusData({ txHash, response: data });

        console.log(data)

        // Stop polling on terminal states
        if (data.status === "complete" || data.status === "failed") {
          if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
            intervalIdRef.current = null;
          }
        }
      } catch (error) {
        console.error("Error fetching relayer status:", error);
      }
    };

    // Fetch immediately
    fetchStatus();

    // Then poll every pollingInterval ms
    intervalIdRef.current = setInterval(fetchStatus, pollingInterval);

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [txHash, enabled, pollingInterval]);

  // Derive the status:
  // - If we have data for THIS txHash, use it
  // - Otherwise, return default "pending"
  const status = (statusData && statusData.txHash === txHash)
    ? statusData.response
    : DEFAULT_STATUS;

  const isPolling = enabled && !!txHash && status.status !== "complete" && status.status !== "failed";

  return { status, isPolling };
}
