import { mdiClose, mdiMicrophone } from "@mdi/js";
import MdiIcon from "./MdiIcon";
import { motion, AnimatePresence } from "framer-motion";
import { useEngine } from "../providers/engine.provider";
import { useEffect, useRef, useState } from "react";
import { conversationService } from "../services/conversation.service";

export default function VoiceAgent() {
  const { engine } = useEngine();
  const [isConnected, setIsConnected] = useState(false);
  const [isVadActive, setIsVadActive] = useState(false);
  const [lastAnswer, setLastAnswer] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to connection state from transcription service
  useEffect(() => {
    const unsubscribe = engine.transcriptionService.onConnectionChange(
      (connected) => {
        setIsConnected(connected);
      },
    );
    return unsubscribe;
  }, [engine]);

  // Subscribe to VAD state from transcription service
  useEffect(() => {
    const unsubscribe = engine.transcriptionService.onVadChange((isActive) => {
      setIsVadActive(isActive);
    });
    return unsubscribe;
  }, [engine]);

  // Subscribe to new assistant answers
  useEffect(() => {
    const unsubscribe = conversationService.onNewAnswer((message) => {
      setLastAnswer(message.text);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout based on answer length
      const wordCount = Math.ceil(message.text.length / 5);
      const displayDuration = Math.max(2000, wordCount * 300);

      timeoutRef.current = setTimeout(() => {
        setLastAnswer("");
      }, displayDuration);
    });

    return () => {
      unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleConnect = async (lang: "en" | "fr") => {
    await engine.connect(lang);
  };

  const handleDisconnect = async () => {
    await engine.disconnect();
  };

  return (
    <div className="p-4">
      {!isConnected && (
        <div className="flex gap-4">
          <button
            onClick={() => handleConnect("en")}
            className="btn btn-primary"
          >
            English
          </button>
          <button
            onClick={() => handleConnect("fr")}
            className="btn btn-primary"
          >
            Français
          </button>
        </div>
      )}
      {isConnected && (
        <>
          <button
            onClick={handleDisconnect}
            className="fixed top-4 right-4 btn btn-circle"
            aria-label="Disconnect"
          >
            <MdiIcon path={mdiClose} size={24} />
          </button>
          <div className="flex flex-col items-center gap-4">
            <div
              className="btn btn-circle btn-ghost pointer-events-none"
              aria-label="Voice activity"
            >
              <MdiIcon
                path={mdiMicrophone}
                size={24}
                className={`transition-opacity duration-300 ${isVadActive ? "opacity-100" : "opacity-30"}`}
              />
            </div>
            <div className="min-h-24">
              <AnimatePresence mode="wait">
                {lastAnswer && (
                  <motion.p
                    key={lastAnswer}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.3,
                      ease: "easeOut",
                    }}
                    className="text-white text-center"
                  >
                    {lastAnswer}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
