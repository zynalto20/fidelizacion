'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

const ESTADO_COLORES: Record<string, string> = {
  recibido: '#64748b', diagnostico: '#f59e0b', esperando_piezas: '#f97316',
  reparacion: '#3b82f6', terminado: '#8b5cf6', entregado: '#22c55e',
  borrador: '#64748b', enviado: '#3b82f6', aceptado: '#10b981', rechazado: '#ef4444',
}

interface Props {
  restaurante: any
  onVerOrden: (id: string) => void
  onVerCliente: (id: string) => void
  onVerPresupuesto: () => void
  primario: string
  fondo: string
  texto: string
  borde: string
  textoSec: string
  fondoClaro: boolean
}

export default function BuscadorGlobal({ restaurante, onVerOrden, onVerCliente, onVerPresupuesto, primario, fondo, texto, borde, textoSec, fondoClaro }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<any>({ ordenes: [], clientes: [], presupuestos: [] })
  const [cargando, setCargando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const totalResultados = resultados.ordenes.length + resultados.clientes.length + resultados.presupuestos.length

  // Cmd+K / Ctrl+K para abrir
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setAbierto(v => !v)
      }
      if (e.key === 'Escape') setAbierto(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (abierto) { setTimeout(() => inputRef.current?.focus(), 50) }
    else { setQuery(''); setResultados({ ordenes: [], clientes: [], presupuestos: [] }) }
  }, [abierto])

  const buscar = useCallback((q: string) => {
    clearTimeout(timeoutRef.current)
    if (!q || q.length < 2) { setResultados({ ordenes: [], clientes: [], presupuestos: [] }); return }
    timeoutRef.current = setTimeout(async () => {
      setCargando(true)
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&restaurant_id=${restaurante.id}`)
      const data = await res.json()
      setResultados(data)
      setCargando(false)
    }, 250)
  }, [restaurante?.id])

  useEffect(() => { buscar(query) }, [query, buscar])

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all"
        style={{ border: `1px solid ${borde}`, color: textoSec, background: 'transparent' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <span className="hidden sm:inline">Buscar</span>
        <span className="hidden sm:inline text-xs px-1.5 py-0.5 rounded" style={{ background: fondoClaro ? '#f1f5f9' : 'rgba(255,255,255,0.1)' }}>⌘K</span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setAbierto(false)}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl" style={{ background: fondoClaro ? '#fff' : '#1e293b' }} onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: `1px solid ${borde}` }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={textoSec} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar matrícula, cliente, número de orden…"
            className="flex-1 bg-transparent focus:outline-none text-base"
            style={{ color: texto }}
          />
          {cargando && <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0" style={{ borderColor: primario, borderTopColor: 'transparent' }} />}
          <kbd className="text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: fondoClaro ? '#f1f5f9' : 'rgba(255,255,255,0.1)', color: textoSec }}>Esc</kbd>
        </div>

        {/* Resultados */}
        <div className="max-h-96 overflow-y-auto">
          {query.length < 2 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm" style={{ color: textoSec }}>Escribe al menos 2 caracteres para buscar</p>
              <div className="flex justify-center gap-4 mt-4 flex-wrap">
                {['Busca por matrícula', 'Nombre del cliente', 'Nº de orden'].map(h => (
                  <span key={h} className="text-xs px-2.5 py-1 rounded-full" style={{ background: fondoClaro ? '#f1f5f9' : 'rgba(255,255,255,0.08)', color: textoSec }}>{h}</span>
                ))}
              </div>
            </div>
          ) : totalResultados === 0 && !cargando ? (
            <div className="px-4 py-8 text-center">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-sm" style={{ color: textoSec }}>Sin resultados para <strong style={{ color: texto }}>"{query}"</strong></p>
            </div>
          ) : (
            <div className="py-2">
              {/* Órdenes */}
              {resultados.ordenes.length > 0 && (
                <div>
                  <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: textoSec }}>Órdenes</p>
                  {resultados.ordenes.map((o: any) => {
                    const color = ESTADO_COLORES[o.estado] || '#94a3b8'
                    return (
                      <button key={o.id} onClick={() => { onVerOrden(o.id); setAbierto(false) }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm" style={{ background: color + '18' }}>🔧</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold" style={{ color: texto }}>{o.numero_completo}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: color + '18', color }}>
                              {o.estado?.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs truncate" style={{ color: textoSec }}>
                            {o.cliente_nombre || '—'} {o.matricula ? `· ${o.matricula}` : ''} {[o.marca, o.modelo].filter(Boolean).join(' ') ? `· ${[o.marca, o.modelo].filter(Boolean).join(' ')}` : ''}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Presupuestos */}
              {resultados.presupuestos.length > 0 && (
                <div style={{ borderTop: resultados.ordenes.length > 0 ? `1px solid ${borde}` : 'none' }}>
                  <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: textoSec }}>Presupuestos</p>
                  {resultados.presupuestos.map((p: any) => {
                    const color = ESTADO_COLORES[p.estado] || '#94a3b8'
                    return (
                      <button key={p.id} onClick={() => { onVerPresupuesto(); setAbierto(false) }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm" style={{ background: color + '18' }}>📋</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold" style={{ color: texto }}>{p.numero_completo}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: color + '18', color }}>{p.estado}</span>
                          </div>
                          <p className="text-xs truncate" style={{ color: textoSec }}>
                            {p.cliente_nombre || '—'}{p.matricula ? ` · ${p.matricula}` : ''}{p.total ? ` · ${Number(p.total).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}` : ''}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Clientes */}
              {resultados.clientes.length > 0 && (
                <div style={{ borderTop: (resultados.ordenes.length > 0 || resultados.presupuestos.length > 0) ? `1px solid ${borde}` : 'none' }}>
                  <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: textoSec }}>Clientes</p>
                  {resultados.clientes.map((c: any) => {
                    const cliente = c.customers
                    const nombre = [cliente?.nombre, cliente?.apellidos].filter(Boolean).join(' ')
                    return (
                      <button key={c.id} onClick={() => { onVerCliente(c.id); setAbierto(false) }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm" style={{ background: primario + '18' }}>👤</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: texto }}>{nombre || cliente?.email || '—'}</p>
                          <p className="text-xs truncate" style={{ color: textoSec }}>
                            {cliente?.email}{cliente?.telefono_nuevo ? ` · ${cliente.telefono_nuevo}` : ''} · {c.sellos_actuales} sellos
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-4 py-2" style={{ borderTop: `1px solid ${borde}` }}>
          <p className="text-xs" style={{ color: textoSec }}>
            {totalResultados > 0 ? `${totalResultados} resultado${totalResultados !== 1 ? 's' : ''}` : 'Sin resultados'} · Pulsa <kbd className="text-xs px-1 rounded" style={{ background: fondoClaro ? '#f1f5f9' : 'rgba(255,255,255,0.1)' }}>Esc</kbd> para cerrar
          </p>
        </div>
      </div>
    </div>
  )
}
