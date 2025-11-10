import { createContext, useContext, useRef, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { TranscriptionService } from "../services/transcription.service";
import { conversationService } from "../services/conversation.service";
import { completionService } from "../services/completion.service";
import { WakeLockService } from "../services/wake-lock.service";
import { FullscreenService } from "../services/fullscreen.service";
import { cleanString } from "../logic/cleanString.logic";
import type { Language } from "../consts/i18n.const";

type EngineState = "listening" | "thinking" | "talking";

interface EngineContextValue {
  state: EngineState;
  lastAnswer: string;
  connect: (language: Language) => Promise<void>;
  disconnect: () => Promise<void>;
  clearConversation: () => void;
}

const EngineContext = createContext<EngineContextValue | undefined>(undefined);

interface EngineProviderProps {
  children: ReactNode;
}

export function EngineProvider({ children }: EngineProviderProps) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const transcriptionServiceRef = useRef<TranscriptionService>(
    new TranscriptionService(),
  );
  const wakeLockServiceRef = useRef<WakeLockService>(new WakeLockService());
  const fullscreenServiceRef = useRef<FullscreenService>(
    new FullscreenService(),
  );
  const [state, setState] = useState<EngineState>("talking");
  const [lastAnswer, setLastAnswer] = useState("");

  function startListening() {
    setState("listening");
    // Cancel any ongoing completion when user starts speaking
    completionService.abort();
  }

  async function startThinking() {
    setState("thinking");
    const conversation = conversationService.get();
    const language = i18n.language as Language;
    try {
      const completionText = await completionService.request(
        conversation,
        language,
      );
      if (completionText) {
        startTalking(completionText);
      }
    } catch (error) {
      // If request was aborted, do nothing (new request will handle it)
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      // For other errors, clear thinking state
      console.error("Thinking error:", error);
      startTalking();
    }
  }

  function startTalking(message?: string) {
    setState("talking");
    const cleanedMessage = cleanString(message);
    console.log("Buddy:", cleanedMessage);
    setLastAnswer(cleanedMessage);
    conversationService.addMessage({
      text: cleanedMessage,
      role: "assistant",
    });
  }

  async function connect(language: Language) {
    await transcriptionServiceRef.current.connect(language);
  }

  async function disconnect() {
    startTalking(); // clean message
    await transcriptionServiceRef.current.disconnect();
    await wakeLockServiceRef.current.release();
    await fullscreenServiceRef.current.exit();
    navigate("/");
  }

  function clearConversation() {
    conversationService.clear();
  }

  // Voice activity start
  useEffect(() => {
    const unsubscribe = transcriptionServiceRef.current.onVadChange(
      (isActive) => {
        if (isActive) {
          // Voice detected
          startListening();
        }
        // Voice stopped
        // Do nothing, wait for transcription event
      },
    );

    return unsubscribe;
  }, [state]);

  // Transcription completion
  useEffect(() => {
    const unsubscribe = transcriptionServiceRef.current.onTranscription(
      (transcript) => {
        const cleanedTranscript = cleanString(transcript);
        conversationService.addMessage({
          text: cleanedTranscript,
          role: "user",
        });
        console.log("User:", cleanedTranscript);
        startThinking();
      },
    );

    return unsubscribe;
  }, [startThinking]);

  // User exit fullscreen
  useEffect(() => {
    const unsubscribe = fullscreenServiceRef.current.onExit(() => {
      disconnect();
    });
    return unsubscribe;
  }, []);

  // Navigate to home/chat based on transcripttion connection
  useEffect(() => {
    const unsubscribe = transcriptionServiceRef.current.onConnectionChange(
      (connected) => {
        if (connected) {
          wakeLockServiceRef.current.request();
          fullscreenServiceRef.current.request();
          navigate("/chat");
        } else {
          disconnect();
        }
      },
    );
    return unsubscribe;
  }, [navigate]);

  const value: EngineContextValue = {
    state,
    lastAnswer,
    connect,
    disconnect,
    clearConversation,
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
