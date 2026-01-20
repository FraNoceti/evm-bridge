import { ConnectWallet } from "@/components/connect-wallet";
import { Bridge } from "@/components/bridge";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
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
              <Link href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Bridge
              </Link>
              <Link href="/docs" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Documentation
              </Link>
            </nav>
          </div>
          <ConnectWallet />
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Bridge Between Chains
          </h1>
          <p className="text-muted-foreground text-lg">
            Transfer ETH from Sepolia to Base Sepolia and back.
            Lock your ETH, receive wrapped tokens, and unlock anytime.
          </p>
        </div>

        <div className="flex justify-center">
          <Bridge />
        </div>

        <div className="max-w-2xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border bg-card">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Lock & Mint</h3>
            <p className="text-sm text-muted-foreground">
              Lock ETH on Sepolia and receive wSepETH on Base Sepolia
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Relayer Service</h3>
            <p className="text-sm text-muted-foreground">
              Automated relayer monitors events and processes transfers
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Burn & Unlock</h3>
            <p className="text-sm text-muted-foreground">
              Burn wSepETH on Base to unlock your original ETH on Sepolia
            </p>
          </div>
        </div>

        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>Testnet Bridge - Sepolia ↔ Base Sepolia</p>
          <div className="mt-2 flex justify-center gap-4">
            <a
              href="https://sepolia.etherscan.io/address/0x05b315e576cbd50a5d3f4313a00ba31be20e495d"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary"
            >
              BridgeSource
            </a>
            <a
              href="https://sepolia.basescan.org/address/0xe0af9d805d6cd555bd1e24627e6358ff45be9986"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary"
            >
              BridgeDestination
            </a>
            <a
              href="https://sepolia.basescan.org/address/0xd70ca8b2bb138ced7cc886d123dfb6ac559d2ab0"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary"
            >
              wSepETH Token
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
