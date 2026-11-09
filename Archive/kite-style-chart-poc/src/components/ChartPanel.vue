<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  CandlestickSeries, LineSeries, createChart, CrosshairMode,
  type IChartApi, type ISeriesApi, type Time, type UTCTimestamp
} from 'lightweight-charts'
import { Minus, MousePointer2, Square, Trash2 } from 'lucide-vue-next'
import type { Candle, Drawing } from '../types'
import { emaLine } from '../lib/indicators'

const props = defineProps<{ candles: Candle[]; symbol: string }>()
const host = ref<HTMLDivElement>()
const chartHost = ref<HTMLDivElement>()
const chart = ref<IChartApi>()
const candleSeries = ref<ISeriesApi<'Candlestick'>>()
const tool = ref<'cursor' | 'horizontal' | 'rectangle'>('cursor')
const drawings = ref<Drawing[]>([])
const draft = ref<{ x: number; y: number; time: number; price: number } | null>(null)
const draftEnd = ref<{ x: number; y: number; time: number; price: number } | null>(null)
const emaVisibility = ref<Record<string, boolean>>({ '9': true, '20': true, '29': true, '34': true, '50': true, '200': true, '34high': true, '34low': true })
const lineSeries: Record<string, ISeriesApi<'Line'>> = {}
const emaDefs = [
  { id: '9', label: 'EMA 9', color: '#f6c85f', field: 'close' as const },
  { id: '20', label: 'EMA 20', color: '#5dc9e8', field: 'close' as const },
  { id: '29', label: 'EMA 29', color: '#e58bdc', field: 'close' as const },
  { id: '34', label: 'EMA 34', color: '#e5e7eb', field: 'close' as const },
  { id: '50', label: 'EMA 50', color: '#f28e5b', field: 'close' as const },
  { id: '200', label: 'EMA 200', color: '#a78bfa', field: 'close' as const },
  { id: '34high', label: 'EMA 34 High', color: '#a78bfa', field: 'high' as const },
  { id: '34low', label: 'EMA 34 Low', color: '#4ade80', field: 'low' as const }
]
const drawingCount = computed(() => drawings.value.length)

function timeValue(t: Time): number {
  return typeof t === 'number' ? t : Math.floor(new Date(t as string).getTime() / 1000)
}
function coordAt(event: PointerEvent) {
  const rect = chartHost.value!.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const time = chart.value?.timeScale().coordinateToTime(x)
  const price = candleSeries.value?.coordinateToPrice(y)
  if (time == null || price == null) return null
  return { x, y, time: timeValue(time), price }
}
function onPointerDown(event: PointerEvent) {
  if (tool.value === 'cursor' || !chartHost.value) return
  const point = coordAt(event)
  if (!point) return
  event.preventDefault()
  if (tool.value === 'horizontal') {
    drawings.value.push({ id: crypto.randomUUID(), type: 'horizontal', price: point.price })
    return
  }
  draft.value = point
  draftEnd.value = point
  chartHost.value.setPointerCapture(event.pointerId)
}
function onPointerMove(event: PointerEvent) {
  if (!draft.value) return
  const point = coordAt(event)
  if (point) draftEnd.value = point
}
function onPointerUp() {
  if (!draft.value || !draftEnd.value) return
  drawings.value.push({
    id: crypto.randomUUID(), type: 'rectangle',
    fromTime: Math.min(draft.value.time, draftEnd.value.time),
    toTime: Math.max(draft.value.time, draftEnd.value.time),
    topPrice: Math.max(draft.value.price, draftEnd.value.price),
    bottomPrice: Math.min(draft.value.price, draftEnd.value.price)
  })
  draft.value = null
  draftEnd.value = null
}
function removeDrawings() { drawings.value = [] }

function drawOverlay() {
  // Drawing coordinates are resolved by the chart library in the template.
}
function initChart() {
  if (!chartHost.value) return
  chart.value = createChart(chartHost.value, {
    autoSize: true,
    layout: { background: { color: '#10151d' }, textColor: '#9aa7b7', fontFamily: 'Inter, system-ui, sans-serif' },
    grid: { vertLines: { color: '#202936' }, horzLines: { color: '#202936' } },
    crosshair: { mode: CrosshairMode.Normal, vertLine: { color: '#65758b', labelBackgroundColor: '#344256' }, horzLine: { color: '#65758b', labelBackgroundColor: '#344256' } },
    rightPriceScale: { borderColor: '#2b3543', scaleMargins: { top: 0.12, bottom: 0.12 } },
    timeScale: { borderColor: '#2b3543', timeVisible: true, secondsVisible: false, rightOffset: 8 },
    localization: { locale: 'en-IN' }
  })
  candleSeries.value = chart.value.addSeries(CandlestickSeries, {
    upColor: '#22c58b', downColor: '#f05b67',
    borderUpColor: '#22c58b', borderDownColor: '#f05b67',
    wickUpColor: '#22c58b', wickDownColor: '#f05b67'
  })
  candleSeries.value.setData(props.candles.map(c => ({
    time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close
  })))
  emaDefs.forEach(def => {
    const series = chart.value!.addSeries(LineSeries, {
      color: def.color, lineWidth: def.id === '34high' || def.id === '34low' ? 2 : 1,
      priceLineVisible: false, lastValueVisible: true, crosshairMarkerVisible: false,
      visible: emaVisibility.value[def.id]
    })
    series.setData(emaLine(props.candles, def.id === '34high' || def.id === '34low' ? 34 : Number(def.id), def.field))
    lineSeries[def.id] = series
  })
  chart.value.timeScale().fitContent()
}
function updateVisibility(id: string) {
  emaVisibility.value[id] = !emaVisibility.value[id]
  lineSeries[id]?.applyOptions({ visible: emaVisibility.value[id] })
}
function priceY(price: number) { return candleSeries.value?.priceToCoordinate(price) ?? null }
function timeX(time: number) { return chart.value?.timeScale().timeToCoordinate(time as UTCTimestamp) ?? null }
function rectFor(d: Drawing) {
  if (d.type !== 'rectangle' || d.fromTime == null || d.toTime == null || d.topPrice == null || d.bottomPrice == null) return null
  const x1 = timeX(d.fromTime), x2 = timeX(d.toTime)
  const y1 = priceY(d.topPrice), y2 = priceY(d.bottomPrice)
  if (x1 == null || x2 == null || y1 == null || y2 == null) return null
  return { x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.max(1, Math.abs(x2 - x1)), height: Math.max(1, Math.abs(y2 - y1)) }
}
onMounted(initChart)
onBeforeUnmount(() => chart.value?.remove())
watch(() => props.candles, () => {
  if (!chart.value || !candleSeries.value) return
  candleSeries.value.setData(props.candles.map(c => ({ time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close })))
  emaDefs.forEach(def => lineSeries[def.id]?.setData(emaLine(props.candles, def.id === '34high' || def.id === '34low' ? 34 : Number(def.id), def.field)))
  chart.value.timeScale().fitContent()
})
</script>

<template>
  <div class="chart-panel" ref="host">
    <div class="chart-meta"><div><strong>{{ symbol }}</strong><span> · OHLC candles</span></div><div class="chart-meta-right">EMA overlays <span class="meta-separator">·</span> {{ drawingCount }} drawings</div></div>
    <div class="ema-controls">
      <button v-for="def in emaDefs" :key="def.id" class="ema-chip" :class="{ disabled: !emaVisibility[def.id] }" @click="updateVisibility(def.id)">
        <i :style="{ background: def.color }"></i>{{ def.label }}
      </button>
    </div>
    <div class="drawing-toolbar">
      <span class="toolbar-label">DRAW</span>
      <button :class="{ active: tool === 'cursor' }" title="Cursor" @click="tool = 'cursor'"><MousePointer2 :size="15"/> Cursor</button>
      <button :class="{ active: tool === 'horizontal' }" title="Horizontal line" @click="tool = 'horizontal'"><Minus :size="15"/> Horizontal</button>
      <button :class="{ active: tool === 'rectangle' }" title="Rectangle" @click="tool = 'rectangle'"><Square :size="14"/> Rectangle</button>
      <button class="clear-tool" title="Clear drawings" @click="removeDrawings"><Trash2 :size="14"/> Clear</button>
    </div>
    <div class="chart-canvas" ref="chartHost"
      :class="{ drawing: tool !== 'cursor' }"
      @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerUp">
      <svg class="drawing-overlay">
        <g v-for="d in drawings" :key="d.id">
          <line v-if="d.type === 'horizontal' && d.price != null && priceY(d.price) != null"
            x1="0" :y1="priceY(d.price)!" x2="100%" :y2="priceY(d.price)!"
            stroke="#e8c66a" stroke-width="1.5" stroke-dasharray="5 4"/>
          <rect v-else-if="d.type === 'rectangle' && rectFor(d)" :x="rectFor(d)!.x" :y="rectFor(d)!.y"
            :width="rectFor(d)!.width" :height="rectFor(d)!.height"
            fill="rgba(232,198,106,0.04)" stroke="#e8c66a" stroke-width="1.5"/>
        </g>
        <rect v-if="draft && draftEnd" :x="Math.min(draft.x, draftEnd.x)" :y="Math.min(draft.y, draftEnd.y)"
          :width="Math.abs(draftEnd.x-draft.x)" :height="Math.abs(draftEnd.y-draft.y)"
          fill="rgba(232,198,106,0.04)" stroke="#e8c66a" stroke-dasharray="4 3"/>
      </svg>
      <div v-if="tool !== 'cursor'" class="drawing-tip">Click to place a horizontal line · Drag to draw a rectangle</div>
    </div>
  </div>
</template>
