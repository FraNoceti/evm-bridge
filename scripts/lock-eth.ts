import { createWalletClient, createPublicClient, http, formatEther, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia, baseSepolia } from "viem/chains";
import { readFileSync } from "fs";
import "dotenv/config";

const USER_PRIVATE_KEY = process.env.USER_PRIVATE_KEY as `0x${string}`;
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL!;

if (!USER_PRIVATE_KEY) {
  console.error("Error: USER_PRIVATE_KEY not set in .env");
  process.exit(1);
}

// Load deployment info and ABI
const deployment = JSON.parse(readFileSync("deployment.json", "utf-8"));
const bridgeSourceAbi = JSON.parse(
  readFileSync("../out/BridgeSource.sol/BridgeSource.json", "utf-8")
).abi;

async function main() {
  const amount = process.argv[2] || "0.001";
  const bridgeAmount = parseEther(amount);

  const userAccount = privateKeyToAccount(USER_PRIVATE_KEY);

  const sepoliaPublic = createPublicClient({
    chain: sepolia,
    transport: http(SEPOLIA_RPC),
  });
  const sepoliaWallet = createWalletClient({
    account: userAccount,
    chain: sepolia,
    transport: http(SEPOLIA_RPC),
  });

  console.log(`Locking ${amount} ETH on Sepolia...`);
  console.log(`From: ${userAccount.address}`);
  console.log(`To: Base Sepolia (chain ${baseSepolia.id})`);

  const txHash = await sepoliaWallet.writeContract({
    address: deployment.sepolia.bridgeSource as `0x${string}`,
    abi: bridgeSourceAbi,
    functionName: "lockEth",
    args: [userAccount.address, BigInt(baseSepolia.id)],
    value: bridgeAmount,
  });

  console.log(`\nTX: https://sepolia.etherscan.io/tx/${txHash}`);

  const receipt = await sepoliaPublic.waitForTransactionReceipt({ hash: txHash });
  console.log(`Status: ${receipt.status === "success" ? "SUCCESS" : "FAILED"}`);
  console.log(`\nThe relayer will pick this up and mint wSepETH on Base Sepolia.`);
}

main().catch(console.error);
