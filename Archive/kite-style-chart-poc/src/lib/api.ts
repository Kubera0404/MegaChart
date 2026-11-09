import type { Candle, Timeframe } from '../types'

export async function fetchHistory(symbol: string, resolution: Timeframe, token: string): Promise<Candle[]> {
  const response = await fetch('/api/fyers/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, resolution, token })
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error || 'FYERS history request failed')
  return payload.candles as Candle[]
}
