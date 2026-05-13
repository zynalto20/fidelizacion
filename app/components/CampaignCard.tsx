'use client'
import { useState } from 'react'
import EmailEditor from './EmailEditor'

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

const SEGMENTOS = [
  { value: 'todos', label: 'Todos los clientes', desc: 'Todos los clientes registrados' },
  { value: 'inactivos', label: 'Clientes inactivos', desc: 'Sin actividad en los últimos 30 días' },
  { value: 'con_vehiculo', label: 'Con vehículo', desc: 'Clientes con vehículo registrado' },
]

const CUERPO_INICIAL = '<p>Hola <strong>[nombre]</strong>,</p><p></p>'

export default function CampaignCard({
  restauranteId, fondo, texto, borde, primario, boton, botonTexto, textoSec, fondoClaro, restaurante, onEnviada
}: Props) {
  const [abierta, setAbierta] = useState(false)
  const [asunto, setAsunto] = useState('')
  const [cuerpo, setCuerpo] = useState(CUERPO_INICIAL)
  const [segmento, setSegmento] = useState('todos')
  const [confirmando, setConfirmando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null)

  function cerrar() {
    setAbierta(false)
    setConfirmando(false)
    setResultado(null)
  }

  async function enviar() {
    setEnviando(true)
    setResultado(null)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_id: restauranteId, asunto, cuerpo, segmento }),
      })
      const json = await res.json()
      if (!res.ok) {
        setResultado({ ok: false, msg: json.error || 'Error al enviar' })
      } else {
        setResultado({ ok: true, msg: `✓ Campaña enviada a ${json.total_enviados} destinatario${json.total_enviados !== 1 ? 's' : ''}` })
        setAsunto('')
        setCuerpo(CUERPO_INICIAL)
        setSegmento('todos')
        setConfirmando(false)
        setAbierta(false)
        onEnviada()
      }
    } catch {
      setResultado({ ok: false, msg: 'Error de red. Inténtalo de nuevo.' })
    }
    setEnviando(false)
  }

  const segmentoLabel = SEGMENTOS.find(s => s.value === segmento)?.label ?? ''

  return (
    <div className="rounded-xl mb-4 overflow-hidden" style={{ border: `1px solid ${abierta ? primario : borde}` }}>
      {/* Header */}
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-3">
            <p className="font-medium text-sm" style={{ color: texto }}>Nueva campaña</p>
            <p className="text-xs mt-0.5" style={{ color: textoSec }}>Envía un email manual a tus clientes ahora</p>
          </div>
          <button
            onClick={() => (abierta ? cerrar() : setAbierta(true))}
            className="text-xs px-3 py-1.5 rounded-lg font-medium flex-shrink-0"
            style={{ color: abierta ? botonTexto : primario, background: abierta ? primario : 'transparent', border: `1px solid ${primario}` }}>
            {abierta ? 'Cerrar' : 'Crear'}
          </button>
        </div>
      </div>

      {/* Form */}
      {abierta && (
        <div style={{ borderTop: `1px solid ${borde}` }}>
          <div className="p-4">
            {/* Segment */}
            <div className="mb-4">
              <p className="text-xs tracking-widest uppercase mb-2" style={{ color: textoSec }}>Destinatarios</p>
              <div className="flex flex-col gap-2">
                {SEGMENTOS.map(s => (
                  <label
                    key={s.value}
                    className="flex items-start gap-3 cursor-pointer p-2.5 rounded-lg"
                    style={{
                      background: segmento === s.value ? (fondoClaro ? '#f1f5f9' : 'rgba(255,255,255,0.05)') : 'transparent',
                      border: `1px solid ${segmento === s.value ? primario : 'transparent'}`,
                    }}>
                    <input
                      type="radio"
                      name="segmento"
                      value={s.value}
                      checked={segmento === s.value}
                      onChange={() => setSegmento(s.value)}
                      className="mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium leading-none mb-0.5" style={{ color: texto }}>{s.label}</p>
                      <p className="text-xs" style={{ color: textoSec }}>{s.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="mb-4">
              <p className="text-xs tracking-widest uppercase mb-2" style={{ color: textoSec }}>Asunto</p>
              <input
                type="text"
                value={asunto}
                onChange={e => setAsunto(e.target.value)}
                placeholder="Escribe el asunto del email…"
                className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm"
                style={{ border: `1px solid ${borde}`, color: texto }}
              />
            </div>

            {/* Body */}
            <div className="mb-4">
              <p className="text-xs tracking-widest uppercase mb-2" style={{ color: textoSec }}>Mensaje</p>
              <EmailEditor content={cuerpo} onChange={setCuerpo} fondo={fondo} texto={texto} borde={borde} primario={primario} />
              <p className="text-xs mt-2" style={{ color: textoSec }}>
                Variable: <span style={{ color: primario }}>[nombre]</span>
              </p>
            </div>

            {/* Preview */}
            <div className="rounded-xl overflow-hidden mb-4" style={{ border: `1px solid ${borde}` }}>
              <div className="px-4 py-2" style={{ background: fondoClaro ? '#f1f5f9' : 'rgba(255,255,255,0.05)' }}>
                <p className="text-xs font-medium" style={{ color: textoSec }}>Vista previa</p>
              </div>
              <div className="p-4">
                <p className="text-xs mb-1" style={{ color: textoSec }}>Asunto:</p>
                <p className="text-sm font-medium mb-3" style={{ color: texto }}>{asunto || '—'}</p>
                <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  {restaurante.logo_url && (
                    <img src={restaurante.logo_url} alt={restaurante.nombre} className="h-8 object-contain mb-3" />
                  )}
                  <div
                    className="text-sm"
                    style={{ color: '#111' }}
                    dangerouslySetInnerHTML={{ __html: cuerpo.replace(/\[nombre\]/g, 'Juan') }}
                  />
                  <p style={{ color: '#999', fontSize: '11px', marginTop: '16px' }}>— {restaurante.nombre}</p>
                </div>
              </div>
            </div>

            {/* Send / Confirm */}
            {!confirmando ? (
              <button
                onClick={() => setConfirmando(true)}
                disabled={!asunto.trim()}
                className="w-full text-xs font-semibold rounded-xl py-3 disabled:opacity-30"
                style={{ background: boton, color: botonTexto }}>
                Enviar campaña
              </button>
            ) : (
              <div className="rounded-xl p-4" style={{ background: fondoClaro ? '#fffbeb' : 'rgba(251,191,36,0.08)', border: '1px solid #fbbf24' }}>
                <p className="text-sm font-medium mb-1" style={{ color: texto }}>¿Confirmar envío?</p>
                <p className="text-xs mb-3" style={{ color: textoSec }}>
                  Se enviará el email al segmento <strong style={{ color: texto }}>«{segmentoLabel}»</strong>. Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={enviar}
                    disabled={enviando}
                    className="flex-1 text-xs font-semibold rounded-lg py-2 disabled:opacity-50"
                    style={{ background: boton, color: botonTexto }}>
                    {enviando ? 'Enviando…' : 'Sí, enviar'}
                  </button>
                  <button
                    onClick={() => setConfirmando(false)}
                    disabled={enviando}
                    className="flex-1 text-xs font-semibold rounded-lg py-2"
                    style={{ border: `1px solid ${borde}`, color: textoSec, background: 'transparent' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {resultado && (
              <p
                className="text-xs text-center mt-3 py-2 rounded-lg"
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
