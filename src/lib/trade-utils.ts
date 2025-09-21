import { SValue, Bias } from './constants';

export function calculateT(d1: number, h4: number, h1: number): number {
  return d1 + h4 + h1;
}

export function calculateS(t: number): SValue {
  if (t >= 8) return 'Extreme Strong';
  if (t >= 6) return 'Strong';
  if (t >= -5) return 'Neutral';
  if (t >= -8) return 'Weak';
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
