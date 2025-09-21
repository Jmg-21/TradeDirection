export type Currency = 'EUR' | 'USD' | 'JPY' | 'GBP' | 'NZD' | 'AUD' | 'CAD' | 'GOLD';

export interface Correlation {
  id: Currency;
  d1: number;
  '4h': number;
  '1h': number;
}

export const INITIAL_CORRELATION_DATA: Correlation[] = [
  { id: 'EUR', d1: 3, '4h': 2, '1h': 2 },
  { id: 'USD', d1: -2, '4h': -1, '1h': -1 },
  { id: 'JPY', d1: -4, '4h': -2, '1h': -2 },
  { id: 'GBP', d1: 1, '4h': 1, '1h': 0 },
  { id: 'NZD', d1: -1, '4h': 0, '1h': -1 },
  { id: 'AUD', d1: 2, '4h': 1, '1h': 1 },
  { id: 'CAD', d1: 0, '4h': 0, '1h': 0 },
  { id: 'GOLD', d1: -5, '4h': -3, '1h': -1 },
];

export const FOREX_PAIRS: {pair: string, base: Currency, quote: Currency}[] = [
  { pair: 'EURUSD', base: 'EUR', quote: 'USD' },
  { pair: 'EURJPY', base: 'EUR', quote: 'JPY' },
  { pair: 'EURGBP', base: 'EUR', quote: 'GBP' },
  { pair: 'EURNZD', base: 'EUR', quote: 'NZD' },
  { pair: 'EURCAD', base: 'EUR', quote: 'CAD' },
  { pair: 'EURAUD', base: 'EUR', quote: 'AUD' },
  { pair: 'GBPUSD', base: 'GBP', quote: 'USD' },
  { pair: 'GBPJPY', base: 'GBP', quote: 'JPY' },
  { pair: 'GBPNZD', base: 'GBP', quote: 'NZD' },
  { pair: 'GBPCAD', base: 'GBP', quote: 'CAD' },
  { pair: 'GBPAUD', base: 'GBP', quote: 'AUD' },
  { pair: 'USDJPY', base: 'USD', quote: 'JPY' },
  { pair: 'USDCAD', base: 'USD', quote: 'CAD' },
  { pair: 'AUDJPY', base: 'AUD', quote: 'JPY' },
  { pair: 'AUDNZD', base: 'AUD', quote: 'NZD' },
  { pair: 'AUDCAD', base: 'AUD', quote: 'CAD' },
  { pair: 'AUDUSD', base: 'AUD', quote: 'USD' },
  { pair: 'NZDCAD', base: 'NZD', quote: 'CAD' },
  { pair: 'NZDUSD', base: 'NZD', quote: 'USD' },
  { pair: 'NZDJPY', base: 'NZD', quote: 'JPY' },
  { pair: 'XAUUSD', base: 'GOLD', quote: 'USD' },
];

export type SValue = 'Neutral' | 'Strong' | 'Weak' | 'Extreme Weak' | 'Extreme Strong';
export type Bias = 'BUY' | 'SELL' | 'NEUTRAL';
