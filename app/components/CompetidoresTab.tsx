'use client'
import { useState, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Competidor { id: string; nombre: string; url: string; color: string }

interface Analisis {
  https: boolean; metaTitulo: boolean; metaTituloTexto: string; metaTituloLen: number
  metaDesc: boolean; metaDescTexto: string; metaDescLen: number
  h1: boolean; h1Texto: string; schemaLocalBusiness: boolean; schemaFAQ: boolean
  schemaBreadcrumb: boolean; totalSchemas: number; openGraph: boolean
  viewport: boolean; canonical: boolean; faqSection: boolean
  phoneVisible: boolean; addressVisible: boolean; googleMaps: boolean
  whatsapp: boolean; social: boolean; reviews: boolean
  seoScore: number; geoScore: number
  radar: { metatags: number; schema: number; tecnico: number; contenido: number; geo: number; local: number }
  error: string | null
}

type EstadoAnalisis = 'pendiente' | 'analizando' | 'ok' | 'error'

interface Props {
  restaurante: any; fondo: string; texto: string; borde: string; primario: string
  boton: string; botonTexto: string; textoSec: string; fondoClaro: boolean
}

// ── Palette ───────────────────────────────────────────────────────────────────
const PALETTE = ['#ef4444','#f97316','#eab308','#10b981','#06b6d4','#8b5cf6','#ec4899','#64748b','#84cc16','#f43f5e']

// ── Score color ───────────────────────────────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 75) return '#10b981'
  if (s >= 50) return '#f59e0b'
  return '#ef4444'
}

function scoreLabel(s: number) {
  if (s >= 80) return 'Excelente'
  if (s >= 60) return 'Bueno'
  if (s >= 40) return 'Regular'
  return 'Débil'
}

// ── Score Ring SVG ────────────────────────────────────────────────────────────
function ScoreRing({ score, color, size = 80, label }: { score: number; color: string; size?: number; label?: string }) {
  const r = size * 0.38
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e2e8f0" strokeWidth={size / 9} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={size / 9} fill="none"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="middle"
          fontSize={size / 3.8} fontWeight="bold" fill={color}>{score}</text>
      </svg>
      {label && <p className="text-xs font-medium" style={{ color }}>{label}</p>}
    </div>
  )
}

// ── Radar Chart SVG ───────────────────────────────────────────────────────────
const RADAR_AXES = ['Meta Tags', 'Schema', 'Técnico', 'Contenido', 'GEO', 'Local']

function RadarChart({ items }: { items: { nombre: string; color: string; values: number[] }[] }) {
  const W = 340, H = 340, CX = 170, CY = 170, R = 120, N = 6
  const levels = [0.25, 0.5, 0.75, 1]

  function angleFor(i: number) { return (i * 2 * Math.PI / N) - Math.PI / 2 }
  function pt(val: number, i: number) {
    const a = angleFor(i), r2 = (val / 100) * R
    return { x: CX + r2 * Math.cos(a), y: CY + r2 * Math.sin(a) }
  }
  function axisPt(i: number, scale = 1) {
    const a = angleFor(i)
    return { x: CX + R * scale * Math.cos(a), y: CY + R * scale * Math.sin(a) }
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xs mx-auto">
      {/* Grid rings */}
      {levels.map((l, li) => {
        const pts = Array.from({ length: N }, (_, i) => {
          const a = angleFor(i)
          return `${CX + R * l * Math.cos(a)},${CY + R * l * Math.sin(a)}`
        }).join(' ')
        return <polygon key={li} points={pts} fill="none" stroke="#e2e8f0" strokeWidth={li === 3 ? 1.5 : 1} />
      })}
      {/* Axis lines */}
      {Array.from({ length: N }, (_, i) => {
        const end = axisPt(i)
        return <line key={i} x1={CX} y1={CY} x2={end.x} y2={end.y} stroke="#e2e8f0" strokeWidth="1" />
      })}
      {/* Data polygons */}
      {items.map(d => {
        const pts = d.values.map((v, i) => { const p = pt(v, i); return `${p.x},${p.y}` }).join(' ')
        return (
          <g key={d.nombre}>
            <polygon points={pts} fill={d.color + '22'} stroke={d.color} strokeWidth="2.5" strokeLinejoin="round" />
            {d.values.map((v, i) => {
              const p = pt(v, i)
              return <circle key={i} cx={p.x} cy={p.y} r="4" fill={d.color} stroke="white" strokeWidth="1.5" />
            })}
          </g>
        )
      })}
      {/* Axis labels */}
      {RADAR_AXES.map((label, i) => {
        const lp = axisPt(i, 1.22)
        return (
          <text key={label} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="11" fontWeight="600" fill="#64748b">{label}</text>
        )
      })}
    </svg>
  )
}

// ── Signal badge ──────────────────────────────────────────────────────────────
function Signal({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-base leading-none">{ok ? '✅' : '❌'}</span>
      <span className="text-xs" style={{ color: ok ? '#10b981' : '#ef4444' }}>{label}</span>
    </div>
  )
}

// ── Bar comparison ────────────────────────────────────────────────────────────
function ScoreBar({ score, color, nombre, max = 100 }: { score: number; color: string; nombre: string; max?: number }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <p className="text-xs font-medium w-28 truncate flex-shrink-0" style={{ color: '#374151' }}>{nombre}</p>
      <div className="flex-1 h-5 rounded-full overflow-hidden bg-gray-100">
        <div className="h-5 rounded-full flex items-center justify-end pr-2 transition-all"
          style={{ width: `${(score / max) * 100}%`, background: color, minWidth: 24 }}>
          <span className="text-xs font-bold text-white leading-none">{score}</span>
        </div>
      </div>
      <p className="text-xs w-16 text-right flex-shrink-0" style={{ color }}>{scoreLabel(score)}</p>
    </div>
  )
}

// ── Leaderboard row ───────────────────────────────────────────────────────────
function LeaderRow({ rank, nombre, color, seo, geo, propio }: { rank: number; nombre: string; color: string; seo: number; geo: number; propio: boolean }) {
  const overall = Math.round((seo + geo) / 2)
  const medals = ['🥇', '🥈', '🥉']
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{ background: propio ? color + '12' : 'transparent', border: propio ? `1px solid ${color}30` : '1px solid transparent' }}>
      <span className="text-lg w-7 text-center">{medals[rank - 1] || `${rank}º`}</span>
      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
      <p className="flex-1 text-sm font-semibold truncate" style={{ color: propio ? color : '#111' }}>
        {nombre}{propio ? ' (tú)' : ''}
      </p>
      <div className="flex gap-4 flex-shrink-0 text-xs">
        <span className="font-bold" style={{ color: scoreColor(seo) }}>SEO {seo}</span>
        <span className="font-bold" style={{ color: scoreColor(geo) }}>GEO {geo}</span>
        <span className="font-bold w-14 text-right" style={{ color: scoreColor(overall) }}>{overall} pts</span>
      </div>
    </div>
  )
}

// ── Signal matrix cell ────────────────────────────────────────────────────────
function MatrixCell({ ok, secondary }: { ok: boolean; secondary?: boolean }) {
  return (
    <div className="flex items-center justify-center h-10">
      {ok
        ? <span className="text-lg">{secondary ? '⚠️' : '✅'}</span>
        : <span className="text-lg">❌</span>
      }
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CompetidoresTab({ restaurante, fondo, texto, borde, primario, boton, botonTexto, textoSec, fondoClaro }: Props) {
  const bg = fondoClaro ? '#fff' : 'rgba(255,255,255,0.04)'
  const bgSec = fondoClaro ? '#f8fafc' : 'rgba(255,255,255,0.02)'

  const [paso, setPaso] = useState<'configurar' | 'analizando' | 'resultados'>('configurar')
  const [tuUrl, setTuUrl] = useState(restaurante?.web || '')
  const [competidores, setCompetidores] = useState<Competidor[]>([
    { id: '1', nombre: 'Competidor 1', url: '', color: PALETTE[0] },
    { id: '2', nombre: 'Competidor 2', url: '', color: PALETTE[1] },
    { id: '3', nombre: 'Competidor 3', url: '', color: PALETTE[2] },
  ])
  const [estados, setEstados] = useState<Record<string, EstadoAnalisis>>({})
  const [resultados, setResultados] = useState<Record<string, Analisis>>({})
  const [vistaResultados, setVistaResultados] = useState<'general' | 'seo' | 'geo' | 'radar'>('general')

  function addCompetidor() {
    if (competidores.length >= 10) return
    const id = Date.now().toString()
    setCompetidores(prev => [...prev, {
      id, nombre: `Competidor ${prev.length + 1}`, url: '', color: PALETTE[prev.length % PALETTE.length]
    }])
  }

  function removeCompetidor(id: string) {
    setCompetidores(prev => prev.filter(c => c.id !== id))
  }

  function updateCompetidor(id: string, campo: 'nombre' | 'url', val: string) {
    setCompetidores(prev => prev.map(c => c.id === id ? { ...c, [campo]: val } : c))
  }

  const allToAnalyze = [
    { id: '__mi_taller__', nombre: restaurante?.nombre || 'Mi taller', url: tuUrl, color: primario, propio: true },
    ...competidores.filter(c => c.url.trim()).map(c => ({ ...c, propio: false })),
  ].filter(c => c.url.trim())

  async function analizar() {
    if (allToAnalyze.length < 2) return
    setPaso('analizando')
    const initEstados: Record<string, EstadoAnalisis> = {}
    allToAnalyze.forEach(c => { initEstados[c.id] = 'pendiente' })
    setEstados(initEstados)
    setResultados({})

    for (const comp of allToAnalyze) {
      setEstados(prev => ({ ...prev, [comp.id]: 'analizando' }))
      try {
        const res = await fetch('/api/analisis/competidor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: comp.url }),
        })
        const data = await res.json()
        setResultados(prev => ({ ...prev, [comp.id]: data }))
        setEstados(prev => ({ ...prev, [comp.id]: data.error ? 'error' : 'ok' }))
      } catch {
        setResultados(prev => ({ ...prev, [comp.id]: { error: 'Error de conexión', seoScore: 0, geoScore: 0, radar: { metatags: 0, schema: 0, tecnico: 0, contenido: 0, geo: 0, local: 0 } } as any }))
        setEstados(prev => ({ ...prev, [comp.id]: 'error' }))
      }
    }
    setPaso('resultados')
  }

  // Items with results
  const itemsConResultados = allToAnalyze
    .filter(c => resultados[c.id])
    .map(c => ({ ...c, analisis: resultados[c.id] }))
    .sort((a, b) => {
      const scoreA = (a.analisis.seoScore + a.analisis.geoScore) / 2
      const scoreB = (b.analisis.seoScore + b.analisis.geoScore) / 2
      return scoreB - scoreA
    })

  const miTaller = itemsConResultados.find(c => c.id === '__mi_taller__')
  const competitors = itemsConResultados.filter(c => c.id !== '__mi_taller__')

  // SEO signals config
  const SEO_SIGNALS = [
    { key: 'https', label: 'HTTPS', pts: 15 },
    { key: 'metaTitulo', label: 'Meta título', pts: 15 },
    { key: 'metaDesc', label: 'Meta descripción', pts: 15 },
    { key: 'h1', label: 'H1 tag', pts: 15 },
    { key: 'openGraph', label: 'Open Graph', pts: 10 },
    { key: 'viewport', label: 'Mobile viewport', pts: 10 },
    { key: 'schemaLocalBusiness', label: 'Schema AutoRepair', pts: 20 },
    { key: 'canonical', label: 'Canonical URL', pts: 5 },
  ] as const

  const GEO_SIGNALS = [
    { key: 'schemaLocalBusiness', label: 'Schema LocalBusiness', pts: 30 },
    { key: 'schemaFAQ', label: 'Schema FAQPage', pts: 25 },
    { key: 'faqSection', label: 'Sección FAQ', pts: 10 },
    { key: 'phoneVisible', label: 'Teléfono visible', pts: 10 },
    { key: 'addressVisible', label: 'Dirección visible', pts: 10 },
    { key: 'googleMaps', label: 'Google Maps embed', pts: 10 },
    { key: 'reviews', label: 'Reseñas/valoraciones', pts: 5 },
  ] as const

  // ── PASO: CONFIGURAR ──────────────────────────────────────────────────────
  if (paso === 'configurar') return (
    <div>
      <p className="text-sm mb-6" style={{ color: textoSec }}>
        Introduce la URL de tu web y las de hasta 10 competidores. Analizaremos su posicionamiento SEO y GEO y lo compararemos visualmente.
      </p>

      {/* Mi taller */}
      <div className="rounded-2xl p-5 mb-4" style={{ border: `2px solid ${primario}`, background: bg }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-4 h-4 rounded-full" style={{ background: primario }} />
          <p className="text-sm font-bold" style={{ color: primario }}>Tu taller — {restaurante?.nombre || 'Mi taller'}</p>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: primario + '18', color: primario }}>TÚ</span>
        </div>
        <input value={tuUrl} onChange={e => setTuUrl(e.target.value)}
          placeholder="https://tu-taller.com"
          className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none bg-transparent"
          style={{ border: `1px solid ${borde}`, color: texto }} />
        {!tuUrl && (
          <p className="text-xs mt-2" style={{ color: '#f59e0b' }}>⚠️ Añade tu web para compararte con los competidores</p>
        )}
      </div>

      {/* Competidores */}
      <div className="space-y-3 mb-4">
        {competidores.map((c, idx) => (
          <div key={c.id} className="rounded-2xl p-4" style={{ border: `1px solid ${borde}`, background: bg }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: c.color }} />
              <input value={c.nombre} onChange={e => updateCompetidor(c.id, 'nombre', e.target.value)}
                className="flex-1 text-sm font-semibold bg-transparent focus:outline-none"
                style={{ color: texto, borderBottom: `1px solid ${borde}` }}
                placeholder={`Competidor ${idx + 1}`} />
              <button onClick={() => removeCompetidor(c.id)}
                className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
                style={{ color: '#ef4444', border: '1px solid #fecaca' }}>✕</button>
            </div>
            <div className="flex gap-2">
              <input value={c.url} onChange={e => updateCompetidor(c.id, 'url', e.target.value)}
                placeholder="https://tallercompetidor.com"
                className="flex-1 text-sm rounded-xl px-3 py-2 focus:outline-none bg-transparent"
                style={{ border: `1px solid ${borde}`, color: texto }} />
              {!c.url && (
                <a href={`https://www.google.com/search?q=taller+mecanico+${encodeURIComponent(restaurante?.ciudad_fiscal || '')}`}
                  target="_blank" rel="noopener"
                  className="flex-shrink-0 text-xs px-3 py-2 rounded-xl"
                  style={{ border: `1px solid ${borde}`, color: textoSec }}>
                  🔍 Buscar
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add competitor */}
      {competidores.length < 10 && (
        <button onClick={addCompetidor}
          className="w-full py-3 rounded-2xl text-sm font-semibold mb-6 border-dashed border-2 transition-all hover:opacity-80"
          style={{ borderColor: borde, color: textoSec }}>
          + Añadir competidor ({competidores.length}/10)
        </button>
      )}

      {/* Analyze button */}
      <button onClick={analizar}
        disabled={allToAnalyze.length < 2}
        className="w-full py-4 rounded-2xl text-sm font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-3"
        style={{ background: boton, color: botonTexto }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        Analizar {allToAnalyze.length} webs
      </button>
      {allToAnalyze.length < 2 && (
        <p className="text-xs text-center mt-2" style={{ color: textoSec }}>Necesitas al menos tu web + 1 competidor con URL</p>
      )}
    </div>
  )

  // ── PASO: ANALIZANDO ──────────────────────────────────────────────────────
  if (paso === 'analizando') {
    const done = Object.values(estados).filter(e => e === 'ok' || e === 'error').length
    const total = allToAnalyze.length
    return (
      <div>
        <div className="rounded-2xl p-6 mb-4" style={{ border: `1px solid ${borde}`, background: bg }}>
          <p className="text-sm font-bold mb-1" style={{ color: texto }}>Analizando webs…</p>
          <p className="text-xs mb-4" style={{ color: textoSec }}>{done} de {total} completados</p>
          <div className="h-2 rounded-full mb-6" style={{ background: borde }}>
            <div className="h-2 rounded-full transition-all" style={{ width: `${(done / total) * 100}%`, background: primario }} />
          </div>
          <div className="space-y-3">
            {allToAnalyze.map(c => {
              const st = estados[c.id] || 'pendiente'
              return (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: bgSec, border: `1px solid ${borde}` }}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <p className="flex-1 text-sm font-medium truncate" style={{ color: texto }}>{c.nombre}</p>
                  <p className="text-xs flex-shrink-0 truncate max-w-32" style={{ color: textoSec }}>{c.url}</p>
                  <div className="flex-shrink-0 w-24 text-right">
                    {st === 'pendiente' && <span className="text-xs" style={{ color: textoSec }}>En espera…</span>}
                    {st === 'analizando' && (
                      <span className="inline-flex items-center gap-1 text-xs" style={{ color: primario }}>
                        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                        </svg>
                        Analizando
                      </span>
                    )}
                    {st === 'ok' && <span className="text-xs text-green-600 font-semibold">✓ Listo</span>}
                    {st === 'error' && <span className="text-xs text-red-500">✗ Error</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── PASO: RESULTADOS ──────────────────────────────────────────────────────
  const radarItems = itemsConResultados.map(c => ({
    nombre: c.nombre,
    color: c.color,
    values: [
      c.analisis.radar.metatags,
      c.analisis.radar.schema,
      c.analisis.radar.tecnico,
      c.analisis.radar.contenido,
      c.analisis.radar.geo,
      c.analisis.radar.local,
    ],
  }))

  // Ventajas vs competidores
  const ventajas = miTaller ? SEO_SIGNALS.filter(s => {
    const miVal = (miTaller.analisis as any)[s.key]
    return miVal && competitors.some(c => !(c.analisis as any)[s.key])
  }) : []

  const debilidades = miTaller ? SEO_SIGNALS.filter(s => {
    const miVal = (miTaller.analisis as any)[s.key]
    return !miVal && competitors.some(c => (c.analisis as any)[s.key])
  }) : []

  return (
    <div>
      {/* Header con botón nueva búsqueda */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <p className="text-xs tracking-widest uppercase font-semibold mb-0.5" style={{ color: textoSec }}>Análisis completado</p>
          <p className="text-sm" style={{ color: textoSec }}>{itemsConResultados.length} webs analizadas</p>
        </div>
        <button onClick={() => { setPaso('configurar'); setResultados({}); setEstados({}) }}
          className="text-xs px-4 py-2 rounded-xl font-semibold"
          style={{ border: `1px solid ${borde}`, color: textoSec }}>
          ← Nueva búsqueda
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {([
          { key: 'general', label: '🏆 General', desc: 'Rankings' },
          { key: 'seo', label: '🔍 SEO', desc: 'Señales' },
          { key: 'geo', label: '🌐 GEO', desc: 'Señales' },
          { key: 'radar', label: '📡 Radar', desc: 'Comparativa' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setVistaResultados(t.key)}
            className="flex flex-col items-start px-4 py-2.5 rounded-xl whitespace-nowrap flex-shrink-0 transition-all"
            style={{
              background: vistaResultados === t.key ? primario : bg,
              color: vistaResultados === t.key ? botonTexto : texto,
              border: `1px solid ${vistaResultados === t.key ? primario : borde}`,
            }}>
            <span className="text-sm font-semibold">{t.label}</span>
            <span className="text-xs opacity-70">{t.desc}</span>
          </button>
        ))}
      </div>

      {/* ── GENERAL ────────────────────────────────────────────────────────── */}
      {vistaResultados === 'general' && (
        <div className="space-y-5">
          {/* Score cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {itemsConResultados.map(c => (
              <div key={c.id} className="rounded-2xl p-4 flex flex-col items-center text-center"
                style={{ border: `2px solid ${c.id === '__mi_taller__' ? c.color : borde}`, background: bg }}>
                <div className="w-3 h-3 rounded-full mb-2" style={{ background: c.color }} />
                <p className="text-xs font-bold mb-3 truncate w-full" style={{ color: c.id === '__mi_taller__' ? c.color : texto }}>
                  {c.nombre}{c.id === '__mi_taller__' ? ' ★' : ''}
                </p>
                {c.analisis.error ? (
                  <p className="text-xs" style={{ color: '#ef4444' }}>Sin datos</p>
                ) : (
                  <div className="flex gap-3">
                    <ScoreRing score={c.analisis.seoScore} color={scoreColor(c.analisis.seoScore)} size={60} label="SEO" />
                    <ScoreRing score={c.analisis.geoScore} color={scoreColor(c.analisis.geoScore)} size={60} label="GEO" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Leaderboard */}
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${borde}`, background: bg }}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${borde}`, background: bgSec }}>
              <p className="text-xs tracking-widest uppercase font-semibold" style={{ color: textoSec }}>Ranking general (SEO + GEO)</p>
            </div>
            <div className="p-3 space-y-1">
              {itemsConResultados.map((c, i) => (
                <LeaderRow key={c.id} rank={i + 1} nombre={c.nombre} color={c.color}
                  seo={c.analisis.seoScore} geo={c.analisis.geoScore} propio={c.id === '__mi_taller__'} />
              ))}
            </div>
          </div>

          {/* Ventajas y debilidades */}
          {miTaller && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl p-5" style={{ border: `1px solid #bbf7d0`, background: fondoClaro ? '#f0fdf4' : 'rgba(16,185,129,0.08)' }}>
                <p className="text-xs tracking-widest uppercase font-semibold mb-3" style={{ color: '#166534' }}>
                  ✅ Tus ventajas ({ventajas.length})
                </p>
                {ventajas.length === 0
                  ? <p className="text-xs" style={{ color: '#16a34a' }}>Sigue mejorando tu web para adelantar a los competidores</p>
                  : ventajas.map(s => (
                    <p key={s.key} className="text-xs mb-1.5 flex items-center gap-1.5" style={{ color: '#15803d' }}>
                      <span>✓</span> {s.label} (+{s.pts} pts)
                    </p>
                  ))
                }
              </div>
              <div className="rounded-2xl p-5" style={{ border: `1px solid #fecdd3`, background: fondoClaro ? '#fff1f2' : 'rgba(239,68,68,0.08)' }}>
                <p className="text-xs tracking-widest uppercase font-semibold mb-3" style={{ color: '#9f1239' }}>
                  🚨 Oportunidades ({debilidades.length})
                </p>
                {debilidades.length === 0
                  ? <p className="text-xs" style={{ color: '#dc2626' }}>¡Enhorabuena! No detectamos desventajas claras</p>
                  : debilidades.map(s => (
                    <p key={s.key} className="text-xs mb-1.5 flex items-center gap-1.5" style={{ color: '#be123c' }}>
                      <span>✗</span> Implementar: {s.label} (+{s.pts} pts)
                    </p>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SEO ────────────────────────────────────────────────────────────── */}
      {vistaResultados === 'seo' && (
        <div className="space-y-5">
          {/* Score bars */}
          <div className="rounded-2xl p-5" style={{ border: `1px solid ${borde}`, background: bg }}>
            <p className="text-xs tracking-widest uppercase font-semibold mb-4" style={{ color: textoSec }}>Puntuación SEO</p>
            {[...itemsConResultados].sort((a, b) => b.analisis.seoScore - a.analisis.seoScore).map(c => (
              <ScoreBar key={c.id} score={c.analisis.seoScore} color={c.color} nombre={c.nombre} />
            ))}
          </div>

          {/* Signal matrix */}
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${borde}`, background: bg }}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${borde}`, background: bgSec }}>
              <p className="text-xs tracking-widest uppercase font-semibold" style={{ color: textoSec }}>Señales SEO por web</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: 500 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${borde}` }}>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: textoSec, width: 160 }}>Señal</th>
                    {itemsConResultados.map(c => (
                      <th key={c.id} className="text-center px-2 py-3 font-semibold" style={{ color: c.color }}>
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                          <span className="truncate max-w-20">{c.nombre.split(' ')[0]}</span>
                        </div>
                      </th>
                    ))}
                    <th className="text-right px-4 py-3 font-semibold" style={{ color: textoSec }}>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {SEO_SIGNALS.map((s, i) => (
                    <tr key={s.key} style={{ borderBottom: `1px solid ${borde}`, background: i % 2 === 0 ? bgSec : 'transparent' }}>
                      <td className="px-4 py-1 font-medium" style={{ color: texto }}>{s.label}</td>
                      {itemsConResultados.map(c => (
                        <td key={c.id} className="px-2 py-1 text-center">
                          <MatrixCell ok={(c.analisis as any)[s.key]} />
                        </td>
                      ))}
                      <td className="px-4 py-1 text-right font-bold" style={{ color: textoSec }}>+{s.pts}</td>
                    </tr>
                  ))}
                  <tr className="font-bold" style={{ background: bgSec }}>
                    <td className="px-4 py-3" style={{ color: texto }}>TOTAL SEO</td>
                    {itemsConResultados.map(c => (
                      <td key={c.id} className="px-2 py-3 text-center">
                        <span className="text-sm font-black" style={{ color: scoreColor(c.analisis.seoScore) }}>
                          {c.analisis.seoScore}
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right" style={{ color: textoSec }}>100</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Meta details */}
          {itemsConResultados.some(c => c.analisis.metaTituloTexto) && (
            <div className="rounded-2xl p-5" style={{ border: `1px solid ${borde}`, background: bg }}>
              <p className="text-xs tracking-widest uppercase font-semibold mb-4" style={{ color: textoSec }}>Títulos analizados</p>
              <div className="space-y-3">
                {itemsConResultados.filter(c => c.analisis.metaTituloTexto).map(c => (
                  <div key={c.id} className="rounded-xl p-3" style={{ border: `1px solid ${borde}`, background: bgSec }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                      <p className="text-xs font-bold" style={{ color: c.color }}>{c.nombre}</p>
                      <span className="ml-auto text-xs" style={{ color: c.analisis.metaTituloLen > 70 ? '#ef4444' : c.analisis.metaTituloLen < 20 ? '#f59e0b' : '#10b981' }}>
                        {c.analisis.metaTituloLen} chars
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: texto }}>{c.analisis.metaTituloTexto || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── GEO ────────────────────────────────────────────────────────────── */}
      {vistaResultados === 'geo' && (
        <div className="space-y-5">
          {/* Score bars */}
          <div className="rounded-2xl p-5" style={{ border: `1px solid ${borde}`, background: bg }}>
            <p className="text-xs tracking-widest uppercase font-semibold mb-1" style={{ color: textoSec }}>Puntuación GEO</p>
            <p className="text-xs mb-4" style={{ color: textoSec }}>Visibilidad en motores de IA: ChatGPT, Perplexity, Gemini</p>
            {[...itemsConResultados].sort((a, b) => b.analisis.geoScore - a.analisis.geoScore).map(c => (
              <ScoreBar key={c.id} score={c.analisis.geoScore} color={c.color} nombre={c.nombre} />
            ))}
          </div>

          {/* GEO signal matrix */}
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${borde}`, background: bg }}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${borde}`, background: bgSec }}>
              <p className="text-xs tracking-widest uppercase font-semibold" style={{ color: textoSec }}>Señales GEO por web</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: 500 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${borde}` }}>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: textoSec, width: 200 }}>Señal</th>
                    {itemsConResultados.map(c => (
                      <th key={c.id} className="text-center px-2 py-3 font-semibold" style={{ color: c.color }}>
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                          <span className="truncate max-w-20">{c.nombre.split(' ')[0]}</span>
                        </div>
                      </th>
                    ))}
                    <th className="text-right px-4 py-3 font-semibold" style={{ color: textoSec }}>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {GEO_SIGNALS.map((s, i) => (
                    <tr key={s.key} style={{ borderBottom: `1px solid ${borde}`, background: i % 2 === 0 ? bgSec : 'transparent' }}>
                      <td className="px-4 py-1 font-medium" style={{ color: texto }}>{s.label}</td>
                      {itemsConResultados.map(c => (
                        <td key={c.id} className="px-2 py-1 text-center">
                          <MatrixCell ok={(c.analisis as any)[s.key]} />
                        </td>
                      ))}
                      <td className="px-4 py-1 text-right font-bold" style={{ color: textoSec }}>+{s.pts}</td>
                    </tr>
                  ))}
                  <tr className="font-bold" style={{ background: bgSec }}>
                    <td className="px-4 py-3" style={{ color: texto }}>TOTAL GEO</td>
                    {itemsConResultados.map(c => (
                      <td key={c.id} className="px-2 py-3 text-center">
                        <span className="text-sm font-black" style={{ color: scoreColor(c.analisis.geoScore) }}>
                          {c.analisis.geoScore}
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right" style={{ color: textoSec }}>100</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* GEO tips based on findings */}
          <div className="rounded-2xl p-5" style={{ border: `1px solid ${borde}`, background: bg }}>
            <p className="text-xs tracking-widest uppercase font-semibold mb-4" style={{ color: textoSec }}>¿Qué están haciendo mejor tus competidores?</p>
            <div className="space-y-3">
              {GEO_SIGNALS.map(s => {
                const competidoresConSignal = itemsConResultados.filter(c => c.id !== '__mi_taller__' && (c.analisis as any)[s.key])
                const tuTieneSingal = miTaller && (miTaller.analisis as any)[s.key]
                if (competidoresConSignal.length === 0 || tuTieneSingal) return null
                return (
                  <div key={s.key} className="flex items-start gap-3 rounded-xl p-3"
                    style={{ background: fondoClaro ? '#fff7ed' : 'rgba(245,158,11,0.08)', border: '1px solid #fed7aa' }}>
                    <span className="text-lg flex-shrink-0">⚠️</span>
                    <div>
                      <p className="text-xs font-bold" style={{ color: '#92400e' }}>
                        {competidoresConSignal.length} competidor{competidoresConSignal.length > 1 ? 'es tienen' : ' tiene'} {s.label}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#a16207' }}>
                        Implementarlo te daría +{s.pts} puntos GEO
                      </p>
                    </div>
                  </div>
                )
              }).filter(Boolean)}
              {GEO_SIGNALS.every(s => {
                const competidoresConSignal = itemsConResultados.filter(c => c.id !== '__mi_taller__' && (c.analisis as any)[s.key])
                const tuTieneSingal = miTaller && (miTaller.analisis as any)[s.key]
                return competidoresConSignal.length === 0 || tuTieneSingal
              }) && (
                <p className="text-sm" style={{ color: '#10b981' }}>✅ ¡Enhorabuena! Estás por delante en todas las señales GEO</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── RADAR ──────────────────────────────────────────────────────────── */}
      {vistaResultados === 'radar' && (
        <div className="space-y-5">
          <div className="rounded-2xl p-5" style={{ border: `1px solid ${borde}`, background: bg }}>
            <p className="text-xs tracking-widest uppercase font-semibold mb-1" style={{ color: textoSec }}>Radar comparativo</p>
            <p className="text-xs mb-5" style={{ color: textoSec }}>6 dimensiones: Meta Tags · Schema · Técnico · Contenido · GEO · Local</p>
            <RadarChart items={radarItems.slice(0, 6)} />
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {radarItems.map(item => (
                <div key={item.nombre} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  <p className="text-xs font-medium" style={{ color: texto }}>{item.nombre}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Radar dimension breakdown */}
          <div className="rounded-2xl p-5" style={{ border: `1px solid ${borde}`, background: bg }}>
            <p className="text-xs tracking-widest uppercase font-semibold mb-4" style={{ color: textoSec }}>Detalle por dimensión</p>
            {RADAR_AXES.map((axis, ai) => {
              const keyMap = ['metatags', 'schema', 'tecnico', 'contenido', 'geo', 'local'] as const
              const key = keyMap[ai]
              return (
                <div key={axis} className="mb-4">
                  <p className="text-xs font-bold mb-2" style={{ color: texto }}>{axis}</p>
                  {[...itemsConResultados].sort((a, b) => (b.analisis.radar[key] || 0) - (a.analisis.radar[key] || 0)).map(c => (
                    <ScoreBar key={c.id} score={c.analisis.radar[key] || 0} color={c.color} nombre={c.nombre} />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
