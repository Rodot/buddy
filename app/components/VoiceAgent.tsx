import { useState, useRef } from "react";
import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";
import { mdiClose } from "@mdi/js";
import MdiIcon from "./MdiIcon";

export default function VoiceAgent() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const sessionRef = useRef<RealtimeSession | null>(null);

  const connect = async () => {
    const agent = new RealtimeAgent({
      name: "Buddy",
      instructions:
        "You are Buddy, an AI companion, sitting on the desk of the user. You will hear all they say. It will not all require an answer or reaction. It's not always addressed to you, as the user sometimes talks to other people or just thinks out loud. That's why you don't answer unless you have something important to say. You actively listen. You give short answers.",
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

    // Listen for text responses from the agent
    session.on("agent_end", (_context, _agent, output) => {
      setLastMessage(output);
    });

    // Enter fullscreen
    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.error("Error entering fullscreen:", error);
    }

    setIsConnected(true);
  };

  const disconnect = async () => {
    // Disconnect from the session
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }

    // Exit fullscreen
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error exiting fullscreen:", error);
    }

    setIsConnected(false);
    setLastMessage("");
  };

  return (
    <div className="p-4">
      {!isConnected && (
        <button onClick={connect} className="btn btn-primary">
          Connect
        </button>
      )}
      {isConnected && (
        <button
          onClick={disconnect}
          className="fixed top-4 right-4 btn btn-circle"
          aria-label="Disconnect"
        >
          <MdiIcon path={mdiClose} size={24} />
        </button>
      )}
      {isConnected && <p className="text-white">{lastMessage || "..."}</p>}
    </div>
  );
}
