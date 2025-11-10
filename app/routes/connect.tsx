import type { Route } from "./+types/connect";
import { useState, useEffect } from "react";
import { useEngine } from "../providers/engine.provider";
import { useToast } from "../providers/toast.provider";
import MdiIcon from "../components/MdiIcon";
import { mdiTrashCan } from "@mdi/js";
import {
  LANGUAGES,
  DEFAULT_LANGUAGE,
  type Language,
} from "../consts/i18n.const";
import { useTranslation } from "react-i18next";
import { conversationService } from "../services/conversation.service";

export function meta({ }: Route.MetaArgs) {
  return [{ title: "Buddy" }, { name: "description", content: "Buddy app" }];
}

export default function Connect() {
  const { connect, clearConversation } = useEngine();
  const { showToast } = useToast();
  const { t, i18n } = useTranslation();
  // Initialize with detected language (localStorage > browser > fallback to en)
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    (i18n.language as Language) || DEFAULT_LANGUAGE,
  );
  const [, forceUpdate] = useState(0);
  const [isGlitching, setIsGlitching] = useState(false);

  // Sync i18n language with selected language (only when user changes it)
  useEffect(() => {
    if (selectedLanguage !== i18n.language) {
      i18n.changeLanguage(selectedLanguage);
    }
  }, [selectedLanguage, i18n]);

  // Random blink effect: BUDDY -> BULLY with shake animation
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNextGlitch = () => {
      // Random interval between 3-5 seconds
      const nextGlitchDelay = 3000 + Math.random() * 2000;
      timeoutId = setTimeout(() => {
        setIsGlitching(true);
        const glitchDuration = 300;
        setTimeout(() => {
          setIsGlitching(false);
          // Schedule the next glitch after returning to normal
          scheduleNextGlitch();
        }, glitchDuration);
      }, nextGlitchDelay);
    };

    scheduleNextGlitch();

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const handleConnect = async () => {
    showToast(t("connect.connecting"));
    await connect(selectedLanguage);
  };

  const handleClear = () => {
    clearConversation();
    showToast(t("connect.historyDeleted"));
    forceUpdate((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-screen">
      <div className="p-4 flex-1 flex items-center">
        <div className="flex flex-col gap-16 items-center">
          <div className="text-center mb-4">
            <h1
              className={`text-6xl font-bold font-mono mb-2 pt-1 ${isGlitching ? "text-black bg-red-600" : "text-white"
                }`}
            >
              {isGlitching ? "BULLY" : "BUDDY"}
            </h1>
            <p className="text-xl text-base-content/70">
              {t("connect.subtitle")}
            </p>
          </div>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <select
              id="language-select"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as Language)}
              className="select select-ghost"
            >
              {LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.name}
                </option>
              ))}
            </select>
            <button id="connect-button" onClick={handleConnect} className="btn">
              {t("connect.button")}
            </button>
            {conversationService.get().length > 0 && (
              <button
                id="forget-everything"
                onClick={handleClear}
                className="btn btn-ghost opacity-50 gap-2"
              >
                <MdiIcon path={mdiTrashCan} size={20} />
                {t("connect.forgetButton")}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="p-4 text-center text-sm text-base-content/50">
        <p>{t("connect.footer.satire")}</p>
        <p>
          {t("connect.footer.noData")}{" "}
          <a
            href="https://betalab.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="link"
          >
            BetaLab.fr
          </a>
        </p>
        <p>{t("connect.footer.dataSharing")}</p>
      </div>
    </div>
  );
}
