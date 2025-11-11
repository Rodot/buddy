import { createContext, useContext, useRef, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { transcriptionService } from "../services/transcription.service";
import { conversationService } from "../services/conversation.service";
import { completionService } from "../services/completion.service";
import { requestWakeLock, releaseWakeLock } from "../logic/wake-lock.logic";
import { cleanString } from "../logic/cleanString.logic";
import type { Language } from "../consts/i18n.const";
import { areLastThreeMessagesFromAssistant } from "../logic/areLastThreeMessagesFromAssistant.logic";
import type { Personna } from "../types/domain/messageModel.type";

interface LastAnswer {
  text: string;
  personna: Personna;
}

interface EngineContextValue {
  lastAnswer: LastAnswer | null;
  lastTranscription: string | null;
  isListeningActive: boolean;
  isThinkingActive: boolean;
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
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const waitingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spontaneousThinkingTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const transcriptionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [lastAnswer, setLastAnswer] = useState<LastAnswer | null>(null);
  const [lastTranscription, setLastTranscription] = useState<string | null>(
    null,
  );
  const [isListeningActive, setIsListeningActive] = useState(false);
  const [isThinkingActive, setIsThinkingActive] = useState(false);

  function clearTimeouts() {
    if (waitingTimeoutRef.current) {
      clearTimeout(waitingTimeoutRef.current);
      waitingTimeoutRef.current = null;
    }
    if (spontaneousThinkingTimeoutRef.current) {
      clearTimeout(spontaneousThinkingTimeoutRef.current);
      spontaneousThinkingTimeoutRef.current = null;
    }
    if (transcriptionTimeoutRef.current) {
      clearTimeout(transcriptionTimeoutRef.current);
      transcriptionTimeoutRef.current = null;
    }
  }

  function startWaiting() {
    console.log("[start waiting]");
    clearTimeouts();
    setLastAnswer(null);
    setLastTranscription(null);

    const conversation = conversationService.get();
    if (areLastThreeMessagesFromAssistant(conversation)) {
      return;
    }
    if (location.pathname !== "/chat") {
      return;
    }

    const randomDelay =
      Math.floor(Math.random() * (120000 - 30000 + 1)) + 30000;
    spontaneousThinkingTimeoutRef.current = setTimeout(() => {
      conversationService.addMessage({
        text: "{no-answer-from-user}",
        role: "user",
      });
      startThinking();
    }, randomDelay);
  }

  function startListening() {
    console.log("[start listening]");
    clearTimeouts();
  }

  async function startThinking() {
    console.log("[start thinking]");
    clearTimeouts();
    const conversation = conversationService.get();
    const language = i18n.language as Language;
    // 20% chance of bully, 80% chance of buddy
    const personna: Personna = Math.random() < 0.2 ? "bully" : "buddy";
    try {
      const completionText = await completionService.request(
        conversation,
        language,
        personna,
      );
      if (completionText?.trim()) {
        startTalking(completionText, personna);
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

  function startTalking(message: string, personna: Personna) {
    console.log("[start talking]");
    clearTimeouts();
    const cleanedMessage = cleanString(message);
    setLastAnswer({ text: cleanedMessage, personna });
    conversationService.addMessage({
      text: cleanedMessage,
      role: "assistant",
      personna,
    });
    waitingTimeoutRef.current = setTimeout(() => {
      startWaiting();
    }, 10000);
  }

  async function connectTranscriptionService(language: Language) {
    await transcriptionService.connect(language);
  }

  async function openChatPage() {
    const wakeLock = await requestWakeLock();
    if (wakeLock) {
      wakeLock.addEventListener("release", () => {
        wakeLockRef.current = null;
      });
    }
    wakeLockRef.current = wakeLock;
    navigate("/chat");
  }

  async function exitToHomePage() {
    if (location.pathname !== "/chat") {
      return;
    }
    clearTimeouts();
    setLastAnswer(null);
    setLastTranscription(null);
    await transcriptionService.disconnect();
    await releaseWakeLock(wakeLockRef.current);
    wakeLockRef.current = null;
    navigate("/");
  }

  async function connect(language: Language) {
    await connectTranscriptionService(language);
  }

  function clearConversation() {
    conversationService.clear();
  }

  // Voice activity detection event
  useEffect(() => {
    const unsubscribe = transcriptionService.onVadChange((isActive) => {
      if (isActive) {
        startListening();
        setIsListeningActive(true);
      } else {
        setIsListeningActive(false);
      }
    });
    return unsubscribe;
  }, []);

  // Transcription completion event
  useEffect(() => {
    const unsubscribe = transcriptionService.onTranscription((transcript) => {
      const cleanedTranscript = cleanString(transcript);

      // Set last transcription and clear it after 10 seconds
      setLastTranscription(cleanedTranscript);
      if (transcriptionTimeoutRef.current) {
        clearTimeout(transcriptionTimeoutRef.current);
      }
      transcriptionTimeoutRef.current = setTimeout(() => {
        setLastTranscription(null);
      }, 10000);

      conversationService.addMessage({
        text: cleanedTranscript,
        role: "user",
      });
      startThinking();
    });

    return unsubscribe;
  }, [startThinking]);

  // Navigate to home/chat based on transcription connection
  useEffect(() => {
    const unsubscribe = transcriptionService.onConnectionChange((connected) => {
      if (connected) {
        openChatPage();
      } else {
        exitToHomePage();
      }
    });
    return unsubscribe;
  }, [navigate]);

  // Track completion thinking state
  useEffect(() => {
    const unsubscribe = completionService.onThinkingChange((isThinking) => {
      setIsThinkingActive(isThinking);
    });
    return unsubscribe;
  }, []);

  const value: EngineContextValue = {
    lastAnswer,
    lastTranscription,
    isListeningActive: isListeningActive,
    isThinkingActive: isThinkingActive,
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
