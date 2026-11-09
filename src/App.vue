<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Activity, CandlestickChart, ChevronDown, CircleHelp, Search, Settings2, Wifi, WifiOff } from 'lucide-vue-next'
import ChartPanel from './components/ChartPanel.vue'
import { instruments } from './data/instruments'
import { makeMockCandles, seedPrices } from './lib/mockData'
import { fetchHistory } from './lib/api'
import type { Candle, Timeframe } from './types'

const selectedId = ref('nifty')
const timeframe = ref<Timeframe>('5')
const mode = ref<'mock' | 'fyers'>('mock')
const token = ref('')
const search = ref('')
const candles = ref<Candle[]>([])
const error = ref('')
const loading = ref(false)
const liveConnected = ref(false)
const showTokenDialog = ref(false)
const tokenDraft = ref('')
const selected = computed(() => instruments.find(x => x.id === selectedId.value)!)
const visibleInstruments = computed(() => instruments.filter(x => x.label.toLowerCase().includes(search.value.toLowerCase())))
const timeframeOptions: { label: string; value: Timeframe }[] = [
  { label: '1m', value: '1' }, { label: '3m', value: '3' }, { label: '5m', value: '5' },
  { label: '15m', value: '15' }, { label: '1h', value: '60' }, { label: '1D', value: 'D' }
]
const last = computed(() => candles.value.at(-1))
const change = computed(() => candles.value.length > 1 && last.value ? last.value.close - candles.value[0].open : 0)
const changePct = computed(() => candles.value.length && last.value ? change.value / candles.value[0].open * 100 : 0)
const fmt = (n?: number) => n == null ? '—' : n.toLocaleString('en-IN', { maximumFractionDigits: 2 })

async function loadChart() {
  loading.value = true
  error.value = ''
  try {
    if (mode.value === 'fyers') {
      if (!token.value.trim()) throw new Error('Enter your FYERS access token to load live historical data.')
      candles.value = await fetchHistory(selected.value.symbol, timeframe.value, token.value.trim())
    } else {
      candles.value = makeMockCandles(seedPrices[selectedId.value], timeframe.value)
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unable to load chart data'
    candles.value = []
  } finally {
    loading.value = false
  }
}

function useDemo() {
  mode.value = 'mock'
  loadChart()
}
function useFyers() {
  tokenDraft.value = token.value
  showTokenDialog.value = true
}
function connectFyers() {
  token.value = tokenDraft.value.trim()
  showTokenDialog.value = false
  mode.value = 'fyers'
  loadChart()
}

watch([selectedId, timeframe], loadChart)
onMounted(loadChart)
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand"><div class="brand-mark"><CandlestickChart :size="19" /></div><span>market<span class="brand-muted">desk</span></span><span class="poc-tag">POC</span></div>
      <div class="top-center"><span class="market-dot"></span> NSE MARKET DATA <span class="top-divider">/</span> CHART WORKSPACE</div>
      <div class="top-actions">
        <span class="connection" :class="mode === 'mock' ? 'demo' : 'pending'"><span class="status-dot"></span>{{ mode === 'mock' ? 'DEMO DATA' : 'FYERS API' }}</span>
        <button class="icon-button" title="Settings"><Settings2 :size="17" /></button>
      </div>
    </header>

    <main class="workspace">
      <aside class="watchlist">
        <div class="watchlist-heading"><div><span class="eyebrow">MARKET</span><h2>Watchlist</h2></div><span class="count">{{ instruments.length }}</span></div>
        <div class="search-box"><Search :size="15"/><input v-model="search" placeholder="Search instruments" /></div>
        <div class="watchlist-items">
          <button v-for="item in visibleInstruments" :key="item.id" class="watch-item" :class="{ active: selectedId === item.id }" @click="selectedId = item.id">
            <span class="watch-symbol">{{ item.label }}</span>
            <span class="watch-type">{{ item.kind === 'index' ? 'INDEX' : 'NSE · EQ' }}</span>
            <span class="watch-price">{{ selectedId === item.id && last ? fmt(last.close) : '—' }}</span>
            <span class="watch-change" :class="change >= 0 ? 'positive' : 'negative'">{{ selectedId === item.id && last ? `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%` : '—' }}</span>
          </button>
        </div>
        <div class="watchlist-footer"><Activity :size="14"/> Six instruments configured</div>
      </aside>

      <section class="chart-area">
        <div class="instrument-header">
          <div class="instrument-title">
            <div class="instrument-icon"><Activity :size="19"/></div>
            <div><div class="instrument-name">{{ selected.label }} <ChevronDown :size="14"/></div><div class="instrument-sub">{{ selected.symbol }} <span class="live-label">· {{ mode === 'mock' ? 'SIMULATED' : 'FYERS HISTORICAL' }}</span></div></div>
          </div>
          <div class="quote-block"><span class="quote-label">LAST CLOSE</span><strong>{{ fmt(last?.close) }}</strong><span :class="change >= 0 ? 'positive' : 'negative'">{{ change >= 0 ? '+' : '' }}{{ fmt(change) }} ({{ changePct.toFixed(2) }}%)</span></div>
          <div class="quote-block hide-small"><span class="quote-label">HIGH / LOW</span><strong>{{ fmt(last?.high) }} / {{ fmt(last?.low) }}</strong><span class="muted">Current candle</span></div>
        </div>

        <div class="chart-toolbar">
          <div class="timeframes">
            <button v-for="tf in timeframeOptions" :key="tf.value" :class="{ selected: timeframe === tf.value }" @click="timeframe = tf.value">{{ tf.label }}</button>
          </div>
          <div class="toolbar-right"><span class="toolbar-divider"></span><span class="tool-hint">Drawings & indicators are in chart toolbar</span></div>
        </div>

        <div class="chart-wrap">
          <div v-if="loading" class="chart-state">Loading candles…</div>
          <div v-else-if="error" class="chart-state error-state"><strong>Data unavailable</strong><span>{{ error }}</span><button @click="loadChart">Retry</button></div>
          <ChartPanel v-else-if="candles.length" :key="`${selectedId}-${timeframe}-${mode}`" :candles="candles" :symbol="selected.label" />
          <div v-else class="chart-state">No candle data</div>
        </div>

        <div class="bottom-strip">
          <div class="legend-item"><span class="legend-dot candle-up"></span> Bullish <span class="legend-dot candle-down"></span> Bearish</div>
          <div class="bottom-right"><span>TIMEFRAME: {{ timeframeOptions.find(x => x.value === timeframe)?.label }}</span><span>INDICATORS: 6 EMA LINES</span></div>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="footer-left"><span class="footer-dot"></span> POC ENVIRONMENT <span class="footer-separator">·</span> No orders or trading actions</div>
      <div class="footer-right"><button @click="useDemo">Use demo data</button><button class="fyers-button" @click="useFyers">Connect FYERS</button></div>
    </footer>
    <div class="disclaimer"><CircleHelp :size="13"/> Demo mode uses synthetic candles. FYERS connection currently loads historical candles; live WebSocket streaming is the next integration milestone.</div>

    <div v-if="showTokenDialog" class="modal-backdrop" @click.self="showTokenDialog = false">
      <form class="token-modal" @submit.prevent="connectFyers">
        <div class="modal-title">Connect FYERS market data</div>
        <p>Paste your FYERS API access token. It stays in this browser session and is sent to the local POC backend only when requesting history.</p>
        <label for="fyers-token">Access token</label>
        <input id="fyers-token" v-model="tokenDraft" type="password" autocomplete="off" placeholder="Paste access token" required />
        <div class="modal-actions"><button type="button" @click="showTokenDialog = false">Cancel</button><button class="fyers-button" type="submit">Load FYERS candles</button></div>
      </form>
    </div>
  </div>
</template>
