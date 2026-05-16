'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const ESTADOS_ORDEN = [
  { key: 'recibido', label: 'Recibido', icon: '📥', color: '#64748b' },
  { key: 'diagnostico', label: 'Diagnóstico', icon: '🔍', color: '#f59e0b' },
  { key: 'esperando_piezas', label: 'Esperando piezas', icon: '📦', color: '#8b5cf6' },
  { key: 'reparacion', label: 'En reparación', icon: '🔧', color: '#3b82f6' },
  { key: 'terminado', label: 'Terminado', icon: '✅', color: '#10b981' },
  { key: 'entregado', label: 'Entregado', icon: '🏁', color: '#6b7280' },
]

function estadoInfo(key: string) {
  return ESTADOS_ORDEN.find(e => e.key === key) || ESTADOS_ORDEN[0]
}

function ProgresoOrden({ estado }: { estado: string }) {
  const idx = ESTADOS_ORDEN.findIndex(e => e.key === estado)
  const activeUntil = idx === ESTADOS_ORDEN.length - 1 ? idx : idx
  return (
    <div className="flex items-center gap-0 mt-4 mb-2">
      {ESTADOS_ORDEN.map((e, i) => {
        const done = i <= activeUntil
        const last = i === ESTADOS_ORDEN.length - 1
        return (
          <div key={e.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all"
                style={{
                  background: done ? e.color : '#e2e8f0',
                  color: done ? '#fff' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                {done ? (i === activeUntil ? e.icon : '✓') : i + 1}
              </div>
              <p className="text-center leading-tight mt-1 hidden sm:block" style={{ fontSize: 9, color: done ? e.color : '#94a3b8', maxWidth: 56 }}>{e.label}</p>
            </div>
            {!last && (
              <div className="flex-1 h-0.5 mx-0.5 transition-all" style={{ background: i < activeUntil ? ESTADOS_ORDEN[i + 1].color : '#e2e8f0' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function TarjetaOrden({ orden }: { orden: any }) {
  const [abierta, setAbierta] = useState(false)
  const info = estadoInfo(orden.estado)
  const esActiva = !['entregado'].includes(orden.estado)

  return (
    <div
      className="rounded-2xl overflow-hidden mb-3 cursor-pointer transition-shadow hover:shadow-md"
      style={{ border: `2px solid ${esActiva ? info.color + '40' : '#e2e8f0'}`, background: '#fff' }}
      onClick={() => setAbierta(!abierta)}
    >
      <div className="p-4">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold" style={{ color: '#0f172a' }}>
                {orden.matricula || '—'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: info.color + '18', color: info.color }}>
                {info.icon} {info.label}
              </span>
            </div>
            {(orden.marca || orden.modelo) && (
              <p className="text-sm mt-0.5" style={{ color: '#475569' }}>{[orden.marca, orden.modelo, orden.anio].filter(Boolean).join(' · ')}</p>
            )}
            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{orden.numero_completo}</p>
          </div>
          <div className="text-right flex-shrink-0">
            {orden.presupuesto && (
              <p className="text-base font-bold" style={{ color: '#0f172a' }}>{Number(orden.presupuesto).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
            )}
            {orden.fecha_estimada && (
              <p className="text-xs" style={{ color: '#94a3b8' }}>
                Entrega est. {new Date(orden.fecha_estimada + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </p>
            )}
          </div>
        </div>

        <ProgresoOrden estado={orden.estado} />

        <div className="flex sm:hidden gap-2 mt-2 overflow-x-auto pb-1">
          {ESTADOS_ORDEN.map((e, i) => {
            const idx2 = ESTADOS_ORDEN.findIndex(x => x.key === orden.estado)
            const done = i <= idx2
            return (
              <span key={e.key} className="text-xs whitespace-nowrap px-1.5 py-0.5 rounded" style={{ background: done ? e.color + '18' : '#f1f5f9', color: done ? e.color : '#94a3b8' }}>
                {e.icon} {e.label}
              </span>
            )
          })}
        </div>
      </div>

      {abierta && (
        <div className="border-t px-4 py-3" style={{ borderColor: '#f1f5f9', background: '#fafafa' }}>
          {orden.descripcion_problema && (
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>Problema reportado</p>
              <p className="text-sm" style={{ color: '#334155' }}>{orden.descripcion_problema}</p>
            </div>
          )}
          {orden.diagnostico && (
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>Diagnóstico</p>
              <p className="text-sm" style={{ color: '#334155' }}>{orden.diagnostico}</p>
            </div>
          )}
          {orden.trabajos_realizados && (
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>Trabajos realizados</p>
              <p className="text-sm" style={{ color: '#334155' }}>{orden.trabajos_realizados}</p>
            </div>
          )}
          {orden.notas && (
            <div className="mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>Notas</p>
              <p className="text-sm" style={{ color: '#334155' }}>{orden.notas}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-4 text-xs mt-2" style={{ color: '#94a3b8' }}>
            {orden.fecha_entrada && <span>Entrada: {new Date(orden.fecha_entrada + 'T00:00:00').toLocaleDateString('es-ES')}</span>}
            {orden.km_entrada && <span>KM entrada: {orden.km_entrada.toLocaleString('es-ES')}</span>}
            {orden.fecha_entrega && <span>Entregado: {new Date(orden.fecha_entrega + 'T00:00:00').toLocaleDateString('es-ES')}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PortalCliente() {
  const { slug } = useParams()
  const [restaurante, setRestaurante] = useState<any>(null)
  const [cargandoRest, setCargandoRest] = useState(true)
  const [query, setQuery] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [datos, setDatos] = useState<any>(null)
  const [error, setError] = useState('')
  const [tabActiva, setTabActiva] = useState<'ordenes' | 'vehiculos' | 'historial' | 'reservas' | 'cita'>('ordenes')
  const [citaModal, setCitaModal] = useState(false)
  const [citaForm, setCitaForm] = useState({ cliente_nombre: '', cliente_telefono: '', cliente_email: '', matricula: '', servicio: '', fecha_preferida: '', hora_preferida: '', notas: '' })
  const [enviandoCita, setEnviandoCita] = useState(false)
  const [citaEnviada, setCitaEnviada] = useState(false)

  useEffect(() => {
    async function cargarRestaurante() {
      const { data } = await supabase.from('restaurants').select('id, nombre, color_fondo, color_primario, color_texto, logo_url').eq('slug', slug).single()
      setRestaurante(data)
      setCargandoRest(false)
    }
    cargarRestaurante()
  }, [slug])

  function abrirCita() {
    if (datos) {
      const nombre = [datos.cliente?.nombre, datos.cliente?.apellidos].filter(Boolean).join(' ')
      setCitaForm(f => ({
        ...f,
        cliente_nombre: nombre || '',
        cliente_telefono: datos.cliente?.telefono_nuevo || '',
        cliente_email: datos.cliente?.email || '',
        matricula: datos.vehiculos?.[0]?.matricula || '',
      }))
    }
    setCitaModal(true)
    setCitaEnviada(false)
  }

  async function enviarCita(e: React.FormEvent) {
    e.preventDefault()
    if (!restaurante || !citaForm.cliente_nombre || !citaForm.cliente_telefono) return
    setEnviandoCita(true)
    await fetch('/api/portal/cita', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurant_id: restaurante.id, ...citaForm }),
    })
    setEnviandoCita(false)
    setCitaEnviada(true)
  }

  async function buscar(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || !restaurante) return
    setBuscando(true)
    setError('')
    setDatos(null)

    const res = await fetch('/api/portal/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurant_id: restaurante.id, query: query.trim() }),
    })
    const json = await res.json()
    setBuscando(false)

    if (!json.encontrado) {
      setError('No encontramos ningún cliente con ese teléfono o email. Comprueba los datos o contacta con el taller.')
    } else {
      setDatos(json)
      setTabActiva(json.ordenes?.length > 0 ? 'ordenes' : 'vehiculos')
    }
  }

  if (cargandoRest) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" /></div>
  }

  if (!restaurante) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-slate-400">Taller no encontrado</p></div>
  }

  const primario = restaurante.color_primario || '#2563eb'
  const fondo = restaurante.color_fondo || '#f8fafc'

  const ordenesActivas = datos?.ordenes?.filter((o: any) => o.estado !== 'entregado') || []
  const ordenesEntregadas = datos?.ordenes?.filter((o: any) => o.estado === 'entregado') || []

  const tabs = [
    { key: 'ordenes', label: 'Mis órdenes', count: datos?.ordenes?.length },
    { key: 'vehiculos', label: 'Mis vehículos', count: datos?.vehiculos?.length },
    { key: 'historial', label: 'Historial', count: datos?.servicios?.length },
    { key: 'reservas', label: 'Citas', count: datos?.reservas?.length },
  ].filter(t => t.count > 0 || t.key === 'ordenes')

  const SERVICIOS_TALLER = ['Revisión general', 'Cambio de aceite', 'Frenos', 'ITV (pre-inspección)', 'Neumáticos', 'Diagnosis electrónica', 'Aire acondicionado', 'Embrague', 'Distribución', 'Otro']

  return (
    <div className="min-h-screen" style={{ background: fondo }}>
      {/* Modal solicitar cita */}
      {citaModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl bg-white">
            <div className="px-5 py-4" style={{ background: primario }}>
              <p className="text-white font-semibold">📅 Solicitar cita</p>
              <p className="text-white/70 text-xs mt-0.5">Te confirmaremos el horario por teléfono</p>
            </div>
            {citaEnviada ? (
              <div className="p-8 text-center">
                <p className="text-4xl mb-3">✅</p>
                <p className="font-bold text-slate-800 text-lg">¡Solicitud enviada!</p>
                <p className="text-slate-500 text-sm mt-2">Nos pondremos en contacto contigo para confirmar la cita.</p>
                <button onClick={() => { setCitaModal(false); setCitaEnviada(false) }}
                  className="mt-5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: primario }}>
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={enviarCita} className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 block mb-1">Nombre completo *</label>
                    <input type="text" required value={citaForm.cliente_nombre} onChange={e => setCitaForm(f => ({ ...f, cliente_nombre: e.target.value }))}
                      className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 border-slate-200"
                      style={{ '--tw-ring-color': primario } as any} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Teléfono *</label>
                    <input type="tel" required value={citaForm.cliente_telefono} onChange={e => setCitaForm(f => ({ ...f, cliente_telefono: e.target.value }))}
                      className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 border-slate-200"
                      style={{ '--tw-ring-color': primario } as any} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Matrícula</label>
                    <input type="text" value={citaForm.matricula} onChange={e => setCitaForm(f => ({ ...f, matricula: e.target.value.toUpperCase() }))}
                      className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 border-slate-200 font-mono font-bold"
                      style={{ '--tw-ring-color': primario } as any} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 block mb-1">Servicio</label>
                    <select value={citaForm.servicio} onChange={e => setCitaForm(f => ({ ...f, servicio: e.target.value }))}
                      className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 border-slate-200 bg-white"
                      style={{ '--tw-ring-color': primario } as any}>
                      <option value="">Selecciona un servicio…</option>
                      {SERVICIOS_TALLER.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Fecha preferida</label>
                    <input type="date" value={citaForm.fecha_preferida} min={new Date().toISOString().split('T')[0]} onChange={e => setCitaForm(f => ({ ...f, fecha_preferida: e.target.value }))}
                      className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 border-slate-200"
                      style={{ '--tw-ring-color': primario } as any} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Hora preferida</label>
                    <select value={citaForm.hora_preferida} onChange={e => setCitaForm(f => ({ ...f, hora_preferida: e.target.value }))}
                      className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 border-slate-200 bg-white"
                      style={{ '--tw-ring-color': primario } as any}>
                      <option value="">Sin preferencia</option>
                      {['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','15:00','15:30','16:00','16:30','17:00','17:30','18:00'].map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 block mb-1">Notas adicionales</label>
                    <textarea value={citaForm.notas} onChange={e => setCitaForm(f => ({ ...f, notas: e.target.value }))} rows={2}
                      placeholder="Describe brevemente el problema o cualquier detalle relevante…"
                      className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 border-slate-200 resize-none"
                      style={{ '--tw-ring-color': primario } as any} />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setCitaModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm border border-slate-200 text-slate-500">
                    Cancelar
                  </button>
                  <button type="submit" disabled={enviandoCita || !citaForm.cliente_nombre || !citaForm.cliente_telefono}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                    style={{ background: primario }}>
                    {enviandoCita ? 'Enviando…' : 'Solicitar cita'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 shadow-sm" style={{ background: primario }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {restaurante.logo_url && (
            <img src={restaurante.logo_url} alt="" className="h-9 w-9 rounded-xl object-cover bg-white/20" />
          )}
          <div className="flex-1">
            <h1 className="font-bold text-white text-base leading-tight">{restaurante.nombre}</h1>
            <p className="text-white/70 text-xs">Portal del cliente</p>
          </div>
          <button onClick={abrirCita}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            📅 Pedir cita
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {!datos ? (
          /* PANTALLA DE LOGIN */
          <div>
            <div className="text-center mb-8 mt-4">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl" style={{ background: primario + '18' }}>
                🔧
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Consulta tu expediente</h2>
              <p className="text-slate-500 text-sm">Introduce tu teléfono o email para ver el estado de tu vehículo, historial de servicios y más.</p>
            </div>

            <form onSubmit={buscar} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Teléfono o email</label>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ej: 612 345 678 o tu@email.com"
                className="w-full rounded-xl px-4 py-3 text-sm border outline-none focus:ring-2 transition-all"
                style={{ borderColor: '#e2e8f0', '--tw-ring-color': primario } as any}
                autoComplete="off"
                autoFocus
              />
              {error && (
                <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={buscando || !query.trim()}
                className="w-full mt-4 py-3 rounded-xl font-semibold text-sm disabled:opacity-40 transition-all"
                style={{ background: primario, color: '#fff' }}
              >
                {buscando ? 'Buscando…' : 'Ver mi expediente →'}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-6">
              Tus datos se usan exclusivamente para mostrarte tu información.<br />No se envía ningún código ni verificación.
            </p>

            <div className="mt-4 text-center">
              <button onClick={abrirCita} className="text-sm font-medium" style={{ color: primario }}>
                📅 Solicitar cita sin entrar →
              </button>
            </div>
          </div>
        ) : (
          /* PANTALLA DE DATOS */
          <div>
            {/* Cabecera cliente */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800 text-lg">
                  {[datos.cliente?.nombre, datos.cliente?.apellidos].filter(Boolean).join(' ') || 'Cliente'}
                </p>
                <p className="text-sm text-slate-400">{datos.cliente?.email || datos.cliente?.telefono_nuevo || query}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {datos.card && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: primario + '15' }}>
                    <span className="text-base">⭐</span>
                    <span className="font-bold text-sm" style={{ color: primario }}>{datos.card.sellos_actuales || 0} sellos</span>
                  </div>
                )}
                <button onClick={() => { setDatos(null); setQuery('') }} className="text-xs text-slate-400 hover:text-slate-600 mt-1">
                  ← Salir
                </button>
              </div>
            </div>

            {/* Tabs */}
            {tabs.length > 1 && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {tabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTabActiva(t.key as any)}
                    className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: tabActiva === t.key ? primario : '#fff',
                      color: tabActiva === t.key ? '#fff' : '#475569',
                      border: tabActiva === t.key ? 'none' : '1px solid #e2e8f0',
                    }}
                  >
                    {t.label}
                    {t.count > 0 && (
                      <span className="ml-1.5 text-xs opacity-70">({t.count})</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* TAB: ÓRDENES */}
            {tabActiva === 'ordenes' && (
              <div>
                {datos.ordenes.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                    <p className="text-4xl mb-3">🔧</p>
                    <p className="text-slate-500 text-sm">No hay órdenes de reparación registradas</p>
                  </div>
                ) : (
                  <>
                    {ordenesActivas.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">En curso</p>
                        {ordenesActivas.map((o: any) => <TarjetaOrden key={o.id} orden={o} />)}
                      </div>
                    )}
                    {ordenesEntregadas.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Historial de reparaciones</p>
                        {ordenesEntregadas.map((o: any) => <TarjetaOrden key={o.id} orden={o} />)}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB: VEHÍCULOS */}
            {tabActiva === 'vehiculos' && (
              <div>
                {datos.vehiculos.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                    <p className="text-4xl mb-3">🚗</p>
                    <p className="text-slate-500 text-sm">No hay vehículos registrados</p>
                  </div>
                ) : (
                  datos.vehiculos.map((v: any) => (
                    <div key={v.id} className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono font-bold text-slate-800">{v.matricula || '—'}</p>
                          <p className="text-sm text-slate-500 mt-0.5">{[v.marca, v.modelo].filter(Boolean).join(' ')}{v.anio ? ` · ${v.anio}` : ''}</p>
                          {v.tipo && <p className="text-xs text-slate-400 mt-0.5">{v.tipo}</p>}
                        </div>
                        <div className="text-right">
                          {v.km_actuales && (
                            <p className="text-sm font-semibold text-slate-700">{Number(v.km_actuales).toLocaleString('es-ES')} km</p>
                          )}
                          {v.color && <p className="text-xs text-slate-400 mt-0.5">{v.color}</p>}
                        </div>
                      </div>
                      {(v.proximo_itv || v.proximo_mantenimiento_km) && (
                        <div className="mt-3 pt-3 border-t border-slate-50 flex gap-4">
                          {v.proximo_itv && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-amber-500">⚠️</span>
                              <p className="text-xs text-slate-500">ITV: {new Date(v.proximo_itv).toLocaleDateString('es-ES')}</p>
                            </div>
                          )}
                          {v.proximo_mantenimiento_km && (
                            <div className="flex items-center gap-1.5">
                              <span>🔩</span>
                              <p className="text-xs text-slate-500">Próx. mant.: {Number(v.proximo_mantenimiento_km).toLocaleString('es-ES')} km</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: HISTORIAL DE SERVICIOS */}
            {tabActiva === 'historial' && (
              <div>
                {datos.servicios.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                    <p className="text-4xl mb-3">📋</p>
                    <p className="text-slate-500 text-sm">No hay servicios registrados</p>
                  </div>
                ) : (
                  datos.servicios.map((s: any) => (
                    <div key={s.id} className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{s.tipo_servicio}</p>
                          {s.vehicles && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              {s.vehicles.matricula} {s.vehicles.marca ? `· ${s.vehicles.marca} ${s.vehicles.modelo || ''}` : ''}
                            </p>
                          )}
                          {s.descripcion && <p className="text-xs text-slate-500 mt-1">{s.descripcion}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {s.fecha_servicio && (
                            <p className="text-xs text-slate-400">{new Date(s.fecha_servicio + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          )}
                          {s.km_servicio && <p className="text-xs text-slate-400 mt-0.5">{Number(s.km_servicio).toLocaleString('es-ES')} km</p>}
                        </div>
                      </div>
                      {(s.proximo_servicio_fecha || s.proximo_servicio_km) && (
                        <div className="mt-2 pt-2 border-t border-slate-50 flex gap-4">
                          {s.proximo_servicio_fecha && (
                            <p className="text-xs" style={{ color: primario }}>→ Próximo: {new Date(s.proximo_servicio_fecha + 'T00:00:00').toLocaleDateString('es-ES')}</p>
                          )}
                          {s.proximo_servicio_km && (
                            <p className="text-xs" style={{ color: primario }}>→ Próximo: {Number(s.proximo_servicio_km).toLocaleString('es-ES')} km</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: CITAS */}
            {tabActiva === 'reservas' && (
              <div>
                {datos.reservas.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                    <p className="text-4xl mb-3">📅</p>
                    <p className="text-slate-500 text-sm">No hay citas próximas</p>
                  </div>
                ) : (
                  datos.reservas.map((r: any) => (
                    <div key={r.id} className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{r.servicio || 'Cita'}</p>
                          {r.notas && <p className="text-xs text-slate-500 mt-0.5">{r.notas}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold" style={{ color: primario }}>
                            {new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </p>
                          {r.hora && <p className="text-xs text-slate-400 mt-0.5">{r.hora.slice(0, 5)}</p>}
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          r.estado === 'confirmada' ? 'bg-green-50 text-green-600' :
                          r.estado === 'cancelada' ? 'bg-red-50 text-red-500' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {r.estado === 'confirmada' ? '✓ Confirmada' : r.estado === 'cancelada' ? '✕ Cancelada' : '⏳ Pendiente'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            <p className="text-center text-xs text-slate-400 mt-8 mb-2">
              Para cualquier consulta, contacta directamente con {restaurante.nombre}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
