import { createContext, useContext, useState, useRef } from "react";
import type { ReactNode } from "react";
import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";

interface TranscriptionContextValue {
  isConnected: boolean;
  isVadActive: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  onTranscription: (callback: (transcript: string) => void) => () => void;
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
  const [isVadActive, setIsVadActive] = useState(false);
  const sessionRef = useRef<RealtimeSession | null>(null);
  const transcriptionListenersRef = useRef<Set<(transcript: string) => void>>(
    new Set(),
  );

  const onTranscription = (callback: (transcript: string) => void) => {
    transcriptionListenersRef.current.add(callback);
    return () => {
      transcriptionListenersRef.current.delete(callback);
    };
  };

  const connect = async () => {
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
          transcriptionListenersRef.current.forEach((listener) => {
            listener(event.transcript);
          });
          break;
      }
    });

    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.error("Error entering fullscreen:", error);
    }

    setIsConnected(true);
  };

  const disconnect = async () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error exiting fullscreen:", error);
    }

    setIsConnected(false);
    setIsVadActive(false);
  };

  const value: TranscriptionContextValue = {
    isConnected,
    isVadActive,
    connect,
    disconnect,
    onTranscription,
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
