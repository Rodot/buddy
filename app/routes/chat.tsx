import { mdiClose, mdiMicrophone } from "@mdi/js";
import MdiIcon from "../components/MdiIcon";
import { motion, AnimatePresence } from "framer-motion";
import { useEngine } from "../providers/engine.provider";
import ThinkingIndicator from "../components/dumb/ThinkingIndicator.dumb";
import { useTranslation } from "react-i18next";
import CostCounter from "../components/CostCounter";
import { useRef } from "react";
import { SoundService } from "../services/sound.service";

export default function Chat() {
  const {
    lastAnswer,
    lastTranscription,
    exitToHomePage,
    isListeningActive: isVadActive,
    isThinkingActive: isCompletionActive,
  } = useEngine();
  const { t } = useTranslation();
  const soundServiceRef = useRef<SoundService>(
    new SoundService("/784041__sadiquecat__mouth-bop.wav"),
  );

  const handleDisconnect = async () => {
    await exitToHomePage();
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full p-4">
      <CostCounter />
      <button
        id="disconnect"
        onClick={handleDisconnect}
        className="fixed top-4 right-4 btn btn-circle"
        aria-label={t("chat.disconnect")}
      >
        <MdiIcon path={mdiClose} size={24} />
      </button>
      <div className="flex flex-col items-center max-w-2xl w-full">
        <div>
          <div
            className={`btn btn-circle pointer-events-none transition-colors duration-300 ${isVadActive ? "bg-red-500" : "btn-ghost"}`}
            aria-label={t("chat.voiceActivity")}
          >
            <MdiIcon path={mdiMicrophone} size={24} className={"text-white"} />
          </div>
        </div>
        <div className="min-h-32 w-full">
          <AnimatePresence mode="wait">
            {lastTranscription && (
              <motion.p
                key={lastTranscription}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: { duration: 0.1, ease: "easeOut" },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.3 },
                }}
                className="text-center text-xl text-gray-400 truncate px-4"
              >
                {lastTranscription}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <div className="min-h-6">
          <AnimatePresence>
            {isCompletionActive && (
              <motion.div
                key="thinking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.3,
                }}
              >
                <ThinkingIndicator />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="min-h-32">
          <AnimatePresence mode="wait">
            {lastAnswer && (
              <motion.p
                key={lastAnswer.text}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: { duration: 0.1, ease: "easeOut" },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.3 },
                }}
                onAnimationStart={(definition) => {
                  // Only play sound on enter animation (opacity going to 1)
                  if (
                    typeof definition === "object" &&
                    definition !== null &&
                    !Array.isArray(definition) &&
                    "opacity" in definition &&
                    definition.opacity === 1
                  ) {
                    soundServiceRef.current.play();
                  }
                }}
                className={`text-center text-2xl whitespace-pre-line ${lastAnswer.personna === "bully" ? "text-red-500" : ""}`}
              >
                {lastAnswer.text}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
