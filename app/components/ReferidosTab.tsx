'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  restaurante: any
  fondo: string
  texto: string
  borde: string
  primario: string
  boton: string
  botonTexto: string
  textoSec: string
  fondoClaro: boolean
}

export default function ReferidosTab({ restaurante, fondo, texto, borde, primario, boton, botonTexto, textoSec, fondoClaro }: Props) {
  const [config, setConfig] = useState({
    referral_activo: restaurante?.referral_activo ?? false,
    referral_premio_referidor: restaurante?.referral_premio_referidor ?? '2 sellos extra en tu próxima visita',
    referral_premio_referido: restaurante?.referral_premio_referido ?? '1 sello de bienvenida gratis',
  })
  const [guardandoConfig, setGuardandoConfig] = useState(false)
  const [clientes, setClientes] = useState<any[]>([])
  const [referidos, setReferidos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [copiado, setCopiado] = useState<string | null>(null)
  const [enviandoCampana, setEnviandoCampana] = useState(false)
  const [resultadoCampana, setResultadoCampana] = useState<any>(null)
  const [busqueda, setBusqueda] = useState('')
  const [tab, setTab] = useState<'config' | 'clientes' | 'stats'>('config')

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const referralBase = `${baseUrl}/r/${restaurante?.slug}`

  useEffect(() => {
    cargar()
  }, [restaurante?.id])

  async function cargar() {
    if (!restaurante?.id) return
    setCargando(true)
    const [{ data: cards }, { data: refs }] = await Promise.all([
      supabase.from('loyalty_cards')
        .select('id, sellos_actuales, customer_id, customers(id, nombre, apellidos, telefono_nuevo, prefijo_telefono, email)')
        .eq('restaurant_id', restaurante.id)
        .order('sellos_actuales', { ascending: false }),
      supabase.from('referrals')
        .select('*')
        .eq('restaurant_id', restaurante.id)
        .order('creado_en', { ascending: false }),
    ])
    setClientes(cards || [])
    setReferidos(refs || [])
    setCargando(false)
  }

  async function guardarConfig() {
    setGuardandoConfig(true)
    await supabase.from('restaurants').update(config).eq('id', restaurante.id)
    setGuardandoConfig(false)
  }

  function refLink(cardId: string) {
    return `${referralBase}?ref=${cardId}`
  }

  async function copiar(cardId: string, nombre: string) {
    const link = refLink(cardId)
    await navigator.clipboard.writeText(link)
    setCopiado(cardId)
    setTimeout(() => setCopiado(null), 2000)
  }

  function whatsappIndividual(cliente: any) {
    const nombre = cliente.customers?.nombre || 'Cliente'
    const tel = `${cliente.customers?.prefijo_telefono || '+34'}${cliente.customers?.telefono_nuevo || ''}`.replace(/\s/g, '')
    const link = refLink(cliente.id)
    const premio = config.referral_premio_referidor
    const premioNuevo = config.referral_premio_referido
    const msg = encodeURIComponent(
      `¡Hola ${nombre}! 👋\n\nQueremos premiar tu fidelidad. Comparte tu enlace personal con amigos o familiares y cuando se registren, ¡ambos ganáis!\n\n🎁 Tú recibes: ${premio}\n🎁 Tu amigo recibe: ${premioNuevo}\n\nTu enlace exclusivo:\n${link}\n\n¡Muchas gracias por confiar en nosotros! 🚗`
    )
    window.open(`https://wa.me/${tel.replace('+', '')}?text=${msg}`, '_blank')
  }

  async function lanzarCampana() {
    const conTelefono = clientes.filter(c => c.customers?.telefono_nuevo)
    if (!conTelefono.length) return
    setEnviandoCampana(true)
    setResultadoCampana(null)

    let enviados = 0
    let errores = 0
    for (const c of conTelefono) {
      const tel = `${c.customers?.prefijo_telefono || '+34'}${c.customers?.telefono_nuevo}`.replace(/\s/g, '')
      const nombre = c.customers?.nombre || 'Cliente'
      const link = refLink(c.id)
      const msg = `¡Hola ${nombre}! 👋\n\nQueremos premiar tu fidelidad. Comparte tu enlace personal y cuando tus amigos se registren, ¡ambos ganáis!\n\n🎁 Tú recibes: ${config.referral_premio_referidor}\n🎁 Tu amigo recibe: ${config.referral_premio_referido}\n\nTu enlace exclusivo:\n${link}\n\n¡Gracias por confiar en nosotros! 🚗`
      try {
        const res = await fetch('/api/whatsapp-campaign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurant_id: restaurante.id,
            mensaje: msg,
            destinatarios: [{ telefono: tel, nombre }],
            _single: true,
          }),
        })
        if (res.ok) enviados++
        else errores++
      } catch { errores++ }
    }
    setResultadoCampana({ enviados, errores, total: conTelefono.length })
    setEnviandoCampana(false)
  }

  // Stats
  const totalReferidos = referidos.length
  const completados = referidos.filter(r => r.estado === 'completado').length
  const pendientes = referidos.filter(r => r.estado === 'pendiente').length

  // Ranking: who has referred the most
  const rankingMap: Record<string, { nombre: string; count: number; completados: number }> = {}
  for (const r of referidos) {
    const id = r.referrer_card_id
    if (!rankingMap[id]) {
      const card = clientes.find(c => c.id === id)
      rankingMap[id] = {
        nombre: card?.customers?.nombre || 'Desconocido',
        count: 0,
        completados: 0,
      }
    }
    rankingMap[id].count++
    if (r.estado === 'completado') rankingMap[id].completados++
  }
  const ranking = Object.values(rankingMap).sort((a, b) => b.count - a.count).slice(0, 5)

  const clientesFiltrados = clientes.filter(c => {
    const nombre = `${c.customers?.nombre || ''} ${c.customers?.apellidos || ''}`.toLowerCase()
    const email = c.customers?.email?.toLowerCase() || ''
    const q = busqueda.toLowerCase()
    return !q || nombre.includes(q) || email.includes(q)
  })

  const TABS = [
    { key: 'config', label: '⚙️ Programa' },
    { key: 'clientes', label: '👥 Clientes' },
    { key: 'stats', label: '📊 Estadísticas' },
  ] as const

  const card = (children: React.ReactNode, extra?: string) => (
    <div className={`rounded-xl p-5 mb-4 ${extra || ''}`} style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : fondo }}>
      {children}
    </div>
  )

  return (
    <div>
      {/* Header con estado del programa */}
      <div className="rounded-2xl p-5 mb-5 flex items-center justify-between gap-4"
        style={{ background: config.referral_activo ? (fondoClaro ? '#f0fdf4' : 'rgba(34,197,94,0.1)') : (fondoClaro ? '#f8fafc' : 'rgba(255,255,255,0.04)'), border: `1px solid ${config.referral_activo ? '#22c55e' : borde}` }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤝</span>
          <div>
            <p className="font-bold text-sm" style={{ color: texto }}>Programa de referidos</p>
            <p className="text-xs" style={{ color: config.referral_activo ? '#22c55e' : textoSec }}>
              {config.referral_activo ? `Activo · ${clientes.filter(c => c.customers?.telefono_nuevo).length} clientes con enlace` : 'Inactivo'}
            </p>
          </div>
        </div>
        <button
          onClick={async () => {
            const next = { ...config, referral_activo: !config.referral_activo }
            setConfig(next)
            await supabase.from('restaurants').update({ referral_activo: next.referral_activo }).eq('id', restaurante.id)
          }}
          className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0"
          style={{ background: config.referral_activo ? '#22c55e' : borde }}>
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${config.referral_activo ? 'left-6' : 'left-0.5'}`} />
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="text-xs px-4 py-2 rounded-lg font-medium transition-colors"
            style={{ background: tab === t.key ? primario : 'transparent', color: tab === t.key ? botonTexto : textoSec, border: `1px solid ${tab === t.key ? primario : borde}` }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CONFIG ── */}
      {tab === 'config' && (
        <>
          {card(
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🎁</span>
                <p className="font-semibold text-sm" style={{ color: texto }}>Premios del programa</p>
              </div>

              <div className="mb-4">
                <label className="text-xs tracking-widest uppercase mb-1.5 block" style={{ color: textoSec }}>
                  Premio para el cliente que refiere
                </label>
                <input
                  value={config.referral_premio_referidor}
                  onChange={e => setConfig({ ...config, referral_premio_referidor: e.target.value })}
                  placeholder="Ej: 2 sellos extra en tu próxima visita"
                  className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none"
                  style={{ border: `1px solid ${borde}`, background: 'transparent', color: texto }}
                />
                <p className="text-xs mt-1" style={{ color: textoSec }}>El cliente ya existente que comparte su enlace</p>
              </div>

              <div className="mb-5">
                <label className="text-xs tracking-widest uppercase mb-1.5 block" style={{ color: textoSec }}>
                  Premio para el nuevo cliente
                </label>
                <input
                  value={config.referral_premio_referido}
                  onChange={e => setConfig({ ...config, referral_premio_referido: e.target.value })}
                  placeholder="Ej: 1 sello de bienvenida gratis"
                  className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none"
                  style={{ border: `1px solid ${borde}`, background: 'transparent', color: texto }}
                />
                <p className="text-xs mt-1" style={{ color: textoSec }}>El amigo que se registra usando el enlace</p>
              </div>

              <button onClick={guardarConfig} disabled={guardandoConfig}
                className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: boton, color: botonTexto }}>
                {guardandoConfig ? 'Guardando…' : 'Guardar configuración'}
              </button>
            </>
          )}

          {card(
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📱</span>
                <p className="font-semibold text-sm" style={{ color: texto }}>Vista previa del mensaje</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: fondoClaro ? '#f1f5f9' : 'rgba(255,255,255,0.06)' }}>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: texto }}>
                  {`¡Hola [nombre]! 👋\n\nQueremos premiar tu fidelidad. Comparte tu enlace personal y cuando tus amigos se registren, ¡ambos ganáis!\n\n🎁 Tú recibes: ${config.referral_premio_referidor}\n🎁 Tu amigo recibe: ${config.referral_premio_referido}\n\nTu enlace exclusivo:\n${referralBase}?ref=[tu-código]\n\n¡Gracias por confiar en nosotros! 🚗`}
                </p>
              </div>
            </>
          )}

          {card(
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🚀</span>
                <p className="font-semibold text-sm" style={{ color: texto }}>Campaña de lanzamiento</p>
              </div>
              <p className="text-xs mb-4" style={{ color: textoSec }}>
                Envía el mensaje con el enlace personal de cada cliente por WhatsApp de forma masiva.
                {' '}{clientes.filter(c => c.customers?.telefono_nuevo).length} clientes con teléfono disponibles.
              </p>
              <button
                onClick={lanzarCampana}
                disabled={enviandoCampana || !config.referral_activo}
                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: '#25D366', color: '#fff' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.858L0 24l6.305-1.654A11.932 11.932 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.87 0-3.618-.5-5.12-1.37l-.367-.217-3.812 1 1.017-3.71-.24-.38A9.96 9.96 0 0 1 2 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/></svg>
                {enviandoCampana ? 'Enviando…' : 'Enviar campaña WhatsApp'}
              </button>
              {!config.referral_activo && (
                <p className="text-xs mt-2 text-center" style={{ color: '#f59e0b' }}>⚠️ Activa el programa para enviar la campaña</p>
              )}
              {resultadoCampana && (
                <div className="mt-3 rounded-xl px-4 py-3 text-sm"
                  style={{ background: fondoClaro ? '#f0fdf4' : 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                  ✅ {resultadoCampana.enviados} mensajes enviados de {resultadoCampana.total}
                  {resultadoCampana.errores > 0 && ` (${resultadoCampana.errores} errores)`}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── CLIENTES ── */}
      {tab === 'clientes' && (
        <>
          <div className="mb-4">
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="🔍 Buscar cliente…"
              className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none"
              style={{ border: `1px solid ${borde}`, background: 'transparent', color: texto }}
            />
          </div>
          {cargando ? (
            <p className="text-sm text-center py-8" style={{ color: textoSec }}>Cargando clientes…</p>
          ) : (
            <div className="space-y-2">
              {clientesFiltrados.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: textoSec }}>No hay clientes</p>
              ) : clientesFiltrados.map(c => {
                const nombre = `${c.customers?.nombre || ''} ${c.customers?.apellidos || ''}`.trim() || c.customers?.email || 'Cliente'
                const tieneTel = !!c.customers?.telefono_nuevo
                const misRefs = referidos.filter(r => r.referrer_card_id === c.id)
                return (
                  <div key={c.id} className="rounded-xl p-4" style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : fondo }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium truncate" style={{ color: texto }}>{nombre}</p>
                          {misRefs.length > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                              style={{ background: fondoClaro ? '#f0fdf4' : 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                              {misRefs.length} ref{misRefs.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-xs truncate" style={{ color: textoSec }}>{c.customers?.email || ''}</p>
                        {/* Referral link pequeño */}
                        <p className="text-xs mt-1.5 font-mono truncate" style={{ color: textoSec }}>
                          …?ref={c.id.slice(0, 8)}…
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => copiar(c.id, nombre)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium"
                          style={{ border: `1px solid ${borde}`, color: copiado === c.id ? '#22c55e' : textoSec, background: 'transparent' }}
                          title="Copiar enlace">
                          {copiado === c.id ? '✅' : '🔗'}
                        </button>
                        {tieneTel && (
                          <button
                            onClick={() => whatsappIndividual(c)}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium"
                            style={{ background: '#25D366', color: '#fff' }}
                            title="Enviar por WhatsApp">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.858L0 24l6.305-1.654A11.932 11.932 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.87 0-3.618-.5-5.12-1.37l-.367-.217-3.812 1 1.017-3.71-.24-.38A9.96 9.96 0 0 1 2 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── ESTADÍSTICAS ── */}
      {tab === 'stats' && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Total referidos', value: totalReferidos, color: primario, icon: '🤝' },
              { label: 'Completados', value: completados, color: '#22c55e', icon: '✅' },
              { label: 'Pendientes', value: pendientes, color: '#f59e0b', icon: '⏳' },
            ].map(k => (
              <div key={k.label} className="rounded-xl p-4 text-center" style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : fondo }}>
                <p className="text-xl mb-1">{k.icon}</p>
                <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
                <p className="text-xs mt-0.5" style={{ color: textoSec }}>{k.label}</p>
              </div>
            ))}
          </div>

          {/* Ranking de referidores */}
          {card(
            <>
              <p className="font-semibold text-sm mb-4" style={{ color: texto }}>🏆 Top referidores</p>
              {ranking.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: textoSec }}>Aún no hay referidos registrados</p>
              ) : ranking.map((r, i) => (
                <div key={i} className="flex items-center gap-3 mb-3">
                  <span className="text-lg w-7">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: texto }}>{r.nombre}</p>
                    <p className="text-xs" style={{ color: textoSec }}>{r.completados} completados · {r.count} total</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: primario }}>{r.count}</p>
                    <p className="text-xs" style={{ color: textoSec }}>refs</p>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Últimos referidos */}
          {card(
            <>
              <p className="font-semibold text-sm mb-4" style={{ color: texto }}>📋 Últimos referidos</p>
              {referidos.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: textoSec }}>Sin referidos aún</p>
              ) : referidos.slice(0, 10).map(r => {
                const referidor = clientes.find(c => c.id === r.referrer_card_id)
                const nombreRef = referidor?.customers?.nombre || 'Desconocido'
                const estadoBadge = r.estado === 'completado'
                  ? { label: 'Completado', color: '#22c55e', bg: fondoClaro ? '#f0fdf4' : 'rgba(34,197,94,0.1)' }
                  : { label: 'Pendiente', color: '#f59e0b', bg: fondoClaro ? '#fffbeb' : 'rgba(245,158,11,0.1)' }
                return (
                  <div key={r.id} className="flex items-center justify-between gap-3 mb-3 pb-3"
                    style={{ borderBottom: `1px solid ${borde}` }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: texto }}>{r.referred_name || 'Nuevo cliente'}</p>
                      <p className="text-xs truncate" style={{ color: textoSec }}>Referido por {nombreRef}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ color: estadoBadge.color, background: estadoBadge.bg }}>
                        {estadoBadge.label}
                      </span>
                      <span className="text-xs" style={{ color: textoSec }}>
                        {new Date(r.creado_en).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </>
      )}
    </div>
  )
}
