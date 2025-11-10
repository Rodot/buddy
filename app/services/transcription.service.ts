import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";
import type { Language } from "../consts/i18n.const";

export class TranscriptionService {
  private session: RealtimeSession | null = null;
  private transcriptionListeners = new Set<(transcript: string) => void>();
  private vadListeners = new Set<(isActive: boolean) => void>();
  private connectionListeners = new Set<(isConnected: boolean) => void>();
  private tokenUsageListeners = new Set<
    (usage: { inputTokens: number; outputTokens: number }) => void
  >();

  async connect(language: Language): Promise<void> {
    const agent = new RealtimeAgent({
      name: "Transcriber",
    });

    const session = new RealtimeSession(agent, {
      model: "gpt-realtime",
    });

    this.session = session;

    const response = await fetch("/api/openai-key");
    const { key } = await response.json();

    await session.connect({
      apiKey: key,
    });

    session.transport.updateSessionConfig({
      outputModalities: ["text"],
      audio: {
        input: {
          transcription: {
            model: "gpt-4o-transcribe",
            language,
          },
        },
      },
    });

    session.on("transport_event", (event) => {
      switch (event.type) {
        case "input_audio_buffer.speech_started":
          this.vadListeners.forEach((listener) => listener(true));
          break;
        case "input_audio_buffer.speech_stopped":
          this.vadListeners.forEach((listener) => listener(false));
          break;
        case "conversation.item.input_audio_transcription.completed":
          this.transcriptionListeners.forEach((listener) => {
            listener(event.transcript);
          });
          break;
      }
    });

    session.transport.on("usage_update", (usage) => {
      this.tokenUsageListeners.forEach((listener) => {
        listener({
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
        });
      });
    });

    // Emit connection event
    this.connectionListeners.forEach((listener) => listener(true));
  }

  async disconnect(): Promise<void> {
    if (this.session) {
      this.session.close();
      this.session = null;
    }

    // Emit disconnection event
    this.connectionListeners.forEach((listener) => listener(false));
  }

  onTranscription(callback: (transcript: string) => void): () => void {
    this.transcriptionListeners.add(callback);
    return () => {
      this.transcriptionListeners.delete(callback);
    };
  }

  onVadChange(callback: (isActive: boolean) => void): () => void {
    this.vadListeners.add(callback);
    return () => {
      this.vadListeners.delete(callback);
    };
  }

  onConnectionChange(callback: (isConnected: boolean) => void): () => void {
    this.connectionListeners.add(callback);
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  onTokenUsage(
    callback: (usage: { inputTokens: number; outputTokens: number }) => void,
  ): () => void {
    this.tokenUsageListeners.add(callback);
    return () => {
      this.tokenUsageListeners.delete(callback);
    };
  }

  isConnected(): boolean {
    return this.session !== null;
  }
}
