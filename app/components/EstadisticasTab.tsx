'use client'
import { useState, useEffect } from 'react'

interface Props {
  restaurante: any
  fondo: string
  texto: string
  borde: string
  primario: string
  textoSec: string
  fondoClaro: boolean
}

const ESTADOS_LABEL: Record<string, { label: string; color: string }> = {
  recibido:         { label: 'Recibido',         color: '#64748b' },
  diagnostico:      { label: 'Diagnóstico',       color: '#f59e0b' },
  esperando_piezas: { label: 'Esperando piezas',  color: '#f97316' },
  reparacion:       { label: 'En reparación',     color: '#3b82f6' },
  terminado:        { label: 'Terminado',          color: '#8b5cf6' },
}

const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function fmtEur(n: number) {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

function Sparkline({ values, color, height = 40 }: { values: number[]; color: string; height?: number }) {
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const w = 100
  const h = height
  const step = w / (values.length - 1)
  const points = values.map((v, i) => `${i * step},${h - (v / max) * (h - 4) - 2}`).join(' ')
  const areaPoints = `0,${h} ${points} ${w},${h}`
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color.replace('#','')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BarChart({ data, color, height = 120 }: { data: { label: string; value: number }[]; color: string; height?: number }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1 w-full" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div className="w-full rounded-t-sm transition-all relative group" style={{
            height: `${Math.max((d.value / max) * (height - 20), d.value > 0 ? 4 : 0)}px`,
            background: d.value > 0 ? color : 'transparent',
            minHeight: d.value > 0 ? 4 : 0,
          }}>
            {d.value > 0 && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-xs rounded px-1.5 py-0.5 whitespace-nowrap z-10">
                {d.value}
              </div>
            )}
          </div>
          <p className="text-center leading-none" style={{ fontSize: 9, color: '#94a3b8' }}>{d.label}</p>
        </div>
      ))}
    </div>
  )
}

function BarChartH({ data, colorFn }: { data: [string, number][]; colorFn?: (k: string) => string }) {
  const max = Math.max(...data.map(d => d[1]), 1)
  return (
    <div className="space-y-2">
      {data.map(([key, val]) => (
        <div key={key} className="flex items-center gap-2">
          <p className="text-xs truncate w-32 flex-shrink-0" style={{ color: '#64748b' }}>{key}</p>
          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{
              width: `${(val / max) * 100}%`,
              background: colorFn ? colorFn(key) : '#3b82f6',
            }} />
          </div>
          <p className="text-xs font-semibold w-6 text-right flex-shrink-0" style={{ color: '#334155' }}>{val}</p>
        </div>
      ))}
    </div>
  )
}

function Delta({ actual, anterior, inverted = false }: { actual: number; anterior: number; inverted?: boolean }) {
  if (anterior === 0) return null
  const pct = Math.round(((actual - anterior) / anterior) * 100)
  const positivo = inverted ? pct < 0 : pct > 0
  if (pct === 0) return <span className="text-xs text-slate-400">= igual que el mes pasado</span>
  return (
    <span className="text-xs font-medium" style={{ color: positivo ? '#10b981' : '#ef4444' }}>
      {pct > 0 ? '↑' : '↓'} {Math.abs(pct)}% vs mes anterior
    </span>
  )
}

export default function EstadisticasTab({ restaurante, fondo, texto, borde, primario, textoSec, fondoClaro }: Props) {
  const [stats, setStats] = useState<any>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetch(`/api/stats?restaurant_id=${restaurante.id}`)
      .then(r => r.json())
      .then(d => { setStats(d); setCargando(false) })
  }, [restaurante.id])

  if (cargando) {
    return (
      <div className="flex items-center gap-3 py-12">
        <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: primario, borderTopColor: 'transparent' }} />
        <p className="text-sm" style={{ color: textoSec }}>Calculando estadísticas…</p>
      </div>
    )
  }

  if (!stats) return null

  const mesesLabels = Object.keys(stats.ingresosPorMes).map(k => {
    const [, m] = k.split('-')
    return MESES_CORTO[parseInt(m) - 1]
  })
  const ingresosValues = Object.values(stats.ingresosPorMes) as number[]
  const ordenesValues = Object.values(stats.ordenesPorMes) as number[]

  const barIngresosData = mesesLabels.map((label, i) => ({ label, value: Math.round(ingresosValues[i]) }))
  const barOrdenesData = mesesLabels.map((label, i) => ({ label, value: ordenesValues[i] }))

  const totalOrdenesActivas = Object.values(stats.porEstado).reduce((a: number, b: any) => a + b, 0) as number

  return (
    <div className="space-y-4 max-w-4xl">

      {/* KPIs principales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Ingresos este mes',
            value: fmtEur(stats.ingresosMes),
            sub: <Delta actual={stats.ingresosMes} anterior={stats.ingresosMesAnt} />,
            spark: ingresosValues,
            color: primario,
          },
          {
            label: 'Órdenes este mes',
            value: stats.ordenesMes,
            sub: <Delta actual={stats.ordenesMes} anterior={stats.ordenesMesAnt} />,
            spark: ordenesValues,
            color: '#3b82f6',
          },
          {
            label: 'En taller ahora',
            value: totalOrdenesActivas,
            sub: <span className="text-xs" style={{ color: textoSec }}>órdenes activas</span>,
            spark: null,
            color: '#f59e0b',
            icon: '🔧',
          },
          {
            label: 'Presup. pendientes',
            value: stats.presupuestosPendientes,
            sub: <span className="text-xs" style={{ color: textoSec }}>sin respuesta</span>,
            spark: null,
            color: '#8b5cf6',
            icon: '📋',
          },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-2xl p-4 overflow-hidden relative" style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : fondo }}>
            <p className="text-xs font-medium mb-1" style={{ color: textoSec }}>{kpi.label}</p>
            <p className="text-2xl font-bold mb-1" style={{ color: texto }}>{kpi.value}</p>
            <div>{kpi.sub}</div>
            {kpi.spark && (
              <div className="absolute bottom-0 left-0 right-0 opacity-60">
                <Sparkline values={kpi.spark} color={kpi.color} height={32} />
              </div>
            )}
            {kpi.icon && (
              <div className="absolute top-3 right-3 text-2xl opacity-20">{kpi.icon}</div>
            )}
          </div>
        ))}
      </div>

      {/* Métricas secundarias */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total órdenes históricas', value: stats.totalOrdenes, icon: '📁' },
          { label: 'Tiempo medio reparación', value: stats.tiempoMedio > 0 ? `${stats.tiempoMedio} días` : '—', icon: '⏱' },
          { label: 'Conversión presupuestos', value: `${stats.tasaConversion}%`, icon: '🎯' },
        ].map(m => (
          <div key={m.label} className="rounded-2xl p-4 flex items-center gap-3" style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : fondo }}>
            <span className="text-2xl">{m.icon}</span>
            <div>
              <p className="text-xl font-bold" style={{ color: texto }}>{m.value}</p>
              <p className="text-xs" style={{ color: textoSec }}>{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico ingresos */}
      <div className="rounded-2xl p-5" style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : fondo }}>
        <div className="flex justify-between items-baseline mb-4">
          <p className="text-sm font-semibold" style={{ color: texto }}>Ingresos — últimos 12 meses</p>
          <p className="text-xs" style={{ color: textoSec }}>
            Total: {fmtEur(ingresosValues.reduce((a, b) => a + b, 0))}
          </p>
        </div>
        <BarChart data={barIngresosData} color={primario} height={130} />
      </div>

      {/* Gráfico órdenes */}
      <div className="rounded-2xl p-5" style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : fondo }}>
        <div className="flex justify-between items-baseline mb-4">
          <p className="text-sm font-semibold" style={{ color: texto }}>Órdenes recibidas — últimos 12 meses</p>
          <p className="text-xs" style={{ color: textoSec }}>
            Total: {ordenesValues.reduce((a, b) => a + b, 0)}
          </p>
        </div>
        <BarChart data={barOrdenesData} color="#3b82f6" height={100} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Órdenes por estado */}
        <div className="rounded-2xl p-5" style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : fondo }}>
          <p className="text-sm font-semibold mb-4" style={{ color: texto }}>Taller en este momento</p>
          {totalOrdenesActivas === 0 ? (
            <p className="text-xs" style={{ color: textoSec }}>No hay órdenes activas</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(stats.porEstado).map(([estado, n]: [string, any]) => {
                const info = ESTADOS_LABEL[estado]
                if (!info || n === 0) return null
                const pct = Math.round((n / totalOrdenesActivas) * 100)
                return (
                  <div key={estado}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: info.color }}>{info.label}</span>
                      <span className="font-semibold" style={{ color: texto }}>{n} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: fondoClaro ? '#f1f5f9' : 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: info.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top servicios */}
        <div className="rounded-2xl p-5" style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : fondo }}>
          <p className="text-sm font-semibold mb-4" style={{ color: texto }}>Servicios más frecuentes</p>
          {stats.topServicios.length === 0 ? (
            <p className="text-xs" style={{ color: textoSec }}>Sin datos de servicios todavía</p>
          ) : (
            <BarChartH
              data={stats.topServicios}
              colorFn={() => primario}
            />
          )}
        </div>
      </div>
    </div>
  )
}
