"use client";

import React, { useState } from "react";
import Link from "next/link";

function highlightCode(code: string, language: string): React.ReactNode[] {
  const lines = code.split('\n');

  const tokenize = (line: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    // Patterns for syntax highlighting
    const patterns: [RegExp, string][] = language === 'solidity' ? [
      // Comments
      [/^(\/\/.*)/, 'text-gray-500 italic'],
      // Strings
      [/^("[^"]*"|'[^']*')/, 'text-amber-300'],
      // Numbers
      [/^(\d+)/, 'text-purple-400'],
      // Solidity keywords
      [/^(function|contract|interface|modifier|event|error|emit|returns?|external|internal|public|private|view|pure|payable|memory|storage|calldata|if|else|for|while|require|revert|import|pragma|solidity|mapping|struct|enum|address|uint256|uint8|bytes32|bytes|bool|string)\b/, 'text-pink-400'],
      // Types/constants
      [/^(true|false|null|undefined)\b/, 'text-purple-400'],
      // Function calls and definitions
      [/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/, 'text-yellow-300'],
      // Variables after type declarations
      [/^([a-zA-Z_][a-zA-Z0-9_]*)/, 'text-blue-300'],
      // Operators and punctuation
      [/^([{}()\[\];,.:=<>!&|+\-*\/]+)/, 'text-gray-300'],
      // Whitespace
      [/^(\s+)/, ''],
    ] : [
      // Comments
      [/^(\/\/.*)/, 'text-gray-500 italic'],
      // Template literals
      [/^(`[^`]*`)/, 'text-amber-300'],
      // Strings
      [/^("[^"]*"|'[^']*')/, 'text-amber-300'],
      // Numbers
      [/^(\d+n?)/, 'text-purple-400'],
      // Keywords
      [/^(const|let|var|function|async|await|return|if|else|for|while|switch|case|break|continue|try|catch|throw|new|class|extends|implements|interface|type|import|export|from|default|typeof|instanceof|in|of)\b/, 'text-pink-400'],
      // Types/constants
      [/^(true|false|null|undefined|void|any|string|number|boolean|Promise|Map|Set|Array|BigInt)\b/, 'text-purple-400'],
      // Arrow functions
      [/^(=>)/, 'text-pink-400'],
      // Object property access
      [/^(\.)([a-zA-Z_][a-zA-Z0-9_]*)/, 'text-gray-300'],
      // Function calls
      [/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/, 'text-yellow-300'],
      // Object keys
      [/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=:)/, 'text-blue-300'],
      // Variables
      [/^([a-zA-Z_][a-zA-Z0-9_]*)/, 'text-blue-300'],
      // Operators and punctuation
      [/^([{}()\[\];,.:=<>!&|+\-*\/?]+)/, 'text-gray-300'],
      // Whitespace
      [/^(\s+)/, ''],
    ];

    while (remaining.length > 0) {
      let matched = false;

      for (const [pattern, className] of patterns) {
        const match = remaining.match(pattern);
        if (match) {
          const text = match[1] || match[0];
          if (className) {
            tokens.push(<span key={key++} className={className}>{text}</span>);
          } else {
            tokens.push(<span key={key++}>{text}</span>);
          }
          remaining = remaining.slice(text.length);
          matched = true;
          break;
        }
      }

      if (!matched) {
        // No pattern matched, take one character
        tokens.push(<span key={key++}>{remaining[0]}</span>);
        remaining = remaining.slice(1);
      }
    }

    return tokens;
  };

  return lines.map((line, i) => (
    <div key={i} className="table-row">
      <span className="table-cell pr-4 text-gray-600 select-none text-right w-8">{i + 1}</span>
      <span className="table-cell">{tokenize(line)}</span>
    </div>
  ));
}

function CodeBlock({ code, language = "typescript" }: { code: string; language?: string }) {
  return (
    <div className="relative group rounded-lg overflow-hidden">
      <div className="absolute top-3 right-3 text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded z-10">
        {language}
      </div>
      <pre className="bg-[#1e1e2e] text-gray-100 rounded-lg p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <code className="table w-full">
          {highlightCode(code, language)}
        </code>
      </pre>
    </div>
  );
}

function ArchitectureFlow() {
  return (
    <div className="bg-gradient-to-br from-primary/5 to-secondary/20 border rounded-2xl p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Source Chain */}
        <div className="bg-card border-2 border-blue-500/30 rounded-xl p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="font-bold text-lg mb-1">Sepolia</h3>
          <p className="text-sm text-muted-foreground">Source Chain</p>
          <div className="mt-4 bg-secondary/50 rounded-lg p-3">
            <p className="text-xs font-mono text-blue-500">BridgeSource.sol</p>
            <p className="text-xs text-muted-foreground mt-1">Lock ETH / Unlock ETH</p>
          </div>
        </div>

        {/* Relayer in the middle */}
        <div className="flex flex-col items-center gap-4">
          <div className="hidden md:flex items-center gap-2 w-full">
            <div className="flex-1 border-t-2 border-dashed border-primary/40" />
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>

          <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl p-6 text-center shadow-lg">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-1">Relayer</h3>
            <p className="text-sm opacity-90">Off-chain Service</p>
            <div className="mt-4 bg-white/10 rounded-lg p-3">
              <p className="text-xs font-mono">Watch Events</p>
              <p className="text-xs opacity-80 mt-1">Mint / Unlock Tokens</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 w-full">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <div className="flex-1 border-t-2 border-dashed border-primary/40" />
          </div>
        </div>

        {/* Destination Chain */}
        <div className="bg-card border-2 border-green-500/30 rounded-xl p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="font-bold text-lg mb-1">Base Sepolia</h3>
          <p className="text-sm text-muted-foreground">Destination Chain</p>
          <div className="mt-4 bg-secondary/50 rounded-lg p-3">
            <p className="text-xs font-mono text-green-500">BridgeDestination.sol</p>
            <p className="text-xs text-muted-foreground mt-1">Mint wSepETH / Burn wSepETH</p>
          </div>
        </div>
      </div>

      {/* Flow description */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card/50 rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">1</span>
            <h4 className="font-semibold">Lock Flow (Sepolia → Base)</h4>
          </div>
          <ol className="text-sm text-muted-foreground space-y-1 ml-8 list-decimal">
            <li>User locks ETH on BridgeSource</li>
            <li>EthLocked event emitted</li>
            <li>Relayer detects event</li>
            <li>Relayer mints wSepETH on Base</li>
          </ol>
        </div>
        <div className="bg-card/50 rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">2</span>
            <h4 className="font-semibold">Burn Flow (Base → Sepolia)</h4>
          </div>
          <ol className="text-sm text-muted-foreground space-y-1 ml-8 list-decimal">
            <li>User burns wSepETH on BridgeDestination</li>
            <li>TokensBurned event emitted</li>
            <li>Relayer detects event</li>
            <li>Relayer unlocks ETH on Sepolia</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

type SectionId = "smart-contracts" | "relayer" | "frontend";

interface SectionSelectorProps {
  selected: SectionId;
  onSelect: (id: SectionId) => void;
}

function SectionSelector({ selected, onSelect }: SectionSelectorProps) {
  const sections = [
    {
      id: "smart-contracts" as const,
      label: "Smart Contracts",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      description: "Solidity contracts on-chain",
      color: "blue",
    },
    {
      id: "relayer" as const,
      label: "Relayer Service",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      ),
      description: "Off-chain event processor",
      color: "primary",
    },
    {
      id: "frontend" as const,
      label: "Frontend App",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      description: "Next.js user interface",
      color: "green",
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {sections.map((section) => {
        const isSelected = selected === section.id;
        return (
          <button
            key={section.id}
            onClick={() => onSelect(section.id)}
            className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${
              isSelected
                ? "border-primary bg-primary/5 shadow-md"
                : "border-transparent bg-card hover:border-primary/30 hover:bg-secondary/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {section.icon}
              </div>
              <div>
                <h3 className={`font-semibold ${isSelected ? "text-primary" : ""}`}>{section.label}</h3>
                <p className="text-xs text-muted-foreground">{section.description}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function SmartContractsSection() {
  const smartContractCode = `// BridgeSource.sol - Lock ETH for bridging
function lockEth(
    address recipient,
    uint256 destinationChainId
) external payable nonReentrant {
    if (recipient == address(0)) revert InvalidAddress();
    if (msg.value == 0) revert InvalidAmount();
    if (!supportedChains[destinationChainId]) revert UnsupportedChain();

    uint256 currentNonce = nonce++;

    emit EthLocked(
        msg.sender,
        recipient,
        msg.value,
        currentNonce,
        destinationChainId
    );
}`;

  const bridgeDestCode = `// BridgeDestination.sol - Mint wrapped tokens
function mintTokens(
    address sourceToken,
    address recipient,
    uint256 amount,
    uint256 sourceNonce,
    uint256 sourceChainId
) external onlyRelayer nonReentrant {
    address wrappedToken = tokenMappings[sourceChainId][sourceToken];
    if (wrappedToken == address(0)) revert TokenNotMapped();

    bytes32 mintId = keccak256(abi.encodePacked(sourceChainId, sourceNonce));
    if (processedMints[mintId]) revert AlreadyProcessed();

    processedMints[mintId] = true;
    WrappedToken(wrappedToken).mint(recipient, amount);

    emit TokensMinted(wrappedToken, recipient, amount, sourceNonce, sourceChainId);
}`;

  const wrappedTokenCode = `// WrappedToken.sol - ERC20 wrapped representation
contract WrappedToken is ERC20, Ownable {
    address public bridge;
    address public immutable sourceToken;
    uint256 public immutable sourceChainId;

    modifier onlyBridge() {
        if (msg.sender != bridge) revert OnlyBridge();
        _;
    }

    function mint(address to, uint256 amount) external onlyBridge {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyBridge {
        _burn(from, amount);
    }
}`;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-6">
        <span className="text-4xl font-bold text-primary/20">01</span>
        <div>
          <h2 className="text-2xl font-bold">Smart Contracts</h2>
          <p className="text-muted-foreground">The on-chain backbone written in Solidity</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-2">BridgeSource.sol</h3>
        <p className="text-muted-foreground mb-4">
          Deployed on Sepolia (source chain). Handles locking ETH when users want to bridge
          to Base, and unlocking ETH when they bridge back. Uses nonces and replay protection
          to ensure each bridge operation is processed exactly once.
        </p>
        <CodeBlock code={smartContractCode} language="solidity" />
      </div>

      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-2">BridgeDestination.sol</h3>
        <p className="text-muted-foreground mb-4">
          Deployed on Base Sepolia (destination chain). Mints wrapped tokens when the relayer
          confirms a lock, and burns tokens when users want to bridge back. Only the authorized
          relayer can mint tokens.
        </p>
        <CodeBlock code={bridgeDestCode} language="solidity" />
      </div>

      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-2">WrappedToken.sol</h3>
        <p className="text-muted-foreground mb-4">
          ERC20 token representing bridged ETH on the destination chain (wSepETH). Tracks
          the original token address and source chain. Only the bridge contract can mint
          and burn these tokens.
        </p>
        <CodeBlock code={wrappedTokenCode} language="solidity" />
      </div>

      <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
        <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <p className="text-sm text-muted-foreground">
          <strong>Security:</strong> Contracts use OpenZeppelin&apos;s battle-tested implementations
          for ERC20, Ownable, and ReentrancyGuard. All cross-chain operations require relayer
          authorization and include replay attack protection via processed nonce mappings.
        </p>
      </div>
    </div>
  );
}

function RelayerSection() {
  const relayerWatchCode = `// Start watching for bridge events on both chains
export async function startEventWatchers(): Promise<void> {
  // Watch for ETH locks on Sepolia
  sepoliaPublic.watchContractEvent({
    address: config.bridgeSource,
    abi: bridgeSourceAbi,
    eventName: "EthLocked",
    onLogs: (logs) => logs.forEach(handleEthLocked),
  });

  // Watch for token burns on Base Sepolia
  baseSepoliaPublic.watchContractEvent({
    address: config.bridgeDestination,
    abi: bridgeDestAbi,
    eventName: "TokensBurned",
    onLogs: (logs) => logs.forEach(handleTokensBurned),
  });
}`;

  const relayerEventCode = `// Handle EthLocked event - mint tokens on destination
async function handleEthLocked(log: any): Promise<void> {
  const { sender, recipient, amount, nonce } = log.args;
  const sourceTxHash = log.transactionHash;

  // Update status for frontend polling
  statusService.setProcessing(sourceTxHash);

  console.log("[SEPOLIA] EthLocked event detected!");
  console.log(\`  Amount: \${formatEther(amount)} ETH\`);

  // Mint wrapped tokens on destination chain
  const mintTxHash = await baseSepoliaWallet.writeContract({
    address: config.bridgeDestination,
    abi: bridgeDestAbi,
    functionName: "mintTokens",
    args: [zeroAddress, recipient, amount, nonce, BigInt(sepolia.id)],
  });

  // Mark as complete with destination tx hash
  statusService.setComplete(sourceTxHash, mintTxHash);
}`;

  const statusServiceCode = `// status.service.ts - Track transaction status
class StatusService {
  private statusMap = new Map<string, TxStatus>();

  setProcessing(txHash: string): void {
    this.set(txHash, { status: "processing", timestamp: Date.now() });
  }

  setComplete(txHash: string, destTxHash: string): void {
    this.set(txHash, {
      status: "complete",
      destTxHash,
      timestamp: Date.now()
    });
  }

  setFailed(txHash: string, error: string): void {
    this.set(txHash, { status: "failed", error, timestamp: Date.now() });
  }

  get(txHash: string): TxStatus {
    return this.statusMap.get(txHash.toLowerCase())
      || { status: "pending", timestamp: Date.now() };
  }
}`;

  const statusRoutesCode = `// status.routes.ts - HTTP API endpoints
const router = Router();

// Health check endpoint
router.get("/health", getHealth);
// GET /health → { ok: true, timestamp: 1234567890 }

// Transaction status by source tx hash
router.get("/status/:txHash", getStatus);
// GET /status/0x123... → { status: "complete", destTxHash: "0xabc...", timestamp: ... }

// View retry queue for failed operations
router.get("/retry-queue", getRetryQueue);
// GET /retry-queue → { count: 2, items: [...] }`;

  const statusTypesCode = `// types/index.ts - Status response types
type TxStatusState = "pending" | "processing" | "complete" | "failed";

interface TxStatus {
  status: TxStatusState;
  destTxHash?: string;  // Set when complete
  error?: string;       // Set when failed
  timestamp: number;
}`;

  const retryServiceCode = `// retry.service.ts - Handle failed operations
interface FailedOperation {
  type: "mint" | "unlock";
  sourceTxHash: string;
  recipient: Address;
  amount: bigint;
  nonce: bigint;
  attempts: number;
  lastError: string;
  createdAt: number;
}

class RetryService {
  private queue: FailedOperation[] = [];

  // Retry every 30 seconds, max 5 attempts
  constructor() {
    setInterval(() => this.processQueue(), 30_000);
  }

  addFailedMint(sourceTxHash, recipient, amount, nonce, error) {
    this.queue.push({
      type: "mint", sourceTxHash, recipient, amount,
      nonce, attempts: 1, lastError: error, createdAt: Date.now()
    });
  }

  getQueueStatus() {
    return { count: this.queue.length, items: [...this.queue] };
  }
}`;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-6">
        <span className="text-4xl font-bold text-primary/20">02</span>
        <div>
          <h2 className="text-2xl font-bold">Relayer Service</h2>
          <p className="text-muted-foreground">The off-chain orchestrator connecting both chains</p>
        </div>
      </div>

      <p className="text-muted-foreground leading-relaxed">
        The relayer is a Node.js/TypeScript service that continuously monitors both chains
        for bridge events. When it detects an <code className="bg-secondary px-1.5 py-0.5 rounded text-sm">EthLocked</code> event
        on Sepolia, it triggers a mint on Base. When it sees a <code className="bg-secondary px-1.5 py-0.5 rounded text-sm">TokensBurned</code> event
        on Base, it unlocks the original ETH on Sepolia.
      </p>

      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-2">Event Watching</h3>
        <p className="text-muted-foreground mb-4">
          Uses viem&apos;s <code className="bg-secondary px-1.5 py-0.5 rounded text-sm">watchContractEvent</code> to
          subscribe to real-time events from both bridge contracts. Events are processed
          with deduplication to prevent double-processing.
        </p>
        <CodeBlock code={relayerWatchCode} language="typescript" />
      </div>

      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-2">Event Handling</h3>
        <p className="text-muted-foreground mb-4">
          When an EthLocked event is detected, the relayer extracts the recipient, amount,
          and nonce, then submits a mint transaction to the destination chain.
        </p>
        <CodeBlock code={relayerEventCode} language="typescript" />
      </div>

      {/* Status API Section */}
      <div className="border-t pt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-500 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Status API</h3>
            <p className="text-sm text-muted-foreground">HTTP endpoints for frontend communication</p>
          </div>
        </div>

        <p className="text-muted-foreground mb-6">
          The relayer exposes a REST API that the frontend polls to track transaction progress
          in real-time. This enables the UI to show users exactly where their bridge operation
          is in the pipeline.
        </p>

        <div className="grid gap-4 mb-6">
          <div className="bg-secondary/30 border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-green-500/20 text-green-500 text-xs font-mono rounded">GET</span>
              <code className="text-sm font-mono">/health</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Health check endpoint. Returns <code className="bg-secondary px-1 rounded">{"{ ok: true, timestamp }"}</code>
            </p>
          </div>

          <div className="bg-secondary/30 border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-green-500/20 text-green-500 text-xs font-mono rounded">GET</span>
              <code className="text-sm font-mono">/status/:txHash</code>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Get the status of a bridge transaction by its source transaction hash.
            </p>
            <div className="text-xs font-mono bg-secondary/50 p-2 rounded">
              Response: {"{ status, destTxHash?, error?, timestamp }"}
            </div>
          </div>

          <div className="bg-secondary/30 border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-green-500/20 text-green-500 text-xs font-mono rounded">GET</span>
              <code className="text-sm font-mono">/retry-queue</code>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              View pending retry operations. Useful for debugging failed transactions.
            </p>
            <div className="text-xs font-mono bg-secondary/50 p-2 rounded">
              Response: {"{ count: number, items: FailedOperation[] }"}
            </div>
          </div>
        </div>

        <CodeBlock code={statusRoutesCode} language="typescript" />
      </div>

      {/* Status Types */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-2">Status Types</h3>
        <p className="text-muted-foreground mb-4">
          Transaction status flows through four states: pending → processing → complete/failed.
          The frontend polls the status endpoint to update the UI in real-time.
        </p>
        <CodeBlock code={statusTypesCode} language="typescript" />
      </div>

      {/* Status Service */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-2">Status Service</h3>
        <p className="text-muted-foreground mb-4">
          In-memory store that tracks transaction status. Automatically cleans up entries older
          than 1 hour to prevent memory leaks.
        </p>
        <CodeBlock code={statusServiceCode} language="typescript" />
      </div>

      {/* Retry Service */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-2">Retry Service</h3>
        <p className="text-muted-foreground mb-4">
          Failed operations are queued for automatic retry with exponential backoff.
          The relayer attempts up to 5 retries at 30-second intervals before marking
          the transaction as permanently failed.
        </p>
        <CodeBlock code={retryServiceCode} language="typescript" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-xl p-6">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 text-yellow-500 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h4 className="font-semibold mb-2">Automatic Retries</h4>
          <p className="text-sm text-muted-foreground">
            Failed transactions are queued and retried automatically. Operations move to the back
            of the queue after each attempt, ensuring fair processing.
          </p>
        </div>
        <div className="bg-card border rounded-xl p-6">
          <div className="w-10 h-10 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="font-semibold mb-2">Timeout Handling</h4>
          <p className="text-sm text-muted-foreground">
            Testnet RPCs can be slow. The relayer uses 90-second timeouts per transaction attempt,
            with up to 3 confirmation retries before moving to the retry queue.
          </p>
        </div>
      </div>
    </div>
  );
}

function FrontendSection() {
  const frontendHookCode = `// useBridgeToBase.ts - Bridge hook with state machine
type BridgeState = {
  showProgress: boolean;
  amount: string;
  step: TransactionStep;
  txHash?: string;
  destTxHash?: string;
};

type TransactionStep =
  | "idle"
  | "awaiting-signature"
  | "confirming"
  | "awaiting-relayer"
  | "relayer-processing"
  | "complete"
  | "error";

function bridgeReducer(state: BridgeState, action: BridgeAction): BridgeState {
  switch (action.type) {
    case "START_BRIDGE":
      return { ...state, showProgress: true, step: "awaiting-signature" };
    case "TX_SUBMITTED":
      return { ...state, step: "confirming", txHash: action.txHash };
    case "TX_CONFIRMED":
      return { ...state, step: "awaiting-relayer" };
    case "RELAYER_PROCESSING":
      return { ...state, step: "relayer-processing" };
    case "COMPLETE":
      return { ...state, step: "complete", destTxHash: action.destTxHash };
    case "ERROR":
      return { ...state, step: "error", error: action.error };
  }
}`;

  const frontendContractCode = `// Using wagmi to interact with contracts
const handleBridge = useCallback(() => {
  writeContract({
    address: CONTRACTS.bridgeSource.address,
    abi: BRIDGE_SOURCE_ABI,
    functionName: "lockEth",
    args: [address, BigInt(baseSepolia.id)],
    value: parseEther(amount),
    chainId: sepolia.id,
  });
}, [address, amount, writeContract]);`;

  const relayerStatusCode = `// useRelayerStatus.ts - Poll relayer for tx status
export function useRelayerStatus({ txHash, enabled }: Props) {
  return useQuery({
    queryKey: ["relayer-status", txHash],
    queryFn: async () => {
      const res = await fetch(\`http://localhost:3001/status/\${txHash}\`);
      return res.json() as Promise<TxStatus>;
    },
    enabled: enabled && !!txHash,
    refetchInterval: 2000, // Poll every 2 seconds
  });
}

// In the bridge hook:
const { status } = useRelayerStatus({
  txHash: hash,
  enabled: step === "awaiting-relayer" || step === "relayer-processing",
});

useEffect(() => {
  if (status?.status === "complete") {
    dispatch({ type: "COMPLETE", destTxHash: status.destTxHash });
  }
}, [status]);`;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-6">
        <span className="text-4xl font-bold text-primary/20">03</span>
        <div>
          <h2 className="text-2xl font-bold">Frontend Application</h2>
          <p className="text-muted-foreground">The user interface built with Next.js and wagmi</p>
        </div>
      </div>

      <p className="text-muted-foreground leading-relaxed">
        The frontend provides a seamless bridging experience with wallet connection,
        chain switching, real-time transaction tracking, and a responsive UI. Built with
        Next.js 16, React 19, wagmi for wallet/contract interactions, and Tailwind CSS for styling.
      </p>

      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-2">State Machine for Transaction Flow</h3>
        <p className="text-muted-foreground mb-4">
          Uses a reducer pattern to manage complex transaction states: awaiting signature,
          confirming on-chain, waiting for relayer, and completion. This provides predictable
          state transitions and clear UI feedback at each step.
        </p>
        <CodeBlock code={frontendHookCode} language="typescript" />
      </div>

      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-2">Contract Interaction with wagmi</h3>
        <p className="text-muted-foreground mb-4">
          Uses wagmi hooks like <code className="bg-secondary px-1.5 py-0.5 rounded text-sm">useWriteContract</code> and{" "}
          <code className="bg-secondary px-1.5 py-0.5 rounded text-sm">useWaitForTransactionReceipt</code> for
          type-safe contract calls with automatic error handling and loading states.
        </p>
        <CodeBlock code={frontendContractCode} language="typescript" />
      </div>

      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-2">Relayer Status Polling</h3>
        <p className="text-muted-foreground mb-4">
          After the source transaction is confirmed, the frontend polls the relayer&apos;s status
          API every 2 seconds until the cross-chain operation completes. This provides real-time
          progress updates to the user.
        </p>
        <CodeBlock code={relayerStatusCode} language="typescript" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border rounded-xl p-6">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-500 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="font-semibold mb-2">Balance Display</h4>
          <p className="text-sm text-muted-foreground">
            Real-time balance fetching with auto-refresh after bridge operations complete.
          </p>
        </div>
        <div className="bg-card border rounded-xl p-6">
          <div className="w-10 h-10 rounded-lg bg-pink-500/20 text-pink-500 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h4 className="font-semibold mb-2">Progress Tracking</h4>
          <p className="text-sm text-muted-foreground">
            Visual step-by-step progress with links to block explorers for each transaction.
          </p>
        </div>
        <div className="bg-card border rounded-xl p-6">
          <div className="w-10 h-10 rounded-lg bg-teal-500/20 text-teal-500 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h4 className="font-semibold mb-2">Chain Switching</h4>
          <p className="text-sm text-muted-foreground">
            Automatic prompts to switch networks when needed for the selected bridge direction.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DocsPage() {
  const [selectedSection, setSelectedSection] = useState<SectionId>("smart-contracts");

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <span className="font-semibold text-lg">EVM Bridge</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-4">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Bridge
              </Link>
              <Link href="/docs" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Documentation
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Technical Documentation
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            How the EVM Bridge Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A deep dive into the architecture powering cross-chain ETH transfers
            between Sepolia and Base Sepolia testnets.
          </p>
        </div>

        {/* Architecture Section - Always visible at top */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-4xl font-bold text-primary/20">00</span>
            <div>
              <h2 className="text-2xl font-bold">Architecture Overview</h2>
              <p className="text-muted-foreground">The three pillars of a cross-chain bridge</p>
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed mb-8">
            The EVM Bridge uses a <strong>lock-mint / burn-unlock</strong> pattern to transfer
            value between chains. When you bridge ETH from Sepolia to Base, your ETH is locked
            in a smart contract and an equivalent amount of wrapped tokens (wSepETH) are minted
            on the destination chain. The reverse process burns the wrapped tokens and unlocks
            the original ETH.
          </p>

          <ArchitectureFlow />
        </div>

        {/* Section Selector */}
        <div className="max-w-5xl mx-auto mb-8">
          <h3 className="text-lg font-semibold mb-4">Explore the Components</h3>
          <SectionSelector selected={selectedSection} onSelect={setSelectedSection} />
        </div>

        {/* Dynamic Section Content */}
        <div className="max-w-5xl mx-auto mb-20">
          {selectedSection === "smart-contracts" && <SmartContractsSection />}
          {selectedSection === "relayer" && <RelayerSection />}
          {selectedSection === "frontend" && <FrontendSection />}
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border rounded-2xl p-12">
            <h2 className="text-2xl font-bold mb-4">Ready to try it out?</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Connect your wallet and bridge some testnet ETH between Sepolia and Base Sepolia.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Open Bridge
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>EVM Bridge Documentation - Testnet Bridge between Sepolia and Base Sepolia</p>
        </div>
      </footer>
    </main>
  );
}
