"use client";

import { useReadContract, useWriteContract, useWatchContractEvent } from "wagmi";
import { DEAL_OR_NO_DEAL_ABI } from "../lib/contracts";
import { CONTRACT_ADDRESS } from "../lib/constants";
import { type GameState, GamePhase } from "../types/game";

const contractConfig = {
  address: CONTRACT_ADDRESS,
  abi: DEAL_OR_NO_DEAL_ABI,
} as const;

export function useGameState(gameId: bigint | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    ...contractConfig,
    functionName: "getGameState",
    args: gameId !== undefined ? [gameId] : undefined,
    query: {
      enabled: gameId !== undefined,
      refetchInterval: 2000,
    },
  });

  const gameState: GameState | null = data
    ? {
        banker: data[0] as string,
        player: data[1] as string,
        phase: Number(data[2]) as GamePhase,
        playerCaseIndex: Number(data[3]),
        currentRound: Number(data[4]),
        casesOpenedThisRound: Number(data[5]),
        openedBitmap: data[6] as bigint,
        bankerOffer: data[7] as bigint,
        finalPayout: data[8] as bigint,
      }
    : null;

  return { gameState, isLoading, refetch };
}

export function useNextGameId() {
  const { data, refetch } = useReadContract({
    ...contractConfig,
    functionName: "nextGameId",
    query: { refetchInterval: 3000 },
  });
  return { nextGameId: data as bigint | undefined, refetch };
}

export function useUsdToWei(usdCents: bigint) {
  const { data } = useReadContract({
    ...contractConfig,
    functionName: "usdToWei",
    args: [usdCents],
  });
  return data as bigint | undefined;
}

export function useEthUsdPrice() {
  const { data } = useReadContract({
    ...contractConfig,
    functionName: "getEthUsdPrice",
    query: { refetchInterval: 10000 },
  });
  return data as bigint | undefined;
}

export function useRemainingValues(gameId: bigint | undefined) {
  const { data, refetch } = useReadContract({
    ...contractConfig,
    functionName: "getRemainingValues",
    args: gameId !== undefined ? [gameId] : undefined,
    query: {
      enabled: gameId !== undefined,
      refetchInterval: 2000,
    },
  });
  return { remainingValues: data as bigint[] | undefined, refetch };
}

export function useCaseValue(gameId: bigint | undefined, caseIndex: number, enabled: boolean) {
  const { data } = useReadContract({
    ...contractConfig,
    functionName: "getCaseValue",
    args: gameId !== undefined ? [gameId, caseIndex] : undefined,
    query: { enabled: enabled && gameId !== undefined },
  });
  return data as bigint | undefined;
}

export function useGameWrite() {
  const { writeContractAsync, isPending } = useWriteContract();

  const createGame = async (value: bigint) => {
    return writeContractAsync({
      ...contractConfig,
      functionName: "createGame",
      value,
    });
  };

  const joinGame = async (gameId: bigint, commitHash: bigint, value: bigint) => {
    return writeContractAsync({
      ...contractConfig,
      functionName: "joinGame",
      args: [gameId, commitHash],
      value,
    });
  };

  const revealCase = async (gameId: bigint, caseIndex: number, salt: bigint) => {
    return writeContractAsync({
      ...contractConfig,
      functionName: "revealCase",
      args: [gameId, caseIndex, salt],
    });
  };

  const openCase = async (gameId: bigint, caseIndex: number) => {
    return writeContractAsync({
      ...contractConfig,
      functionName: "openCase",
      args: [gameId, caseIndex],
    });
  };

  const acceptDeal = async (gameId: bigint) => {
    return writeContractAsync({
      ...contractConfig,
      functionName: "acceptDeal",
      args: [gameId],
    });
  };

  const rejectDeal = async (gameId: bigint) => {
    return writeContractAsync({
      ...contractConfig,
      functionName: "rejectDeal",
      args: [gameId],
    });
  };

  const finalDecision = async (gameId: bigint, swap: boolean) => {
    return writeContractAsync({
      ...contractConfig,
      functionName: "finalDecision",
      args: [gameId, swap],
    });
  };

  return {
    createGame,
    joinGame,
    revealCase,
    openCase,
    acceptDeal,
    rejectDeal,
    finalDecision,
    isPending,
  };
}
