export type Timeframe = '1' | '3' | '5' | '15' | '60' | 'D'
export interface Instrument {
  id: string
  label: string
  symbol: string
  kind: 'index' | 'equity'
}
export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}
export interface Drawing {
  id: string
  type: 'horizontal' | 'rectangle'
  price?: number
  fromTime?: number
  toTime?: number
  topPrice?: number
  bottomPrice?: number
}
