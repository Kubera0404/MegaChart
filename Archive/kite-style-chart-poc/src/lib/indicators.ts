import type { Candle } from '../types'

export function ema(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = Array(values.length).fill(null)
  if (values.length < period) return result

  // Seed with the SMA of the first full period, then apply the EMA recurrence.
  const alpha = 2 / (period + 1)
  let previous = values.slice(0, period).reduce((a, b) => a + b, 0) / period
  result[period - 1] = previous

  for (let i = period; i < values.length; i++) {
    previous = values[i] * alpha + previous * (1 - alpha)
    result[i] = previous
  }
  return result
}

export function emaLine(candles: Candle[], period: number, field: 'close' | 'high' | 'low' = 'close') {
  const values = ema(candles.map(c => c[field]), period)
  return candles.flatMap((c, i) => values[i] == null ? [] : [{ time: c.time as any, value: values[i] as number }])
}
