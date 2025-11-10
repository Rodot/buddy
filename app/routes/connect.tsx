import type { Route } from "./+types/connect";
import { useEngine } from "../providers/engine.provider";
import { useToast } from "../providers/toast.provider";
import MdiIcon from "../components/MdiIcon";
import { mdiTrashCan } from "@mdi/js";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Buddy" }, { name: "description", content: "Buddy app" }];
}

export default function Connect() {
  const { connect, clearConversation } = useEngine();
  const { showToast } = useToast();

  const handleConnect = async (lang: "en" | "fr") => {
    showToast("Connecting...");
    await connect(lang);
  };

  const handleClear = () => {
    clearConversation();
    showToast("History deleted");
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-screen">
      <div className="p-4 flex-1 flex items-center">
        <div className="flex flex-col gap-16 items-center">
          <div className="text-center mb-4">
            <h1 className="text-6xl font-bold mb-2">Buddy</h1>
            <p className="text-xl text-base-content/70">
              Your dark online companion
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <button
              id="connect-en"
              onClick={() => handleConnect("en")}
              className="btn"
            >
              English
            </button>
            <button
              id="connect-fr"
              onClick={() => handleConnect("fr")}
              className="btn"
            >
              Français
            </button>
            <button
              id="forget-everything"
              onClick={handleClear}
              className="btn btn-ghost btn-error gap-2"
            >
              <MdiIcon path={mdiTrashCan} size={20} />
              Forget past conversations
            </button>
          </div>
        </div>
      </div>
      <div className="p-4 text-center text-sm text-base-content/50">
        <p>Satire - Use at your own risk</p>
        <p>Audio and messages processed by OpenAI</p>
        <p>
          No cookies, data or logs stored by{" "}
          <a
            href="https://betalab.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="link"
          >
            BetaLab.fr
          </a>
        </p>
      </div>
    </div>
  );
}
