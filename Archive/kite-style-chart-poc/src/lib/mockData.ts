import type { Candle, Timeframe } from '../types'

const intervalSeconds: Record<Timeframe, number> = {
  '1': 60, '3': 180, '5': 300, '15': 900, '60': 3600, 'D': 86400
}

export function makeMockCandles(seed: number, timeframe: Timeframe, count = 260): Candle[] {
  const step = intervalSeconds[timeframe]
  const now = Math.floor(Date.now() / 1000)
  const end = Math.floor(now / step) * step
  let close = seed
  const candles: Candle[] = []

  for (let i = count - 1; i >= 0; i--) {
    const drift = Math.sin(i / 13) * seed * 0.00045
    const change = (Math.sin(i * 1.73) + Math.cos(i * 0.37)) * seed * 0.00075 + drift
    const open = close
    close = Math.max(seed * 0.7, close + change)
    const high = Math.max(open, close) + Math.abs(change) * 0.7 + seed * 0.00025
    const low = Math.min(open, close) - Math.abs(change) * 0.7 - seed * 0.00025
    candles.push({
      time: end - i * step,
      open, high, low, close,
      volume: Math.round(10000 + Math.abs(change / seed) * 900000)
    })
  }
  return candles
}

export const seedPrices: Record<string, number> = {
  nifty: 24500, banknifty: 52000, reliance: 1450, icici: 1250, airtel: 1680, hdfc: 1750
}
