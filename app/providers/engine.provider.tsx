import { createContext, useContext, useRef, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { TranscriptionService } from "../services/transcription.service";
import { conversationService } from "../services/conversation.service";
import { completionService } from "../services/completion.service";
import { WakeLockService } from "../services/wake-lock.service";
import { FullscreenService } from "../services/fullscreen.service";
import { cleanString } from "../logic/cleanString.logic";
import type { Language } from "../consts/i18n.const";

type EngineState = "listening" | "thinking" | "talking" | "waiting";

interface EngineContextValue {
  state: EngineState;
  lastAnswer: string;
  connect: (language: Language) => Promise<void>;
  exitToHomePage: () => Promise<void>;
  clearConversation: () => void;
}

const EngineContext = createContext<EngineContextValue | undefined>(undefined);

interface EngineProviderProps {
  children: ReactNode;
}

export function EngineProvider({ children }: EngineProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  const transcriptionServiceRef = useRef<TranscriptionService>(
    new TranscriptionService(),
  );
  const wakeLockServiceRef = useRef<WakeLockService>(new WakeLockService());
  const fullscreenServiceRef = useRef<FullscreenService>(
    new FullscreenService(),
  );
  const waitingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<EngineState>("talking");
  const [lastAnswer, setLastAnswer] = useState("");

  function clearWaitingTimeout() {
    if (waitingTimeoutRef.current) {
      clearTimeout(waitingTimeoutRef.current);
      waitingTimeoutRef.current = null;
    }
  }

  function startWaiting() {
    clearWaitingTimeout();
    setState("waiting");
    setLastAnswer("");
  }

  function startListening() {
    clearWaitingTimeout();
    setState("listening");
  }

  async function startThinking() {
    clearWaitingTimeout();
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
      } else {
        startWaiting();
      }
    } catch (error) {
      // If request was aborted, do nothing (new request will handle it)
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      // For other errors, clear thinking state
      console.error("Thinking error:", error);
      startWaiting();
    }
  }

  function startTalking(message: string) {
    clearWaitingTimeout();
    setState("talking");
    const cleanedMessage = cleanString(message);
    setLastAnswer(cleanedMessage);
    console.log("Buddy:", cleanedMessage);
    conversationService.addMessage({
      text: cleanedMessage,
      role: "assistant",
    });
    // Start 10 second timeout to enter waiting state
    waitingTimeoutRef.current = setTimeout(() => {
      startWaiting();
    }, 10000);
  }

  async function connectTranscriptionService(language: Language) {
    await transcriptionServiceRef.current.connect(language);
  }

  async function openChatPage() {
    await wakeLockServiceRef.current.request();
    await fullscreenServiceRef.current.request();
    navigate("/chat");
  }

  async function exitToHomePage() {
    // Only exit if we're currently on the chat page
    if (location.pathname !== "/chat") {
      return;
    }
    startWaiting();
    await transcriptionServiceRef.current.disconnect();
    await wakeLockServiceRef.current.release();
    await fullscreenServiceRef.current.exit();
    navigate("/");
  }

  async function connect(language: Language) {
    await connectTranscriptionService(language);
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
      exitToHomePage();
    });
    return unsubscribe;
  }, []);

  // Navigate to home/chat based on transcription connection
  useEffect(() => {
    const unsubscribe = transcriptionServiceRef.current.onConnectionChange(
      (connected) => {
        if (connected) {
          openChatPage();
        } else {
          exitToHomePage();
        }
      },
    );
    return unsubscribe;
  }, [navigate]);

  const value: EngineContextValue = {
    state,
    lastAnswer,
    connect,
    exitToHomePage,
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
