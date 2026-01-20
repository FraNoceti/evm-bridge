import "dotenv/config";

export const config = {
  relayerPrivateKey: process.env.RELAYER_PRIVATE_KEY as `0x${string}`,
  sepoliaRpc: process.env.SEPOLIA_RPC_URL!,
  baseSepoliaRpc: process.env.BASE_SEPOLIA_RPC_URL!,
  bridgeSource: (process.env.BRIDGE_SOURCE_ADDRESS ||
    "0x05b315e576cbd50a5d3f4313a00ba31be20e495d") as `0x${string}`,
  bridgeDestination: (process.env.BRIDGE_DESTINATION_ADDRESS ||
    "0xe0af9d805d6cd555bd1e24627e6358ff45be9986") as `0x${string}`,
  port: parseInt(process.env.PORT || process.env.RELAYER_PORT || "3001"),
};

export function validateConfig(): void {
  if (!config.relayerPrivateKey) {
    throw new Error("RELAYER_PRIVATE_KEY not set");
  }
  if (!config.sepoliaRpc || !config.baseSepoliaRpc) {
    throw new Error("RPC URLs not set");
  }
}
