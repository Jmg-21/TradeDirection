export type Currency = 'EUR' | 'USD' | 'JPY' | 'GBP' | 'NZD' | 'AUD' | 'CAD' | 'GOLD';

export interface Correlation {
  id: Currency;
  d1: number;
  '4h': number;
  '1h': number;
}

export const INITIAL_CORRELATION_DATA: Correlation[] = [
    { id: 'EUR', d1: 0, '4h': 0, '1h': 0 },
    { id: 'USD', d1: 0, '4h': 0, '1h': 0 },
    { id: 'JPY', d1: 0, '4h': 0, '1h': 0 },
    { id: 'GBP', d1: 0, '4h': 0, '1h': 0 },
    { id: 'NZD', d1: 0, '4h': 0, '1h': 0 },
    { id: 'AUD', d1: 0, '4h': 0, '1h': 0 },
    { id: 'CAD', d1: 0, '4h': 0, '1h': 0 },
    { id: 'GOLD', d1: 0, '4h': 0, '1h': 0 },
];

export interface ForexPair {
  pair: string;
  base: Currency;
  quote: Currency;
}

export interface ForexPairGroup {
  index: Currency | 'XAU';
  pairs: ForexPair[];
}


export const FOREX_PAIRS: ForexPairGroup[] = [
  {
    index: 'EUR',
    pairs: [
      { pair: 'EURUSD', base: 'EUR', quote: 'USD' },
      { pair: 'EURJPY', base: 'EUR', quote: 'JPY' },
      { pair: 'EURGBP', base: 'EUR', quote: 'GBP' },
      { pair: 'EURNZD', base: 'EUR', quote: 'NZD' },
      { pair: 'EURCAD', base: 'EUR', quote: 'CAD' },
      { pair: 'EURAUD', base: 'EUR', quote: 'AUD' },
    ]
  },
  {
    index: 'GBP',
    pairs: [
      { pair: 'GBPUSD', base: 'GBP', quote: 'USD' },
      { pair: 'GBPJPY', base: 'GBP', quote: 'JPY' },
      { pair: 'GBPNZD', base: 'GBP', quote: 'NZD' },
      { pair: 'GBPCAD', base: 'GBP', quote: 'CAD' },
      { pair: 'GBPAUD', base: 'GBP', quote: 'AUD' },
    ]
  },
  {
    index: 'USD',
    pairs: [
      { pair: 'USDJPY', base: 'USD', quote: 'JPY' },
      { pair: 'USDCAD', base: 'USD', quote: 'CAD' },
    ]
  },
  {
    index: 'AUD',
    pairs: [
      { pair: 'AUDJPY', base: 'AUD', quote: 'JPY' },
      { pair: 'AUDNZD', base: 'AUD', quote: 'NZD' },
      { pair: 'AUDCAD', base: 'AUD', quote: 'CAD' },
      { pair: 'AUDUSD', base: 'AUD', quote: 'USD' },
    ]
  },
  {
    index: 'NZD',
    pairs: [
      { pair: 'NZDCAD', base: 'NZD', quote: 'CAD' },
      { pair: 'NZDUSD', base: 'NZD', quote: 'USD' },
      { pair: 'NZDJPY', base: 'NZD', quote: 'JPY' },
    ]
  },
  {
    index: 'XAU',
    pairs: [
      { pair: 'XAUUSD', base: 'GOLD', quote: 'USD' },
    ]
  }
];

export type SValue = 'Neutral' | 'Strong' | 'Weak' | 'Extreme Weak' | 'Extreme Strong';
export type Bias = 'BUY' | 'SELL' | 'NEUTRAL';
