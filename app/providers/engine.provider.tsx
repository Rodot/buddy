import { createContext, useContext, useRef, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { TranscriptionService } from "../services/transcription.service";
import { conversationService } from "../services/conversation.service";
import { completionService } from "../services/completion.service";
import { settingsService } from "../services/settings.service";
import { WakeLockService } from "../services/wake-lock.service";
import { FullscreenService } from "../services/fullscreen.service";

type EngineState = "listening" | "thinking" | "talking";

interface EngineContextValue {
  state: EngineState;
  lastAnswer: string;
  connect: (language: "en" | "fr") => Promise<void>;
  disconnect: () => Promise<void>;
  clearConversation: () => void;
}

const EngineContext = createContext<EngineContextValue | undefined>(undefined);

interface EngineProviderProps {
  children: ReactNode;
}

export function EngineProvider({ children }: EngineProviderProps) {
  const navigate = useNavigate();
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
    console.log("[listening]");
    setState("listening");
    // Cancel any ongoing completion when user starts speaking
    completionService.abort();
  }

  async function startThinking() {
    console.log("[thinking]");
    setState("thinking");
    const conversation = conversationService.get();
    const settings = settingsService.get();
    try {
      const completionText = await completionService.request(
        conversation,
        settings.language,
      );
      if (completionText) {
        startTalking(completionText);
      }
    } catch (error) {
      // If request was aborted, do nothing (new request will handle it)
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Thinking aborted");
        return;
      }
      // For other errors, clear thinking state
      console.error("Thinking error:", error);
      startTalking();
    }
  }

  function startTalking(message?: string) {
    console.log("[talking]", message);
    const newMessage = message ?? "...";
    setState("talking");
    setLastAnswer(newMessage);
    if (!message) return;
    conversationService.addMessage({
      text: message,
      role: "assistant",
    });
  }

  async function connect(language: "en" | "fr") {
    settingsService.setLanguage(language);
    await wakeLockServiceRef.current.request();
    await fullscreenServiceRef.current.request();
    await transcriptionServiceRef.current.connect(language);
  }

  async function disconnect() {
    await transcriptionServiceRef.current.disconnect();
    await wakeLockServiceRef.current.release();
    await fullscreenServiceRef.current.exit();
    startTalking();
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
        conversationService.addMessage({
          text: transcript,
          role: "user",
        });
        console.log("User:", transcript);

        // Start completion
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
  }, [disconnect]);

  // Navigate to home/chat based on transcripttion connection
  useEffect(() => {
    const unsubscribe = transcriptionServiceRef.current.onConnectionChange(
      (connected) => {
        if (connected) {
          navigate("/chat");
        } else {
          navigate("/");
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
