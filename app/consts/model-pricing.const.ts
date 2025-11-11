interface ModelPricing {
  inputCostPerMillion: number;
  outputCostPerMillion: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  "gpt-5-mini-priority": {
    inputCostPerMillion: 0.45,
    outputCostPerMillion: 3.6,
  },
  "gpt-4o-mini-transcribe": {
    inputCostPerMillion: 1.25,
    outputCostPerMillion: 5.0,
  },
  "gpt-5-nano": {
    inputCostPerMillion: 0.05,
    outputCostPerMillion: 0.4,
  },
};
