import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";

interface TranscriptionContextValue {
  isConnected: boolean;
  message: string;
  isVadActive: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const TranscriptionContext = createContext<
  TranscriptionContextValue | undefined
>(undefined);

interface TranscriptionProviderProps {
  children: ReactNode;
}

export function TranscriptionProvider({
  children,
}: TranscriptionProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [isVadActive, setIsVadActive] = useState(false);
  const sessionRef = useRef<RealtimeSession | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMessage = useCallback((text: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setMessage(text);

    const wordCount = Math.ceil(text.length / 5);
    const displayDuration = Math.max(2000, wordCount * 300);

    timeoutRef.current = setTimeout(() => {
      setMessage("");
    }, displayDuration);
  }, []);

  const connect = useCallback(async () => {
    const agent = new RealtimeAgent({
      name: "Transcriber",
    });

    const session = new RealtimeSession(agent, {
      model: "gpt-realtime",
    });

    sessionRef.current = session;

    const response = await fetch("/api/openai-key");
    const { key } = await response.json();

    await session.connect({
      apiKey: key,
    });

    session.transport.updateSessionConfig({
      outputModalities: ["text"],
      audio: {
        input: {
          transcription: { model: "gpt-4o-mini-transcribe" },
        },
      },
    });

    session.on("transport_event", (event) => {
      switch (event.type) {
        case "input_audio_buffer.speech_started":
          setIsVadActive(true);
          break;
        case "input_audio_buffer.speech_stopped":
          setIsVadActive(false);
          break;
        case "conversation.item.input_audio_transcription.completed":
          showMessage(event.transcript);
          break;
      }
    });

    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.error("Error entering fullscreen:", error);
    }

    setIsConnected(true);
  }, [showMessage]);

  const disconnect = useCallback(async () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error exiting fullscreen:", error);
    }

    setIsConnected(false);
    setMessage("");
    setIsVadActive(false);
  }, []);

  const value: TranscriptionContextValue = {
    isConnected,
    message,
    isVadActive,
    connect,
    disconnect,
  };

  return (
    <TranscriptionContext.Provider value={value}>
      {children}
    </TranscriptionContext.Provider>
  );
}

export function useTranscription(): TranscriptionContextValue {
  const context = useContext(TranscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useTranscription must be used within a TranscriptionProvider",
    );
  }
  return context;
}
