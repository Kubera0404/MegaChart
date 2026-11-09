import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json({ limit: '32kb' }))

const PORT = Number(process.env.PORT || 3001)
const FYERS_HISTORY_URL = 'https://api-t1.fyers.in/data/history'

// POC endpoint: token is supplied per request and is never written to disk.
// For a deployed app, use a server-side OAuth session and secure session storage.
app.post('/api/fyers/history', async (req, res) => {
  const { symbol, resolution, token } = req.body || {}
  if (!symbol || !resolution || !token) {
    return res.status(400).json({ error: 'symbol, resolution and access token are required' })
  }

  const allowed = new Set(['1', '3', '5', '15', '60', 'D'])
  if (!allowed.has(String(resolution))) {
    return res.status(400).json({ error: 'Unsupported timeframe resolution' })
  }

  const to = Math.floor(Date.now() / 1000)
  const from = to - (resolution === 'D' ? 365 : 90) * 24 * 60 * 60
  const params = new URLSearchParams({
    symbol,
    resolution: String(resolution),
    date_format: '0',
    range_from: String(from),
    range_to: String(to),
  })

  try {
    const response = await fetch(`${FYERS_HISTORY_URL}?${params}`, {
      headers: { Authorization: `${process.env.FYERS_APP_ID || ''}:${token}` }
    })
    const payload = await response.json()
    if (!response.ok || payload.s !== 'ok') {
      return res.status(response.status || 502).json({
        error: payload.message || payload.error || 'FYERS rejected the historical data request',
        fyersCode: payload.code
      })
    }

    const candles = (payload.candles || []).map(row => ({
      time: Number(row[0]),
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5] || 0)
    }))
    return res.json({ candles })
  } catch (error) {
    console.error('FYERS history error:', error)
    return res.status(502).json({ error: 'Could not reach FYERS. Check network and API credentials.' })
  }
})

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'market-data-poc' }))
app.listen(PORT, () => console.log(`POC API listening on http://localhost:${PORT}`))
