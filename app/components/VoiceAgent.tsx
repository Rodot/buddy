import { useState, useRef } from "react";
import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";
import { mdiClose, mdiMicrophone } from "@mdi/js";
import MdiIcon from "./MdiIcon";
import { motion, AnimatePresence } from "framer-motion";

export default function VoiceAgent() {
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [isVadActive, setIsVadActive] = useState(false);
  const sessionRef = useRef<RealtimeSession | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMessage = (text: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setMessage(text);

    const wordCount = Math.ceil(text.length / 5);
    const displayDuration = Math.max(2000, wordCount * 300);

    timeoutRef.current = setTimeout(() => {
      setMessage("");
    }, displayDuration);
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
  };

  const disconnect = async () => {
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
  };

  return (
    <div className="p-4">
      {!isConnected && (
        <button onClick={connect} className="btn btn-primary">
          Connect
        </button>
      )}
      {isConnected && (
        <>
          <div
            className="fixed top-4 right-20 btn btn-circle btn-ghost pointer-events-none"
            aria-label="Voice activity"
          >
            <MdiIcon
              path={mdiMicrophone}
              size={24}
              className={isVadActive ? "text-error" : "text-white"}
            />
          </div>
          <button
            onClick={disconnect}
            className="fixed top-4 right-4 btn btn-circle"
            aria-label="Disconnect"
          >
            <MdiIcon path={mdiClose} size={24} />
          </button>
        </>
      )}
      <AnimatePresence mode="wait">
        {isConnected && message && (
          <motion.p
            key={message}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
            className="text-white text-center"
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
