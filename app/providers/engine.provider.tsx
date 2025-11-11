import { createContext, useContext, useRef, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { TranscriptionService } from "../services/transcription.service";
import { conversationService } from "../services/conversation.service";
import { completionService } from "../services/completion.service";
import { WakeLockService } from "../services/wake-lock.service";
import { cleanString } from "../logic/cleanString.logic";
import type { Language } from "../consts/i18n.const";
import { areLastThreeMessagesFromAssistant } from "../logic/areLastThreeMessagesFromAssistant.logic";
import type { Personna } from "../types/domain/messageModel.type";

interface TokenCounts {
  completionInput: number;
  completionOutput: number;
  transcriptionInput: number;
  transcriptionOutput: number;
}

interface LastAnswer {
  text: string;
  personna: Personna;
}

interface EngineContextValue {
  lastAnswer: LastAnswer | null;
  tokenCounts: TokenCounts;
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
  const transcriptionServiceRef = useRef<TranscriptionService>(
    new TranscriptionService(),
  );
  const wakeLockServiceRef = useRef<WakeLockService>(new WakeLockService());
  const waitingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spontaneousThinkingTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [lastAnswer, setLastAnswer] = useState<LastAnswer | null>(null);
  const [tokenCounts, setTokenCounts] = useState<TokenCounts>({
    completionInput: 0,
    completionOutput: 0,
    transcriptionInput: 0,
    transcriptionOutput: 0,
  });
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
  }

  function startWaiting() {
    console.log("[start waiting]");
    clearTimeouts();
    setLastAnswer(null);

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
      if (completionText) {
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
    await transcriptionServiceRef.current.connect(language);
  }

  async function openChatPage() {
    await wakeLockServiceRef.current.request();
    navigate("/chat");
  }

  async function exitToHomePage() {
    if (location.pathname !== "/chat") {
      return;
    }
    startWaiting();
    await transcriptionServiceRef.current.disconnect();
    await wakeLockServiceRef.current.release();
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
    const unsubscribe = transcriptionServiceRef.current.onVadChange(
      (isActive) => {
        if (isActive) {
          startListening();
          setIsListeningActive(true);
        } else {
          setIsListeningActive(false);
        }
      },
    );
    return unsubscribe;
  }, []);

  // Transcription completion event
  useEffect(() => {
    const unsubscribe = transcriptionServiceRef.current.onTranscription(
      (transcript) => {
        const cleanedTranscript = cleanString(transcript);
        conversationService.addMessage({
          text: cleanedTranscript,
          role: "user",
        });
        startThinking();
      },
    );

    return unsubscribe;
  }, [startThinking]);

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

  // Track completion thinking state
  useEffect(() => {
    const unsubscribe = completionService.onThinkingChange((isThinking) => {
      setIsThinkingActive(isThinking);
    });
    return unsubscribe;
  }, []);

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
    const unsubscribe = transcriptionServiceRef.current.onTokenUsage(
      (usage) => {
        setTokenCounts((prev) => ({
          ...prev,
          transcriptionInput: prev.transcriptionInput + usage.inputTokens,
          transcriptionOutput: prev.transcriptionOutput + usage.outputTokens,
        }));
      },
    );
    return unsubscribe;
  }, []);

  const value: EngineContextValue = {
    lastAnswer,
    tokenCounts,
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
