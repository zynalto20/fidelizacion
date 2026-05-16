'use client'
import { useState } from 'react'
import EmailEditor from './EmailEditor'

interface Filtros {
  actividad: '' | 'activos' | 'inactivos'
  diasInactividad: number
  sellos: '' | 'min_sellos' | 'tarjeta_completa'
  minSellos: number
  vehiculo: '' | 'con_vehiculo' | 'sin_vehiculo' | 'revision_proxima'
  diasRevision: number
  reservas: '' | 'ha_reservado' | 'nunca_reservado'
  ciudad: string
}

const FILTROS_DEFAULT: Filtros = {
  actividad: '',
  diasInactividad: 30,
  sellos: '',
  minSellos: 5,
  vehiculo: '',
  diasRevision: 7,
  reservas: '',
  ciudad: '',
}

const CUERPO_INICIAL = '<p>Hola <strong>[nombre]</strong>,</p><p></p>'

interface Props {
  restauranteId: string
  fondo: string
  texto: string
  borde: string
  primario: string
  boton: string
  botonTexto: string
  textoSec: string
  fondoClaro: boolean
  restaurante: any
  onEnviada: () => void
}

function PillSelector<T extends string>({
  opciones, valor, onChange, primario, botonTexto, textoSec, borde,
}: {
  opciones: { val: T; label: string }[]
  valor: T
  onChange: (v: T) => void
  primario: string
  botonTexto: string
  textoSec: string
  borde: string
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {opciones.map(o => (
        <button
          key={o.val}
          type="button"
          onClick={() => onChange(o.val)}
          className="text-xs px-3 py-1 rounded-full font-medium transition-colors"
          style={{
            background: valor === o.val ? primario : 'transparent',
            color: valor === o.val ? botonTexto : textoSec,
            border: `1px solid ${valor === o.val ? primario : borde}`,
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function NumInput({ value, onChange, min = 1, texto, borde }: { value: number; onChange: (n: number) => void; min?: number; texto: string; borde: string }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      onChange={e => onChange(Math.max(min, parseInt(e.target.value) || min))}
      className="w-16 bg-transparent text-xs rounded-lg px-2 py-1 text-center focus:outline-none"
      style={{ border: `1px solid ${borde}`, color: texto }}
    />
  )
}

function descFiltros(f: Filtros): string {
  const parts: string[] = []
  if (f.actividad === 'activos') parts.push(`activos en los últimos ${f.diasInactividad} días`)
  if (f.actividad === 'inactivos') parts.push(`inactivos hace +${f.diasInactividad} días`)
  if (f.sellos === 'min_sellos') parts.push(`con ≥ ${f.minSellos} sellos`)
  if (f.sellos === 'tarjeta_completa') parts.push('que completaron tarjeta')
  if (f.vehiculo === 'con_vehiculo') parts.push('con vehículo')
  if (f.vehiculo === 'sin_vehiculo') parts.push('sin vehículo')
  if (f.vehiculo === 'revision_proxima') parts.push(`con revisión en ${f.diasRevision} días`)
  if (f.reservas === 'ha_reservado') parts.push('que han reservado')
  if (f.reservas === 'nunca_reservado') parts.push('que nunca han reservado')
  if (f.ciudad.trim()) parts.push(`en ${f.ciudad.trim()}`)
  return parts.length > 0 ? parts.join(' · ') : 'todos los clientes'
}

export default function CampaignCard({
  restauranteId, fondo, texto, borde, primario, boton, botonTexto, textoSec, fondoClaro, restaurante, onEnviada,
}: Props) {
  const [abierta, setAbierta] = useState(false)
  const [filtros, setFiltros] = useState<Filtros>({ ...FILTROS_DEFAULT })
  const [asunto, setAsunto] = useState('')
  const [cuerpo, setCuerpo] = useState(CUERPO_INICIAL)
  const [programar, setProgramar] = useState(false)
  const [programadaPara, setProgramadaPara] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null)

  function setFiltro<K extends keyof Filtros>(key: K, val: Filtros[K]) {
    setFiltros(prev => ({ ...prev, [key]: val }))
  }

  function cerrar() {
    setAbierta(false)
    setConfirmando(false)
    setResultado(null)
  }

  function resetForm() {
    setFiltros({ ...FILTROS_DEFAULT })
    setAsunto('')
    setCuerpo(CUERPO_INICIAL)
    setProgramar(false)
    setProgramadaPara('')
    setConfirmando(false)
  }

  async function enviar() {
    setEnviando(true)
    setResultado(null)
    try {
      const body: any = { restaurant_id: restauranteId, asunto, cuerpo, filtros }
      if (programar && programadaPara) body.programada_para = new Date(programadaPara).toISOString()

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()

      if (!res.ok) {
        setResultado({ ok: false, msg: json.error || 'Error al procesar' })
      } else if (json.programada) {
        const fecha = new Date(programadaPara).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        setResultado({ ok: true, msg: `✓ Campaña programada para el ${fecha}` })
        resetForm()
        setAbierta(false)
        onEnviada()
      } else {
        setResultado({ ok: true, msg: `✓ Enviada a ${json.total_enviados} destinatario${json.total_enviados !== 1 ? 's' : ''}` })
        resetForm()
        setAbierta(false)
        onEnviada()
      }
    } catch {
      setResultado({ ok: false, msg: 'Error de red. Inténtalo de nuevo.' })
    }
    setEnviando(false)
  }

  const minDatetime = new Date(Date.now() + 60000).toISOString().slice(0, 16)
  const puedeEnviar = asunto.trim() && (!programar || programadaPara)

  const fondoSeccion = fondoClaro ? '#f8fafc' : 'rgba(255,255,255,0.03)'

  return (
    <div className="rounded-xl mb-4 overflow-hidden" style={{ border: `1px solid ${abierta ? primario : borde}` }}>
      {/* Header */}
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-3">
            <p className="font-medium text-sm" style={{ color: texto }}>Nueva campaña</p>
            <p className="text-xs mt-0.5" style={{ color: textoSec }}>Email manual con segmentación avanzada</p>
          </div>
          <button
            onClick={() => abierta ? cerrar() : setAbierta(true)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium flex-shrink-0"
            style={{ color: abierta ? botonTexto : primario, background: abierta ? primario : 'transparent', border: `1px solid ${primario}` }}>
            {abierta ? 'Cerrar' : 'Crear'}
          </button>
        </div>
      </div>

      {abierta && (
        <div style={{ borderTop: `1px solid ${borde}` }}>
          <div className="p-4 space-y-3">

            {/* ── FILTROS ── */}
            <p className="text-xs tracking-widest uppercase" style={{ color: textoSec }}>Segmento de destinatarios</p>

            {/* Actividad */}
            <div className="rounded-xl p-3" style={{ background: fondoSeccion, border: `1px solid ${borde}` }}>
              <p className="text-xs font-medium mb-2" style={{ color: textoSec }}>Actividad</p>
              <PillSelector
                opciones={[
                  { val: '' as const, label: 'Todos' },
                  { val: 'activos' as const, label: 'Activos' },
                  { val: 'inactivos' as const, label: 'Inactivos' },
                ]}
                valor={filtros.actividad}
                onChange={v => setFiltro('actividad', v)}
                primario={primario} botonTexto={botonTexto} textoSec={textoSec} borde={borde}
              />
              {filtros.actividad !== '' && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs" style={{ color: textoSec }}>
                    {filtros.actividad === 'activos' ? 'Activos en los últimos' : 'Sin visita en más de'}
                  </span>
                  <NumInput value={filtros.diasInactividad} onChange={v => setFiltro('diasInactividad', v)} texto={texto} borde={borde} />
                  <span className="text-xs" style={{ color: textoSec }}>días</span>
                </div>
              )}
            </div>

            {/* Sellos */}
            <div className="rounded-xl p-3" style={{ background: fondoSeccion, border: `1px solid ${borde}` }}>
              <p className="text-xs font-medium mb-2" style={{ color: textoSec }}>Sellos de fidelidad</p>
              <PillSelector
                opciones={[
                  { val: '' as const, label: 'Sin filtro' },
                  { val: 'min_sellos' as const, label: '≥ X sellos' },
                  { val: 'tarjeta_completa' as const, label: 'Tarjeta completada' },
                ]}
                valor={filtros.sellos}
                onChange={v => setFiltro('sellos', v)}
                primario={primario} botonTexto={botonTexto} textoSec={textoSec} borde={borde}
              />
              {filtros.sellos === 'min_sellos' && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs" style={{ color: textoSec }}>Con al menos</span>
                  <NumInput value={filtros.minSellos} onChange={v => setFiltro('minSellos', v)} texto={texto} borde={borde} />
                  <span className="text-xs" style={{ color: textoSec }}>sellos</span>
                </div>
              )}
            </div>

            {/* Vehículo */}
            <div className="rounded-xl p-3" style={{ background: fondoSeccion, border: `1px solid ${borde}` }}>
              <p className="text-xs font-medium mb-2" style={{ color: textoSec }}>Vehículo</p>
              <PillSelector
                opciones={[
                  { val: '' as const, label: 'Sin filtro' },
                  { val: 'con_vehiculo' as const, label: 'Con vehículo' },
                  { val: 'sin_vehiculo' as const, label: 'Sin vehículo' },
                  { val: 'revision_proxima' as const, label: 'Revisión próxima' },
                ]}
                valor={filtros.vehiculo}
                onChange={v => setFiltro('vehiculo', v)}
                primario={primario} botonTexto={botonTexto} textoSec={textoSec} borde={borde}
              />
              {filtros.vehiculo === 'revision_proxima' && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs" style={{ color: textoSec }}>Revisión en los próximos</span>
                  <NumInput value={filtros.diasRevision} onChange={v => setFiltro('diasRevision', v)} texto={texto} borde={borde} />
                  <span className="text-xs" style={{ color: textoSec }}>días</span>
                </div>
              )}
            </div>

            {/* Reservas */}
            <div className="rounded-xl p-3" style={{ background: fondoSeccion, border: `1px solid ${borde}` }}>
              <p className="text-xs font-medium mb-2" style={{ color: textoSec }}>Reservas</p>
              <PillSelector
                opciones={[
                  { val: '' as const, label: 'Sin filtro' },
                  { val: 'ha_reservado' as const, label: 'Ha reservado' },
                  { val: 'nunca_reservado' as const, label: 'Nunca ha reservado' },
                ]}
                valor={filtros.reservas}
                onChange={v => setFiltro('reservas', v)}
                primario={primario} botonTexto={botonTexto} textoSec={textoSec} borde={borde}
              />
            </div>

            {/* Ciudad */}
            <div className="rounded-xl p-3" style={{ background: fondoSeccion, border: `1px solid ${borde}` }}>
              <p className="text-xs font-medium mb-2" style={{ color: textoSec }}>Ciudad</p>
              <input
                type="text"
                value={filtros.ciudad}
                onChange={e => setFiltro('ciudad', e.target.value)}
                placeholder="Todas las ciudades"
                className="w-full bg-transparent rounded-lg px-3 py-1.5 focus:outline-none text-sm"
                style={{ border: `1px solid ${borde}`, color: texto }}
              />
            </div>

            {/* ── MENSAJE ── */}
            <p className="text-xs tracking-widest uppercase pt-1" style={{ color: textoSec }}>Mensaje</p>

            <div>
              <p className="text-xs mb-1.5" style={{ color: textoSec }}>Asunto</p>
              <input
                type="text"
                value={asunto}
                onChange={e => setAsunto(e.target.value)}
                placeholder="Escribe el asunto del email…"
                className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm"
                style={{ border: `1px solid ${borde}`, color: texto }}
              />
            </div>

            <div>
              <p className="text-xs mb-1.5" style={{ color: textoSec }}>Cuerpo</p>
              <EmailEditor content={cuerpo} onChange={setCuerpo} fondo={fondo} texto={texto} borde={borde} primario={primario} negocio={restaurante?.nombre || ''} />
              <p className="text-xs mt-1.5" style={{ color: textoSec }}>
                Variable: <span style={{ color: primario }}>[nombre]</span>
              </p>
            </div>

            {/* ── ENVÍO ── */}
            <p className="text-xs tracking-widest uppercase pt-1" style={{ color: textoSec }}>Cuándo enviar</p>

            <div className="rounded-xl p-3" style={{ background: fondoSeccion, border: `1px solid ${borde}` }}>
              <PillSelector
                opciones={[
                  { val: false as any, label: 'Enviar ahora' },
                  { val: true as any, label: 'Programar' },
                ]}
                valor={programar as any}
                onChange={v => setProgramar(v as any)}
                primario={primario} botonTexto={botonTexto} textoSec={textoSec} borde={borde}
              />
              {programar && (
                <input
                  type="datetime-local"
                  value={programadaPara}
                  min={minDatetime}
                  onChange={e => setProgramadaPara(e.target.value)}
                  className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm mt-3"
                  style={{ border: `1px solid ${borde}`, color: texto }}
                />
              )}
            </div>

            {/* ── VISTA PREVIA ── */}
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${borde}` }}>
              <div className="px-4 py-2" style={{ background: fondoClaro ? '#f1f5f9' : 'rgba(255,255,255,0.05)' }}>
                <p className="text-xs font-medium" style={{ color: textoSec }}>Vista previa</p>
              </div>
              <div className="p-4">
                <p className="text-xs mb-0.5" style={{ color: textoSec }}>Asunto:</p>
                <p className="text-sm font-medium mb-3" style={{ color: texto }}>{asunto || '—'}</p>
                <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  {restaurante.logo_url && (
                    <img src={restaurante.logo_url} alt={restaurante.nombre} className="h-8 object-contain mb-3" />
                  )}
                  <div className="text-sm" style={{ color: '#111' }} dangerouslySetInnerHTML={{ __html: cuerpo.replace(/\[nombre\]/g, 'Juan') }} />
                  <p style={{ color: '#999', fontSize: '11px', marginTop: '16px' }}>— {restaurante.nombre}</p>
                </div>
              </div>
            </div>

            {/* ── BOTÓN / CONFIRMACIÓN ── */}
            {!confirmando ? (
              <button
                onClick={() => setConfirmando(true)}
                disabled={!puedeEnviar}
                className="w-full text-xs font-semibold rounded-xl py-3 disabled:opacity-30"
                style={{ background: boton, color: botonTexto }}>
                {programar ? 'Programar campaña' : 'Enviar campaña'}
              </button>
            ) : (
              <div className="rounded-xl p-4" style={{ background: fondoClaro ? '#fffbeb' : 'rgba(251,191,36,0.08)', border: '1px solid #fbbf24' }}>
                <p className="text-sm font-medium mb-1" style={{ color: texto }}>
                  {programar ? '¿Confirmar programación?' : '¿Confirmar envío?'}
                </p>
                <p className="text-xs mb-1" style={{ color: textoSec }}>
                  Destinatarios: <strong style={{ color: texto }}>{descFiltros(filtros)}</strong>
                </p>
                {programar && programadaPara && (
                  <p className="text-xs mb-3" style={{ color: textoSec }}>
                    Fecha de envío: <strong style={{ color: texto }}>
                      {new Date(programadaPara).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </p>
                )}
                {!programar && <p className="text-xs mb-3" style={{ color: textoSec }}>Esta acción no se puede deshacer.</p>}
                <div className="flex gap-2">
                  <button onClick={enviar} disabled={enviando}
                    className="flex-1 text-xs font-semibold rounded-lg py-2 disabled:opacity-50"
                    style={{ background: boton, color: botonTexto }}>
                    {enviando ? (programar ? 'Programando…' : 'Enviando…') : (programar ? 'Sí, programar' : 'Sí, enviar')}
                  </button>
                  <button onClick={() => setConfirmando(false)} disabled={enviando}
                    className="flex-1 text-xs font-semibold rounded-lg py-2"
                    style={{ border: `1px solid ${borde}`, color: textoSec, background: 'transparent' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {resultado && (
              <p className="text-xs text-center py-2 rounded-lg"
                style={{ color: resultado.ok ? '#22c55e' : '#ef4444', background: resultado.ok ? '#f0fdf4' : '#fef2f2' }}>
                {resultado.msg}
              </p>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
