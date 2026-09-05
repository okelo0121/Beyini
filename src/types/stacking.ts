export interface StackingMetrics {
  apyPercentage: number;
  totalValueLocked: number;
  stxPriceUsd: number;
  btcPriceUsd: number;
  activeStackers: number;
  nextCycleDays: number;
}

export interface StackingCalculation {
  stxLocked: number;
  cycleMonths: number;
  estimatedBtcEarned: number;
  estimatedUsdValue: number;
  effectiveApy: number;
}
