import { TranscriptionService } from "./transcription.service";
import { conversationService } from "./conversation.service";
import { settingsService } from "./settings.service";
import { completionService } from "./completion.service";

export class EngineService {
  public readonly transcriptionService = new TranscriptionService();

  async connect(language: "en" | "fr"): Promise<void> {
    settingsService.setLanguage(language);
    await this.transcriptionService.connect(language);
    this.transcriptionService.onTranscription((transcript) => {
      conversationService.addMessage({
        text: transcript,
        role: "user",
      });
      console.log("User:", transcript);
      this.requestCompletion();
    });
  }

  private async requestCompletion(): Promise<void> {
    const conversation = conversationService.get();
    const settings = settingsService.get();
    const completionText = await completionService.request(
      conversation,
      settings.language,
    );
    if (!completionText) {
      return;
    }
    console.log("Assistant:", completionText);
    conversationService.addMessage({
      text: completionText,
      role: "assistant",
    });
  }

  async disconnect(): Promise<void> {
    await this.transcriptionService.disconnect();
  }
}
