import type { Instrument } from '../types'

// Verify the two index identifiers against the current FYERS Symbol Master
// before switching to live mode. Equity identifiers follow FYERS NSE symbology.
export const instruments: Instrument[] = [
  { id: 'nifty', label: 'NIFTY 50', symbol: 'NSE:NIFTY50-INDEX', kind: 'index' },
  { id: 'banknifty', label: 'BANK NIFTY', symbol: 'NSE:NIFTYBANK-INDEX', kind: 'index' },
  { id: 'reliance', label: 'RELIANCE', symbol: 'NSE:RELIANCE-EQ', kind: 'equity' },
  { id: 'icici', label: 'ICICI BANK', symbol: 'NSE:ICICIBANK-EQ', kind: 'equity' },
  { id: 'airtel', label: 'BHARTI AIRTEL', symbol: 'NSE:BHARTIARTL-EQ', kind: 'equity' },
  { id: 'hdfc', label: 'HDFC BANK', symbol: 'NSE:HDFCBANK-EQ', kind: 'equity' }
]
