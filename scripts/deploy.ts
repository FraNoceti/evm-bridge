import { createWalletClient, createPublicClient, http, formatEther, zeroAddress, isAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia, baseSepolia } from "viem/chains";
import { readFileSync, writeFileSync } from "fs";
import "dotenv/config";

const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY as `0x${string}`;
const RELAYER_ADDRESS = process.env.RELAYER_ADDRESS as `0x${string}`;
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL!;
const BASE_SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC_URL!;

if (!ADMIN_PRIVATE_KEY) {
  console.error("Error: ADMIN_PRIVATE_KEY not set in .env");
  process.exit(1);
}
if (!RELAYER_ADDRESS || !isAddress(RELAYER_ADDRESS)) {
  console.error("Error: RELAYER_ADDRESS not set or invalid in .env");
  process.exit(1);
}

// Load compiled contract artifacts
const bridgeSourceArtifact = JSON.parse(
  readFileSync("../out/BridgeSource.sol/BridgeSource.json", "utf-8")
);
const bridgeDestArtifact = JSON.parse(
  readFileSync("../out/BridgeDestination.sol/BridgeDestination.json", "utf-8")
);
const wrappedTokenArtifact = JSON.parse(
  readFileSync("../out/WrappedToken.sol/WrappedToken.json", "utf-8")
);

async function main() {
  console.log("=".repeat(60));
  console.log("  EVM Bridge Deployment: Sepolia <-> Base Sepolia");
  console.log("=".repeat(60));

  const adminAccount = privateKeyToAccount(ADMIN_PRIVATE_KEY);
  console.log(`\nAdmin (deployer): ${adminAccount.address}`);
  console.log(`Relayer:          ${RELAYER_ADDRESS}`);

  // Setup clients for both chains
  const sepoliaPublic = createPublicClient({
    chain: sepolia,
    transport: http(SEPOLIA_RPC),
  });
  const sepoliaWallet = createWalletClient({
    account: adminAccount,
    chain: sepolia,
    transport: http(SEPOLIA_RPC),
  });

  const baseSepoliaPublic = createPublicClient({
    chain: baseSepolia,
    transport: http(BASE_SEPOLIA_RPC),
  });
  const baseSepoliaWallet = createWalletClient({
    account: adminAccount,
    chain: baseSepolia,
    transport: http(BASE_SEPOLIA_RPC),
  });

  // Check balances
  const sepoliaBalance = await sepoliaPublic.getBalance({ address: adminAccount.address });
  const baseBalance = await baseSepoliaPublic.getBalance({ address: adminAccount.address });
  console.log(`Sepolia balance: ${formatEther(sepoliaBalance)} ETH`);
  console.log(`Base Sepolia balance: ${formatEther(baseBalance)} ETH\n`);

  // ============================================
  // STEP 1: Deploy BridgeSource on Sepolia
  // ============================================
  console.log("-".repeat(60));
  console.log("STEP 1: Deploying BridgeSource on Sepolia...");
  console.log("-".repeat(60));

  const bridgeSourceHash = await sepoliaWallet.deployContract({
    abi: bridgeSourceArtifact.abi,
    bytecode: bridgeSourceArtifact.bytecode.object as `0x${string}`,
    args: [RELAYER_ADDRESS], // separate relayer account
  });
  console.log(`TX sent: ${bridgeSourceHash}`);

  const bridgeSourceReceipt = await sepoliaPublic.waitForTransactionReceipt({
    hash: bridgeSourceHash,
  });
  const bridgeSourceAddress = bridgeSourceReceipt.contractAddress!;
  console.log(`BridgeSource deployed: ${bridgeSourceAddress}`);
  console.log(`View on Etherscan: https://sepolia.etherscan.io/address/${bridgeSourceAddress}\n`);

  // ============================================
  // STEP 2: Deploy BridgeDestination on Base Sepolia
  // ============================================
  console.log("-".repeat(60));
  console.log("STEP 2: Deploying BridgeDestination on Base Sepolia...");
  console.log("-".repeat(60));

  const bridgeDestHash = await baseSepoliaWallet.deployContract({
    abi: bridgeDestArtifact.abi,
    bytecode: bridgeDestArtifact.bytecode.object as `0x${string}`,
    args: [RELAYER_ADDRESS], // separate relayer account
  });
  console.log(`TX sent: ${bridgeDestHash}`);

  const bridgeDestReceipt = await baseSepoliaPublic.waitForTransactionReceipt({
    hash: bridgeDestHash,
  });
  const bridgeDestAddress = bridgeDestReceipt.contractAddress!;
  console.log(`BridgeDestination deployed: ${bridgeDestAddress}`);
  console.log(`View on BaseScan: https://sepolia.basescan.org/address/${bridgeDestAddress}\n`);

  // ============================================
  // STEP 3: Deploy WrappedToken (wSepETH) on Base Sepolia
  // ============================================
  console.log("-".repeat(60));
  console.log("STEP 3: Deploying WrappedToken (wSepETH) on Base Sepolia...");
  console.log("-".repeat(60));

  const wrappedTokenHash = await baseSepoliaWallet.deployContract({
    abi: wrappedTokenArtifact.abi,
    bytecode: wrappedTokenArtifact.bytecode.object as `0x${string}`,
    args: [
      "Wrapped Sepolia ETH",           // name
      "wSepETH",                        // symbol
      18,                               // decimals
      zeroAddress,                      // sourceToken (0x0 = native ETH)
      BigInt(sepolia.id),               // sourceChainId
      bridgeDestAddress,                // bridge contract
    ],
  });
  console.log(`TX sent: ${wrappedTokenHash}`);

  const wrappedTokenReceipt = await baseSepoliaPublic.waitForTransactionReceipt({
    hash: wrappedTokenHash,
  });
  const wrappedTokenAddress = wrappedTokenReceipt.contractAddress!;
  console.log(`WrappedToken deployed: ${wrappedTokenAddress}`);
  console.log(`View on BaseScan: https://sepolia.basescan.org/address/${wrappedTokenAddress}\n`);

  // ============================================
  // STEP 4: Configure BridgeSource on Sepolia
  // ============================================
  console.log("-".repeat(60));
  console.log("STEP 4: Configuring BridgeSource...");
  console.log("-".repeat(60));

  // Add Base Sepolia as supported chain
  const addChainHash = await sepoliaWallet.writeContract({
    address: bridgeSourceAddress,
    abi: bridgeSourceArtifact.abi,
    functionName: "addSupportedChain",
    args: [BigInt(baseSepolia.id)],
  });
  await sepoliaPublic.waitForTransactionReceipt({ hash: addChainHash });
  console.log(`Added Base Sepolia (${baseSepolia.id}) as supported destination chain`);

  // ============================================
  // STEP 5: Configure BridgeDestination on Base Sepolia
  // ============================================
  console.log("-".repeat(60));
  console.log("STEP 5: Configuring BridgeDestination...");
  console.log("-".repeat(60));

  // Add Sepolia as supported source chain
  const addSourceChainHash = await baseSepoliaWallet.writeContract({
    address: bridgeDestAddress,
    abi: bridgeDestArtifact.abi,
    functionName: "addSupportedChain",
    args: [BigInt(sepolia.id)],
  });
  await baseSepoliaPublic.waitForTransactionReceipt({ hash: addSourceChainHash });
  console.log(`Added Sepolia (${sepolia.id}) as supported source chain`);

  // Set token mapping: native ETH (0x0) -> wSepETH
  const setMappingHash = await baseSepoliaWallet.writeContract({
    address: bridgeDestAddress,
    abi: bridgeDestArtifact.abi,
    functionName: "setTokenMapping",
    args: [
      BigInt(sepolia.id),
      zeroAddress,           // native ETH = address(0)
      wrappedTokenAddress,
    ],
  });
  await baseSepoliaPublic.waitForTransactionReceipt({ hash: setMappingHash });
  console.log(`Set token mapping: Native ETH (0x0) -> ${wrappedTokenAddress}`);

  // ============================================
  // Save deployment info
  // ============================================
  const deployment = {
    timestamp: new Date().toISOString(),
    admin: adminAccount.address,
    relayer: RELAYER_ADDRESS,
    sepolia: {
      chainId: sepolia.id,
      bridgeSource: bridgeSourceAddress,
      explorerUrl: `https://sepolia.etherscan.io/address/${bridgeSourceAddress}`,
    },
    baseSepolia: {
      chainId: baseSepolia.id,
      bridgeDestination: bridgeDestAddress,
      wrappedToken: wrappedTokenAddress,
      explorerUrls: {
        bridge: `https://sepolia.basescan.org/address/${bridgeDestAddress}`,
        token: `https://sepolia.basescan.org/address/${wrappedTokenAddress}`,
      },
    },
  };

  writeFileSync("deployment.json", JSON.stringify(deployment, null, 2));

  console.log("\n" + "=".repeat(60));
  console.log("  DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\nRoles:");
  console.log(`  Admin:   ${adminAccount.address}`);
  console.log(`  Relayer: ${RELAYER_ADDRESS}`);
  console.log("\nContract Addresses:");
  console.log(`  [Sepolia] BridgeSource:      ${bridgeSourceAddress}`);
  console.log(`  [Base Sepolia] BridgeDest:   ${bridgeDestAddress}`);
  console.log(`  [Base Sepolia] wSepETH:      ${wrappedTokenAddress}`);
  console.log("\nDeployment saved to: deployment.json");
  console.log("\nNext steps:");
  console.log("  1. Start the relayer: npx ts-node relayer.ts");
  console.log("  2. Lock ETH as user:  npx ts-node lock-eth.ts 0.001");
}

main().catch(console.error);
