import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { TranscriptionService } from "../services/transcription.service";
import { conversationService } from "../services/conversation.service";
import { completionService } from "../services/completion.service";
import { settingsService } from "../services/settings.service";

type EngineState = "sleeping" | "listening" | "thinking" | "talking";

interface EngineContextValue {
  state: EngineState;
  lastAnswer: string;
  transcriptionService: TranscriptionService;
  connect: (language: "en" | "fr") => Promise<void>;
  disconnect: () => Promise<void>;
}

const EngineContext = createContext<EngineContextValue | undefined>(undefined);

interface EngineProviderProps {
  children: ReactNode;
}

export function EngineProvider({ children }: EngineProviderProps) {
  const transcriptionServiceRef = useRef<TranscriptionService>(
    new TranscriptionService(),
  );
  const [state, setState] = useState<EngineState>("sleeping");
  const [lastAnswer, setLastAnswer] = useState("");
  const talkingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionInProgressRef = useRef(false);

  const clearTalkingTimeout = useCallback(() => {
    if (talkingTimeoutRef.current) {
      clearTimeout(talkingTimeoutRef.current);
      talkingTimeoutRef.current = null;
    }
  }, []);

  const startCompletion = useCallback(async () => {
    if (completionInProgressRef.current) {
      return;
    }

    setState("thinking");
    completionInProgressRef.current = true;

    try {
      const conversation = conversationService.get();
      const settings = settingsService.get();
      const completionText = await completionService.request(
        conversation,
        settings.language,
      );

      // Check if we're still in thinking state (not interrupted)
      if (completionInProgressRef.current && completionText) {
        console.log("Assistant:", completionText);
        conversationService.addMessage({
          text: completionText,
          role: "assistant",
        });

        // Transition to talking state
        setState("talking");
        setLastAnswer(completionText);

        // Set timeout to go back to sleeping after 10 seconds
        clearTalkingTimeout();
        talkingTimeoutRef.current = setTimeout(() => {
          setState("sleeping");
          setLastAnswer("");
        }, 10000);
      }
    } catch (error) {
      console.error("Completion error:", error);
      // On error, go back to sleeping
      setState("sleeping");
    } finally {
      completionInProgressRef.current = false;
    }
  }, [clearTalkingTimeout]);

  const connect = useCallback(async (language: "en" | "fr") => {
    settingsService.setLanguage(language);
    await transcriptionServiceRef.current.connect(language);
  }, []);

  const disconnect = useCallback(async () => {
    await transcriptionServiceRef.current.disconnect();
    clearTalkingTimeout();
    completionInProgressRef.current = false;
    setState("sleeping");
    setLastAnswer("");
  }, [clearTalkingTimeout]);

  // Handle VAD changes
  useEffect(() => {
    const unsubscribe = transcriptionServiceRef.current.onVadChange(
      (isActive) => {
        if (isActive) {
          // Voice detected
          // From any state → listening
          clearTalkingTimeout();

          // Cancel ongoing completion if thinking
          if (state === "thinking" && completionInProgressRef.current) {
            completionInProgressRef.current = false;
            // The completion service will handle abort via its internal controller
          }

          setState("listening");
        } else {
          // Voice stopped
          // From listening → sleeping (no transcription yet)
          if (state === "listening") {
            setState("sleeping");
          }
        }
      },
    );

    return unsubscribe;
  }, [state, clearTalkingTimeout]);

  // Handle transcription completion
  useEffect(() => {
    const unsubscribe = transcriptionServiceRef.current.onTranscription(
      (transcript) => {
        conversationService.addMessage({
          text: transcript,
          role: "user",
        });
        console.log("User:", transcript);

        // Start completion
        startCompletion();
      },
    );

    return unsubscribe;
  }, [startCompletion]);

  const value: EngineContextValue = {
    state,
    lastAnswer,
    transcriptionService: transcriptionServiceRef.current,
    connect,
    disconnect,
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
