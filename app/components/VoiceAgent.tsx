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
      name: "Buddy",
      instructions:
        "You are an emotional support companion. If the conversation is paused or over, answer [NO-COMMENT], DO NOT use a phrase like 'I'm here if you need anything'. If the user didn't explicitly engage with you, answer [NO-COMMENT]. Otherwise, you answer a single sentence of 1 to 20 words.",
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
    });

    session.on("agent_end", (_context, _agent, output) => {
      showMessage(output);
    });

    session.on("transport_event", (event) => {
      if (event.type === "input_audio_buffer.speech_started") {
        setIsVadActive(true);
      } else if (event.type === "input_audio_buffer.speech_stopped") {
        setIsVadActive(false);
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
