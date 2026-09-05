/*import React, { useState } from 'react';
import { Calculator, ArrowUpRight } from 'lucide-react';
import '../styles/stacking.css';

interface StackingCalculatorProps {
  currentApy?: number;
  onStartStacking?: (amount: number) => void;
}

export const StackingCalculator: React.FC<StackingCalculatorProps> = ({
  currentApy = 9.5,
  onStartStacking
}) => {
  const [stxAmount, setStxAmount] = useState<number>(5000);
  const [cycles, setCycles] = useState<number>(3); // 3 cycles ~ 3 months

  // Assumed realistic rates: STX = $2.10, BTC = $65,000
  const stxPriceUsd = 2.10;
  const btcPriceUsd = 65000;

  // Stacking reward calculation:
  // Annual Yield in USD = (stxAmount * stxPriceUsd) * (currentApy / 100)
  // Per Cycle (approx ~1 month)
  const totalUsdLocked = stxAmount * stxPriceUsd;
  const estimatedAnnualBtc = (totalUsdLocked * (currentApy / 100)) / btcPriceUsd;
  const estimatedPeriodBtc = (estimatedAnnualBtc * (cycles / 12));
  const estimatedPeriodUsd = estimatedPeriodBtc * btcPriceUsd;

  return (
    <div className="stacking-calculator-container" id="calculator">
      <div className="calc-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Calculator size={26} color="#FF5500" />
          <h3 className="calc-title">Stacking Rewards Calculator</h3>
        </div>
        <span className="calc-tag">Live APY: {currentApy}%</span>
      </div>

      <div className="calc-body">
        <div className="calc-input-group">
          <div className="calc-label-row">
            <span>Lock Amount (STX)</span>
            <span className="calc-stx-badge">{stxAmount.toLocaleString()} STX</span>
          </div>

          <input
            type="range"
            min={500}
            max={50000}
            step={500}
            value={stxAmount}
            onChange={(e) => setStxAmount(Number(e.target.value))}
            className="calc-slider"
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#888' }}>
            <span>500 STX (~$1,050)</span>
            <span>25,000 STX</span>
            <span>50,000 STX (~$105,000)</span>
          </div>

          <div style={{ marginTop: '16px' }}>
            <span style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.8)', display: 'block', marginBottom: '8px' }}>
              Lock Duration (Cycles)
            </span>
            <div className="calc-cycle-buttons">
              {[1, 3, 6, 12].map((cycleCount) => (
                <button
                  key={cycleCount}
                  className={`btn-cycle ${cycles === cycleCount ? 'active' : ''}`}
                  onClick={() => setCycles(cycleCount)}
                >
                  {cycleCount} {cycleCount === 1 ? 'Cycle' : 'Cycles'} (~{cycleCount} {cycleCount === 1 ? 'mo' : 'mos'})
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="calc-result-card">
          <div className="result-row">
            <span className="result-label">Estimated BTC Reward</span>
            <span className="result-value-btc">{estimatedPeriodBtc.toFixed(6)} BTC</span>
          </div>

          <div className="result-row">
            <span className="result-label">Equivalent Value</span>
            <span className="result-value-usd">≈ ${estimatedPeriodUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="result-row" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
            <span className="result-label">Total STX Locked</span>
            <span style={{ fontWeight: 600 }}>${totalUsdLocked.toLocaleString()} USD</span>
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', marginTop: '8px', fontSize: '1.1rem', padding: '14px' }}
            onClick={() => onStartStacking && onStartStacking(stxAmount)}
          >
            <span>Lock {stxAmount.toLocaleString()} STX Now</span>
            <ArrowUpRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};*/
