import { createContext, useContext, useRef } from "react";
import type { ReactNode } from "react";
import { EngineService } from "../services/engine.service";

interface EngineContextValue {
  engine: EngineService;
}

const EngineContext = createContext<EngineContextValue | undefined>(undefined);

interface EngineProviderProps {
  children: ReactNode;
}

export function EngineProvider({ children }: EngineProviderProps) {
  const engineRef = useRef<EngineService>(new EngineService());

  const value: EngineContextValue = {
    engine: engineRef.current,
  };

  return (
    <EngineContext.Provider value={value}>{children}</EngineContext.Provider>
  );
}

export function useEngine(): EngineContextValue {
  const context = useContext(EngineContext);
  if (context === undefined) {
    throw new Error("useEngine must be used within an EngineProvider");
  }
  return context;
}
