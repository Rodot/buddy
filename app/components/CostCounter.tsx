import { useState, useEffect } from "react";
import { completionService } from "../services/completion.service";
import { transcriptionService } from "../services/transcription.service";
import { spontaneousThinkingDelayService } from "../services/spontaneous-thinking-delay.service";
import { MODEL_PRICING } from "../consts/model-pricing.const";

interface TokenCounts {
  completionInput: number;
  completionOutput: number;
  transcriptionInput: number;
  transcriptionOutput: number;
  delayInput: number;
  delayOutput: number;
}

export default function CostCounter() {
  const [tokenCounts, setTokenCounts] = useState<TokenCounts>({
    completionInput: 0,
    completionOutput: 0,
    transcriptionInput: 0,
    transcriptionOutput: 0,
    delayInput: 0,
    delayOutput: 0,
  });
  const [showDetail, setShowDetail] = useState(false);

  // Calculate individual costs
  const completionInputCost =
    (tokenCounts.completionInput / 1_000_000) *
    MODEL_PRICING["gpt-5-mini-priority"].inputCostPerMillion;
  const completionOutputCost =
    (tokenCounts.completionOutput / 1_000_000) *
    MODEL_PRICING["gpt-5-mini-priority"].outputCostPerMillion;
  const transcriptionInputCost =
    (tokenCounts.transcriptionInput / 1_000_000) *
    MODEL_PRICING["gpt-4o-mini-transcribe"].inputCostPerMillion;
  const transcriptionOutputCost =
    (tokenCounts.transcriptionOutput / 1_000_000) *
    MODEL_PRICING["gpt-4o-mini-transcribe"].outputCostPerMillion;
  const delayInputCost =
    (tokenCounts.delayInput / 1_000_000) *
    MODEL_PRICING["gpt-5-nano"].inputCostPerMillion;
  const delayOutputCost =
    (tokenCounts.delayOutput / 1_000_000) *
    MODEL_PRICING["gpt-5-nano"].outputCostPerMillion;

  // Calculate total cost in dollars
  const totalCost =
    completionInputCost +
    completionOutputCost +
    transcriptionInputCost +
    transcriptionOutputCost +
    delayInputCost +
    delayOutputCost;

  // Track completion token usage
  useEffect(() => {
    const unsubscribe = completionService.onTokenUsage((usage) => {
      setTokenCounts((prev) => ({
        ...prev,
        completionInput: prev.completionInput + usage.inputTokens,
        completionOutput: prev.completionOutput + usage.outputTokens,
      }));
    });
    return unsubscribe;
  }, []);

  // Track transcription token usage
  useEffect(() => {
    const unsubscribe = transcriptionService.onTokenUsage((usage) => {
      setTokenCounts((prev) => ({
        ...prev,
        transcriptionInput: prev.transcriptionInput + usage.inputTokens,
        transcriptionOutput: prev.transcriptionOutput + usage.outputTokens,
      }));
    });
    return unsubscribe;
  }, []);

  // Track spontaneous thinking delay token usage
  useEffect(() => {
    const unsubscribe = spontaneousThinkingDelayService.onTokenUsage(
      (usage) => {
        setTokenCounts((prev) => ({
          ...prev,
          delayInput: prev.delayInput + usage.inputTokens,
          delayOutput: prev.delayOutput + usage.outputTokens,
        }));
      },
    );
    return unsubscribe;
  }, []);

  return (
    <div
      className="fixed top-4 left-4 p-2 font-mono cursor-pointer select-none"
      onClick={() => setShowDetail(!showDetail)}
    >
      {showDetail ? (
        <>
          <div>${totalCost.toFixed(4)} total</div>
          <div>${completionInputCost.toFixed(4)} completion input</div>
          <div>${completionOutputCost.toFixed(4)} completion output</div>
          <div>${transcriptionInputCost.toFixed(4)} transcription input</div>
          <div>${transcriptionOutputCost.toFixed(4)} transcription output</div>
          <div>${delayInputCost.toFixed(4)} delay input</div>
          <div>${delayOutputCost.toFixed(4)} delay output</div>
        </>
      ) : (
        <div>${totalCost.toFixed(2)}</div>
      )}
    </div>
  );
}
