# Market Desk — Kite-style Chart POC

A Vue 3 + TypeScript charting POC with a Kite-inspired layout, six instruments, six timeframes, EMA overlays, and basic chart drawings.

## Included

- Watchlist: NIFTY 50, BANK NIFTY, RELIANCE, ICICI BANK, BHARTI AIRTEL, HDFC BANK
- Timeframes: 1m, 3m, 5m, 15m, 1h, 1D
- Close EMAs: 9, 20, 29, 34, 50, 200
- EMA 34 High (purple) and EMA 34 Low (green), without a filled area
- Horizontal price line and rectangle drawing tools
- Demo candle generator
- FYERS historical candle REST adapter (manual token entry)
- No order placement or trading functionality

## Requirements

- Node.js 20+ recommended
- npm

## Run

```bash
npm install
cp .env.example .env
```

Put your FYERS App ID in `.env`:

```env
FYERS_APP_ID=YOUR_APP_ID
PORT=3001
```

Start both frontend and API:

```bash
npm run dev
```

Open http://localhost:5173.

The POC opens in DEMO DATA mode. The Connect FYERS button opens a manual access-token dialog and requests historical candles through the local backend. The token is kept in browser memory only. To test the endpoint directly, POST to `/api/fyers/history`:

```json
{
  "symbol": "NSE:RELIANCE-EQ",
  "resolution": "5",
  "token": "YOUR_ACCESS_TOKEN"
}
```

## Important FYERS setup notes

1. Create an API application in the FYERS developer dashboard.
2. Complete FYERS authentication and obtain a valid access token.
3. Confirm the exact index and equity symbols against the current FYERS Symbol Master.
4. Add the FYERS App ID to `.env`.
5. Use only your own authorized API credentials. Never commit `.env` or expose the app secret/access token in client-side source.

## Current POC limitations

- Demo mode uses synthetic data, not real market prices.
- FYERS historical REST adapter and manual token-entry UI are implemented; live Data Socket streaming is not yet wired into the screen.
- No automatic reconnect or live candle aggregation yet.
- The rectangle tool is a chart-overlay drawing and is intended for a first POC pass; production-grade anchoring/editing/persistence needs another pass.
- Index symbols should be checked against FYERS' latest Symbol Master before enabling live mode.
- Check current FYERS API plans, symbol subscription limits, authentication requirements and rate limits for your account.

## Next implementation milestone

1. Add a secure FYERS token-entry/session flow.
2. Add FYERS Data Socket subscription for all six symbols.
3. Aggregate incoming ticks into 1m/3m/5m/15m/1h/1D OHLC candles.
4. Update the latest candle incrementally rather than replacing the entire chart.
5. Add drawing selection, drag/edit and local persistence.
