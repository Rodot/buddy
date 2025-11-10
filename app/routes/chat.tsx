import { mdiClose, mdiMicrophone } from "@mdi/js";
import MdiIcon from "../components/MdiIcon";
import { motion, AnimatePresence } from "framer-motion";
import { useEngine } from "../providers/engine.provider";
import ThinkingIndicator from "../components/dumb/ThinkingIndicator.dumb";
import { useTranslation } from "react-i18next";
import CostCounter from "../components/CostCounter";

export default function Chat() {
  const { state, lastAnswer, exitToHomePage } = useEngine();
  const { t } = useTranslation();

  const isVadActive = state === "listening";
  const isThinking = state === "thinking";

  const handleDisconnect = async () => {
    await exitToHomePage();
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-4">
        <CostCounter />
        <button
          id="disconnect"
          onClick={handleDisconnect}
          className="fixed top-4 right-4 btn btn-circle"
          aria-label={t("chat.disconnect")}
        >
          <MdiIcon path={mdiClose} size={24} />
        </button>
        <div className="flex flex-col items-center gap-4">
          <div
            className="btn btn-circle btn-ghost pointer-events-none"
            aria-label={t("chat.voiceActivity")}
          >
            <MdiIcon
              path={mdiMicrophone}
              size={24}
              className={`transition-opacity duration-300 ${isVadActive ? "opacity-100" : "opacity-30"}`}
            />
          </div>
          <div className="min-h-24">
            <AnimatePresence>
              {isThinking && (
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
          <div className="min-h-24">
            <AnimatePresence>
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
                  className="text-center text-2xl"
                >
                  {lastAnswer}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
