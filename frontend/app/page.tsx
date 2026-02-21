"use client";

import { useAccount, useConnect, useDisconnect, useChainId, useBalance } from "wagmi";
import { injected } from "wagmi/connectors";
import { hardhat } from "wagmi/chains";
import { useEffect, useState, useCallback } from "react";
import GameBoard from "../components/game/GameBoard";

const HARDHAT_CHAIN_ID_HEX = "0x7a69"; // 31337

async function addAndSwitchToHardhat() {
  if (typeof window === "undefined" || !window.ethereum) return;

  try {
    // Try switching first
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: HARDHAT_CHAIN_ID_HEX }],
    });
  } catch (switchError: any) {
    // Chain not added — add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: HARDHAT_CHAIN_ID_HEX,
            chainName: "Hardhat Localhost",
            rpcUrls: ["http://127.0.0.1:8545"],
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          },
        ],
      });
    }
  }
}

async function fundAccount(address: string) {
  try {
    // Use hardhat_setBalance to give 100 ETH
    await fetch("http://127.0.0.1:8545", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "hardhat_setBalance",
        params: [address, "0x56BC75E2D63100000"], // 100 ETH in hex wei
        id: 1,
      }),
    });
  } catch {
    // Silently fail if not on hardhat
  }
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { data: balance, refetch: refetchBalance } = useBalance({ address });
  const [funded, setFunded] = useState(false);

  const wrongNetwork = isConnected && chainId !== hardhat.id;

  // Auto-switch to Hardhat when connected on wrong network
  useEffect(() => {
    if (isConnected && chainId !== hardhat.id) {
      addAndSwitchToHardhat();
    }
  }, [isConnected, chainId]);

  // Auto-fund on Hardhat if balance is 0
  useEffect(() => {
    if (isConnected && address && chainId === hardhat.id && !funded) {
      if (balance && balance.value === 0n) {
        fundAccount(address).then(() => {
          setFunded(true);
          setTimeout(() => refetchBalance(), 500);
        });
      }
    }
  }, [isConnected, address, chainId, balance, funded, refetchBalance]);

  const handleConnect = async () => {
    await addAndSwitchToHardhat();
    connect({ connector: injected() });
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-amber-400 font-bold text-xl">Deal or No Deal</h1>
        {isConnected ? (
          <div className="flex items-center gap-3">
            {wrongNetwork && (
              <button
                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors animate-pulse"
                onClick={addAndSwitchToHardhat}
              >
                Switch to Hardhat
              </button>
            )}
            <span className="text-gray-400 text-sm">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <button
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors"
              onClick={() => disconnect()}
              data-testid="disconnect-button"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            onClick={handleConnect}
            data-testid="connect-button"
          >
            Connect Wallet
          </button>
        )}
      </header>

      {/* Wrong network warning */}
      {wrongNetwork && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-6 py-3 text-center cursor-pointer" onClick={addAndSwitchToHardhat}>
          Wrong network detected. Click here or the button above to switch to Hardhat (localhost:8545).
        </div>
      )}

      {/* Game */}
      <GameBoard />
    </main>
  );
}
