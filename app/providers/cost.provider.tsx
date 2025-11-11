import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { completionService } from "../services/completion.service";
import { transcriptionService } from "../services/transcription.service";
import { spontaneousThinkingDelayService } from "../services/spontaneous-thinking-delay.service";

const COSTS_KEY = "buddy:costs";

export interface TokenCounts {
  completionInput: number;
  completionOutput: number;
  transcriptionInput: number;
  transcriptionOutput: number;
  delayInput: number;
  delayOutput: number;
}

const CostContext = createContext<TokenCounts | undefined>(undefined);

const defaultTokenCounts: TokenCounts = {
  completionInput: 0,
  completionOutput: 0,
  transcriptionInput: 0,
  transcriptionOutput: 0,
  delayInput: 0,
  delayOutput: 0,
};

function loadCosts(): TokenCounts {
  try {
    const stored = localStorage.getItem(COSTS_KEY);
    if (!stored) {
      return defaultTokenCounts;
    }
    return JSON.parse(stored) as TokenCounts;
  } catch (error) {
    console.error("Failed to load costs from localStorage:", error);
    return defaultTokenCounts;
  }
}

function saveCosts(costs: TokenCounts): void {
  try {
    localStorage.setItem(COSTS_KEY, JSON.stringify(costs));
  } catch (error) {
    console.error("Failed to save costs to localStorage:", error);
  }
}

export function CostProvider({ children }: { children: ReactNode }) {
  const [tokenCounts, setTokenCounts] = useState<TokenCounts>(loadCosts);

  // Save to localStorage whenever token counts change
  useEffect(() => {
    saveCosts(tokenCounts);
  }, [tokenCounts]);

  // Track completion token usage
  useEffect(() => {
    const unsubscribe = completionService.onTokenUsage((usage) => {
      setTokenCounts((prev) => ({
        ...prev,
        completionInput: prev.completionInput + usage.inputTokens,
        completionOutput: prev.completionOutput + usage.outputTokens,
      }));
    });
    return unsubscribe;
  }, []);

  // Track transcription token usage
  useEffect(() => {
    const unsubscribe = transcriptionService.onTokenUsage((usage) => {
      setTokenCounts((prev) => ({
        ...prev,
        transcriptionInput: prev.transcriptionInput + usage.inputTokens,
        transcriptionOutput: prev.transcriptionOutput + usage.outputTokens,
      }));
    });
    return unsubscribe;
  }, []);

  // Track spontaneous thinking delay token usage
  useEffect(() => {
    const unsubscribe = spontaneousThinkingDelayService.onTokenUsage(
      (usage) => {
        setTokenCounts((prev) => ({
          ...prev,
          delayInput: prev.delayInput + usage.inputTokens,
          delayOutput: prev.delayOutput + usage.outputTokens,
        }));
      },
    );
    return unsubscribe;
  }, []);

  return (
    <CostContext.Provider value={tokenCounts}>{children}</CostContext.Provider>
  );
}

export function useCost() {
  const context = useContext(CostContext);
  if (!context) {
    throw new Error("useCost must be used within a CostProvider");
  }
  return context;
}
