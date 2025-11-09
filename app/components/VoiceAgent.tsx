import { mdiClose, mdiMicrophone } from "@mdi/js";
import MdiIcon from "./MdiIcon";
import { motion, AnimatePresence } from "framer-motion";
import { useTranscription } from "../providers/transcription.provider";
import { useState, useEffect, useRef } from "react";

export default function VoiceAgent() {
  const { isConnected, isVadActive, connect, disconnect, onTranscription } =
    useTranscription();
  const [transcript, setTranscript] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = onTranscription((text: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setTranscript(text);

      const wordCount = Math.ceil(text.length / 5);
      const displayDuration = Math.max(2000, wordCount * 300);

      timeoutRef.current = setTimeout(() => {
        setTranscript("");
      }, displayDuration);
    });

    return () => {
      unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onTranscription]);

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
        {isConnected && transcript && (
          <motion.p
            key={transcript}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
            className="text-white text-center"
          >
            {transcript}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
