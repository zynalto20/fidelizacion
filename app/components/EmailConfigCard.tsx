'use client'
import { useState } from 'react'
import EmailEditor from './EmailEditor'

interface Props {
  tipo: string
  label: string
  desc: string
  asuntoDefault: string
  cuerpoDefault: string
  config: any
  onToggle: (tipo: string, activo: boolean) => void
  onGuardar: (tipo: string, asunto: string, cuerpo: string) => void
  fondo: string
  texto: string
  borde: string
  primario: string
  boton: string
  botonTexto: string
  textoSec: string
  fondoClaro: boolean
  restaurante: any
}

export default function EmailConfigCard({ tipo, label, desc, asuntoDefault, cuerpoDefault, config, onToggle, onGuardar, fondo, texto, borde, primario, boton, botonTexto, textoSec, fondoClaro, restaurante }: Props) {
  const [editando, setEditando] = useState(false)
  const [asunto, setAsunto] = useState(config?.asunto || asuntoDefault)
  const [cuerpo, setCuerpo] = useState(config?.cuerpo || cuerpoDefault)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  async function guardar() {
    setGuardando(true)
    await onGuardar(tipo, asunto, cuerpo)
    setGuardando(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2000)
  }

  return (
    <div className="rounded-xl mb-4 overflow-hidden" style={{ border: `1px solid ${editando ? primario : borde}` }}>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-3">
            <p className="font-medium text-sm" style={{ color: texto }}>{label}</p>
            <p className="text-xs mt-0.5" style={{ color: textoSec }}>{desc}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setEditando(!editando)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ color: editando ? botonTexto : primario, background: editando ? primario : 'transparent', border: `1px solid ${primario}` }}>
              {editando ? 'Cerrar' : 'Editar'}
            </button>
            <button onClick={() => onToggle(tipo, !(config?.activo || false))}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: config?.activo ? '#22c55e' : 'transparent', color: config?.activo ? '#fff' : textoSec, border: `1px solid ${config?.activo ? '#22c55e' : borde}` }}>
              {config?.activo ? '● Activo' : '○ Inactivo'}
            </button>
          </div>
        </div>
      </div>
      {editando && (
        <div style={{ borderTop: `1px solid ${borde}` }}>
          <div className="p-4">
            <div className="mb-4">
              <p className="text-xs tracking-widest uppercase mb-2" style={{ color: textoSec }}>Asunto del email</p>
              <input type="text" value={asunto} onChange={(e) => setAsunto(e.target.value)}
                className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm"
                style={{ border: `1px solid ${borde}`, color: texto }} />
            </div>
            <div className="mb-3">
              <p className="text-xs tracking-widest uppercase mb-2" style={{ color: textoSec }}>Cuerpo del mensaje</p>
              <EmailEditor
                content={cuerpo}
                onChange={setCuerpo}
                fondo={fondo}
                texto={texto}
                borde={borde}
                primario={primario}
              />
              <p className="text-xs mt-2" style={{ color: textoSec }}>
                Variables: <span style={{ color: primario }}>[nombre]</span> <span style={{ color: primario }}>[servicio]</span> <span style={{ color: primario }}>[fecha]</span> <span style={{ color: primario }}>[hora]</span> <span style={{ color: primario }}>[marca]</span> <span style={{ color: primario }}>[modelo]</span> <span style={{ color: primario }}>[matricula]</span>
              </p>
            </div>
            <button onClick={guardar} disabled={guardando}
              className="w-full text-xs font-semibold rounded-xl py-3 mb-4 disabled:opacity-50"
              style={{ background: boton, color: botonTexto }}>
              {guardando ? 'Guardando...' : guardado ? '✓ Guardado' : 'Guardar plantilla'}
            </button>
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${borde}` }}>
              <div className="px-4 py-2" style={{ background: fondoClaro ? '#f1f5f9' : 'rgba(255,255,255,0.05)' }}>
                <p className="text-xs font-medium" style={{ color: textoSec }}>Vista previa</p>
              </div>
              <div className="p-4">
                <p className="text-xs mb-1" style={{ color: textoSec }}>Asunto:</p>
                <p className="text-sm font-medium mb-3" style={{ color: texto }}>{asunto}</p>
                <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  {restaurante.logo_url && <img src={restaurante.logo_url} alt={restaurante.nombre} className="h-8 object-contain mb-3" />}
                  <div className="text-sm" style={{ color: '#111' }} dangerouslySetInnerHTML={{ __html: cuerpo.replace('[nombre]', 'Juan').replace('[servicio]', 'Cambio de aceite').replace('[fecha]', '2026-05-20').replace('[hora]', '10:00').replace('[marca]', 'Toyota').replace('[modelo]', 'Corolla').replace('[matricula]', '1234ABC') }} />
                  <p style={{ color: '#999', fontSize: '11px', marginTop: '16px' }}>— {restaurante.nombre}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}