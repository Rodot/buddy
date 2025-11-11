import { useState } from "react";
import { MODEL_PRICING } from "../consts/model-pricing.const";
import { useCost } from "../providers/cost.provider";

export default function CostCounter() {
  const tokenCounts = useCost();
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

  return (
    <div
      className="fixed top-4 left-4 p-2 font-mono cursor-pointer opacity-50 select-none"
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
