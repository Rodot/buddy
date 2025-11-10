import { useState } from "react";
import { useEngine } from "../providers/engine.provider";

export default function CostCounter() {
  const { tokenCounts } = useEngine();
  const [showDetail, setShowDetail] = useState(false);

  // Pricing per 1M tokens
  const COMPLETION_INPUT_PRICE = 0.45;
  const COMPLETION_OUTPUT_PRICE = 3.6;
  const TRANSCRIPTION_INPUT_PRICE = 2.50;
  const TRANSCRIPTION_OUTPUT_PRICE = 10.0;

  // Calculate individual costs
  const completionInputCost =
    (tokenCounts.completionInput / 1_000_000) * COMPLETION_INPUT_PRICE;
  const completionOutputCost =
    (tokenCounts.completionOutput / 1_000_000) * COMPLETION_OUTPUT_PRICE;
  const transcriptionInputCost =
    (tokenCounts.transcriptionInput / 1_000_000) * TRANSCRIPTION_INPUT_PRICE;
  const transcriptionOutputCost =
    (tokenCounts.transcriptionOutput / 1_000_000) * TRANSCRIPTION_OUTPUT_PRICE;

  // Calculate total cost in dollars
  const totalCost =
    completionInputCost +
    completionOutputCost +
    transcriptionInputCost +
    transcriptionOutputCost;

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
        </>
      ) : (
        <div>${totalCost.toFixed(2)}</div>
      )}
    </div>
  );
}
