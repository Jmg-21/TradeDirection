import { SValue, Bias } from './constants';

export function calculateT(d1: number, h4: number, h1: number): number {
  return d1 + h4 + h1;
}

export function calculateS(t: number): SValue {
  if (t >= 3) return 'Extreme Strong';
  if (t >= 1) return 'Strong';
  if (t > -1) return 'Neutral';
  if (t >= -3) return 'Weak';
  return 'Extreme Weak';
}

export function calculateBias(sBase: SValue, sQuote: SValue): Bias {
  const strengths: SValue[] = ['Strong', 'Extreme Strong'];
  const weaknesses: SValue[] = ['Weak', 'Extreme Weak'];

  if (strengths.includes(sBase) && weaknesses.includes(sQuote)) {
    return 'BUY';
  }
  if (weaknesses.includes(sBase) && strengths.includes(sQuote)) {
    return 'SELL';
  }
  return 'NEUTRAL';
}


export function calculatePipValue(pair: string, lotSize: number, pips: number): number {
  if (pips === 0 || lotSize === 0) return 0;
  
  if (pair.toUpperCase() === 'XAUUSD') {
    // For Gold, 1 point movement is $1 for a standard lot.
    // A "pip" is often considered a $0.10 move.
    return pips * 0.1 * lotSize * 100; // lotSize * pips
  }

  const JPY_PAIRS = ['EURJPY', 'GBPJPY', 'USDJPY', 'AUDJPY', 'NZDJPY'];
  const IS_JPY_PAIR = JPY_PAIRS.some(p => pair.toUpperCase().includes(p));

  // This is a simplification. In a real scenario, you'd need the current exchange rate
  // for the quote currency to USD if it's not USD.
  // For now, we assume a direct 1-to-1 or use a standard pip value.
  let valuePerPipPerLot = 10; // Standard for most USD quoted pairs

  if (IS_JPY_PAIR) {
    // This is a simplification, we would need the USD/JPY rate
    valuePerPipPerLot = 9.3; // Approximate value
  } else if (pair.toUpperCase().endsWith('CAD')) {
    valuePerPipPerLot = 7.3; // Approximate value
  } else if (pair.toUpperCase().endsWith('GBP')) {
    valuePerPipPerLot = 12.5; // Approximate value
  }


  const totalValue = pips * valuePerPipPerLot * lotSize;
  
  return totalValue;
}
