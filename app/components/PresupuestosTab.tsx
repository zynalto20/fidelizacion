'use client'
import { useState, useEffect, useRef } from 'react'

interface Linea {
  concepto: string
  cantidad: number
  precio_unitario: number
  descuento: number
  tipo_iva: number
  subtotal: number
}

interface Presupuesto {
  id: string
  numero_completo: string
  estado: string
  cliente_nombre?: string
  cliente_telefono?: string
  cliente_email?: string
  matricula?: string
  marca?: string
  modelo?: string
  descripcion?: string
  lineas: Linea[]
  base_imponible: number
  cuota_iva: number
  total: number
  validez_dias: number
  notas?: string
  creado_en: string
  actualizado_en?: string
}

const ESTADOS = {
  borrador:  { label: 'Borrador',  color: '#64748b', bg: '#f1f5f9' },
  enviado:   { label: 'Enviado',   color: '#3b82f6', bg: '#eff6ff' },
  aceptado:  { label: 'Aceptado', color: '#10b981', bg: '#f0fdf4' },
  rechazado: { label: 'Rechazado',color: '#ef4444', bg: '#fef2f2' },
  caducado:  { label: 'Caducado', color: '#94a3b8', bg: '#f8fafc' },
}

const LINEA_VACIA: Linea = { concepto: '', cantidad: 1, precio_unitario: 0, descuento: 0, tipo_iva: 21, subtotal: 0 }

function calcSubtotal(l: Linea) {
  return (l.cantidad || 1) * (l.precio_unitario || 0) * (1 - (l.descuento || 0) / 100)
}

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
  orderId?: string       // si viene de una orden, pre-filtra
  ordenData?: any        // datos de la orden para pre-rellenar
}

export default function PresupuestosTab({
  restaurante, fondo, texto, borde, primario, boton, botonTexto, textoSec, fondoClaro, orderId, ordenData
}: Props) {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [cargando, setCargando] = useState(true)
  const [vista, setVista] = useState<'lista' | 'nuevo' | 'detalle'>('lista')
  const [seleccionado, setSeleccionado] = useState<Presupuesto | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [enviandoEmail, setEnviandoEmail] = useState(false)
  const [msgEmail, setMsgEmail] = useState('')
  const printRef = useRef<HTMLDivElement>(null)
  const [catalogo, setCatalogo] = useState<any[]>([])
  const [busquedaCatalogo, setBusquedaCatalogo] = useState<number | null>(null) // índice de línea activa

  const fondoSec = fondoClaro ? '#f8fafc' : 'rgba(255,255,255,0.03)'

  const formVacio = {
    cliente_nombre: ordenData?.cliente_nombre || '',
    cliente_telefono: ordenData?.cliente_telefono || '',
    cliente_email: ordenData?.cliente_email || '',
    matricula: ordenData?.matricula || '',
    marca: ordenData?.marca || '',
    modelo: ordenData?.modelo || '',
    descripcion: ordenData?.descripcion_problema || '',
    validez_dias: '30',
    notas: '',
    lineas: [{ ...LINEA_VACIA }] as Linea[],
  }
  const [form, setForm] = useState({ ...formVacio })

  async function cargar() {
    setCargando(true)
    const url = orderId
      ? `/api/presupuestos?restaurant_id=${restaurante.id}&order_id=${orderId}`
      : `/api/presupuestos?restaurant_id=${restaurante.id}`
    const res = await fetch(url)
    const data = await res.json()
    setPresupuestos(Array.isArray(data) ? data : [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    fetch(`/api/catalogo?restaurant_id=${restaurante.id}`)
      .then(r => r.json())
      .then(d => setCatalogo(Array.isArray(d) ? d : []))
  }, [])

  function setLinea(i: number, campo: keyof Linea, valor: any) {
    setForm(prev => {
      const lineas = [...prev.lineas]
      lineas[i] = { ...lineas[i], [campo]: valor }
      lineas[i].subtotal = calcSubtotal(lineas[i])
      return { ...prev, lineas }
    })
  }

  function añadirLinea() {
    setForm(prev => ({ ...prev, lineas: [...prev.lineas, { ...LINEA_VACIA }] }))
  }

  function quitarLinea(i: number) {
    setForm(prev => ({ ...prev, lineas: prev.lineas.filter((_, idx) => idx !== i) }))
  }

  const baseCalc = form.lineas.reduce((a, l) => a + calcSubtotal(l), 0)
  const ivaCalc = form.lineas.reduce((a, l) => a + calcSubtotal(l) * (l.tipo_iva / 100), 0)
  const totalCalc = baseCalc + ivaCalc

  async function crear() {
    setGuardando(true)
    const res = await fetch('/api/presupuestos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_id: restaurante.id,
        order_id: orderId || null,
        ...form,
        validez_dias: parseInt(form.validez_dias) || 30,
        lineas: form.lineas.map(l => ({ ...l, subtotal: calcSubtotal(l) })),
      }),
    })
    const data = await res.json()
    setGuardando(false)
    if (res.ok) {
      setPresupuestos(prev => [data, ...prev])
      setSeleccionado(data)
      setVista('detalle')
      setForm({ ...formVacio })
    }
  }

  async function cambiarEstado(id: string, estado: string) {
    const res = await fetch(`/api/presupuestos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    const data = await res.json()
    if (res.ok) {
      setPresupuestos(prev => prev.map(p => p.id === id ? data : p))
      setSeleccionado(data)
    }
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este presupuesto?')) return
    await fetch(`/api/presupuestos/${id}`, { method: 'DELETE' })
    setPresupuestos(prev => prev.filter(p => p.id !== id))
    setVista('lista')
    setSeleccionado(null)
  }

  async function convertirAFactura(p: Presupuesto) {
    if (!confirm('¿Convertir este presupuesto en factura? Se creará una factura con los mismos datos.')) return
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_id: restaurante.id,
        cliente_nombre: p.cliente_nombre,
        cliente_email: p.cliente_email,
        cliente_telefono: p.cliente_telefono,
        matricula: p.matricula,
        items: (p.lineas || []).map(l => ({
          concepto: l.concepto,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
          descuento: l.descuento,
          tipo_iva: l.tipo_iva,
          subtotal: calcSubtotal(l),
        })),
        notas: `Generada a partir del presupuesto ${p.numero_completo}${p.notas ? '\n' + p.notas : ''}`,
      }),
    })
    if (res.ok) {
      await cambiarEstado(p.id, 'aceptado')
      setMsgEmail('✓ Factura creada correctamente. Puedes verla en la pestaña Facturas.')
      setTimeout(() => setMsgEmail(''), 5000)
    } else {
      setMsgEmail('⚠️ Error al crear la factura')
    }
  }

  async function enviarPorEmail(p: Presupuesto) {
    if (!p.cliente_email) { setMsgEmail('Este presupuesto no tiene email de cliente'); return }
    setEnviandoEmail(true)
    setMsgEmail('')
    // Marcar como enviado + notificar
    await cambiarEstado(p.id, 'enviado')
    // Email simple vía API (reutilizamos el endpoint de email existente o uno nuevo)
    const res = await fetch('/api/presupuestos/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presupuesto_id: p.id, restaurant_id: restaurante.id }),
    })
    setEnviandoEmail(false)
    setMsgEmail(res.ok ? '✓ Email enviado y marcado como enviado' : '⚠️ No se pudo enviar el email')
    setTimeout(() => setMsgEmail(''), 4000)
  }

  function imprimir() {
    window.print()
  }

  const fmt = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtCurrency = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })

  // ── VISTA DETALLE ──
  if (vista === 'detalle' && seleccionado) {
    const p = seleccionado
    const est = ESTADOS[p.estado as keyof typeof ESTADOS] || ESTADOS.borrador
    const fechaCreacion = new Date(p.creado_en).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    const fechaValidez = new Date(new Date(p.creado_en).getTime() + p.validez_dias * 86400000)
      .toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

    return (
      <div>
        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button onClick={() => { setVista('lista'); setSeleccionado(null) }} className="text-sm" style={{ color: textoSec }}>
            ← Volver
          </button>
          <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: est.bg, color: est.color }}>{est.label}</span>
          <span className="text-xs font-mono flex-1" style={{ color: textoSec }}>{p.numero_completo}</span>
          <button onClick={imprimir} className="text-xs px-3 py-1.5 rounded-lg" style={{ border: `1px solid ${borde}`, color: textoSec }}>
            🖨️ Imprimir
          </button>
          {p.estado !== 'aceptado' && p.estado !== 'rechazado' && (
            <button onClick={() => enviarPorEmail(p)} disabled={enviandoEmail} className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-40"
              style={{ background: primario, color: '#fff' }}>
              {enviandoEmail ? 'Enviando…' : '📧 Enviar'}
            </button>
          )}
          {p.estado === 'aceptado' || p.estado === 'enviado' ? (
            <button onClick={() => convertirAFactura(p)} className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: '#10b981', color: '#fff' }}>
              🧾 → Factura
            </button>
          ) : null}
          <button onClick={() => eliminar(p.id)} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#ef4444', border: '1px solid #fecaca' }}>
            Eliminar
          </button>
        </div>

        {msgEmail && <p className="text-sm mb-3 px-3 py-2 rounded-xl" style={{ background: fondoSec, color: primario }}>{msgEmail}</p>}

        {/* Cambio de estado */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {Object.entries(ESTADOS).map(([key, info]) => (
            <button key={key} onClick={() => cambiarEstado(p.id, key)}
              className="text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: p.estado === key ? info.color : 'transparent',
                color: p.estado === key ? '#fff' : textoSec,
                border: `1px solid ${p.estado === key ? info.color : borde}`,
              }}>
              {info.label}
            </button>
          ))}
        </div>

        {/* Documento imprimible */}
        <div ref={printRef} className="rounded-2xl overflow-hidden print:shadow-none" style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : fondo }}>
          {/* Cabecera */}
          <div className="p-6 flex justify-between items-start gap-4 flex-wrap" style={{ background: primario }}>
            <div>
              {restaurante.logo_url && <img src={restaurante.logo_url} alt="" className="h-10 mb-2 rounded-lg" />}
              <p className="font-bold text-white text-lg">{restaurante.nombre}</p>
              {restaurante.nif && <p className="text-white/70 text-xs">NIF: {restaurante.nif}</p>}
              {restaurante.direccion_fiscal && <p className="text-white/70 text-xs">{restaurante.direccion_fiscal}, {restaurante.codigo_postal_fiscal} {restaurante.ciudad_fiscal}</p>}
            </div>
            <div className="text-right">
              <p className="font-bold text-white text-2xl">{p.numero_completo}</p>
              <p className="text-white/70 text-sm mt-1">PRESUPUESTO</p>
              <p className="text-white/60 text-xs mt-1">Fecha: {fechaCreacion}</p>
              <p className="text-white/60 text-xs">Válido hasta: {fechaValidez}</p>
            </div>
          </div>

          <div className="p-6">
            {/* Datos cliente/vehículo */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: textoSec }}>Cliente</p>
                {p.cliente_nombre && <p className="text-sm font-semibold" style={{ color: texto }}>{p.cliente_nombre}</p>}
                {p.cliente_telefono && <p className="text-xs" style={{ color: textoSec }}>{p.cliente_telefono}</p>}
                {p.cliente_email && <p className="text-xs" style={{ color: textoSec }}>{p.cliente_email}</p>}
              </div>
              {(p.matricula || p.marca) && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: textoSec }}>Vehículo</p>
                  {p.matricula && <p className="font-mono font-bold text-sm" style={{ color: texto }}>{p.matricula}</p>}
                  {(p.marca || p.modelo) && <p className="text-xs" style={{ color: textoSec }}>{[p.marca, p.modelo].filter(Boolean).join(' ')}</p>}
                </div>
              )}
            </div>

            {p.descripcion && (
              <div className="mb-4 p-3 rounded-xl" style={{ background: fondoSec }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: textoSec }}>Descripción del trabajo</p>
                <p className="text-sm" style={{ color: texto }}>{p.descripcion}</p>
              </div>
            )}

            {/* Tabla de líneas */}
            <table className="w-full text-sm mb-4">
              <thead>
                <tr style={{ borderBottom: `2px solid ${borde}` }}>
                  {['Concepto', 'Cant.', 'Precio', 'Dto.', 'IVA', 'Subtotal'].map(h => (
                    <th key={h} className="text-left py-2 px-1 text-xs font-semibold uppercase tracking-wider" style={{ color: textoSec }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(p.lineas || []).map((l, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${borde}` }}>
                    <td className="py-2 px-1" style={{ color: texto }}>{l.concepto}</td>
                    <td className="py-2 px-1 text-center" style={{ color: texto }}>{l.cantidad}</td>
                    <td className="py-2 px-1 text-right" style={{ color: texto }}>{fmt(l.precio_unitario)} €</td>
                    <td className="py-2 px-1 text-center" style={{ color: textoSec }}>{l.descuento > 0 ? `${l.descuento}%` : '—'}</td>
                    <td className="py-2 px-1 text-center" style={{ color: textoSec }}>{l.tipo_iva}%</td>
                    <td className="py-2 px-1 text-right font-semibold" style={{ color: texto }}>{fmt(calcSubtotal(l))} €</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totales */}
            <div className="flex justify-end">
              <div className="min-w-52">
                {[
                  { label: 'Base imponible', value: fmt(p.base_imponible) + ' €' },
                  { label: 'IVA', value: fmt(p.cuota_iva) + ' €' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between py-1" style={{ borderBottom: `1px solid ${borde}` }}>
                    <span className="text-xs" style={{ color: textoSec }}>{r.label}</span>
                    <span className="text-xs" style={{ color: texto }}>{r.value}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 mt-1">
                  <span className="font-bold text-sm" style={{ color: texto }}>TOTAL</span>
                  <span className="font-bold text-base" style={{ color: primario }}>{fmtCurrency(p.total)}</span>
                </div>
              </div>
            </div>

            {p.notas && (
              <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${borde}` }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: textoSec }}>Notas</p>
                <p className="text-xs" style={{ color: textoSec }}>{p.notas}</p>
              </div>
            )}

            <div className="mt-6 pt-4" style={{ borderTop: `1px solid ${borde}` }}>
              <p className="text-xs text-center" style={{ color: textoSec }}>
                Este presupuesto tiene una validez de {p.validez_dias} días desde su fecha de emisión.
              </p>
            </div>
          </div>
        </div>

        <style>{`@media print { body > *:not(#presupuesto-print) { display: none } }`}</style>
      </div>
    )
  }

  // ── VISTA NUEVO ──
  if (vista === 'nuevo') {
    return (
      <div>
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setVista('lista')} className="text-sm" style={{ color: textoSec }}>← Volver</button>
          <h3 className="font-semibold text-sm" style={{ color: texto }}>Nuevo presupuesto</h3>
        </div>

        {/* Datos cliente */}
        <div className="rounded-xl p-4 mb-4" style={{ border: `1px solid ${borde}` }}>
          <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Cliente</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Nombre', key: 'cliente_nombre', type: 'text', placeholder: 'Juan García' },
              { label: 'Teléfono', key: 'cliente_telefono', type: 'tel', placeholder: '600 000 000' },
              { label: 'Email', key: 'cliente_email', type: 'email', placeholder: 'juan@email.com' },
              { label: 'Matrícula', key: 'matricula', type: 'text', placeholder: '1234ABC' },
              { label: 'Marca', key: 'marca', type: 'text', placeholder: 'Toyota' },
              { label: 'Modelo', key: 'modelo', type: 'text', placeholder: 'Corolla' },
            ].map(f => (
              <div key={f.key}>
                <p className="text-xs mb-1" style={{ color: textoSec }}>{f.label}</p>
                <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-transparent rounded-xl px-3 py-2 text-sm focus:outline-none"
                  style={{ border: `1px solid ${borde}`, color: texto,
                    fontFamily: f.key === 'matricula' ? 'monospace' : undefined,
                    fontWeight: f.key === 'matricula' ? 700 : undefined }} />
              </div>
            ))}
          </div>
          <div className="mt-3">
            <p className="text-xs mb-1" style={{ color: textoSec }}>Descripción del trabajo</p>
            <textarea value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
              placeholder="Descripción detallada del trabajo a realizar…" rows={2}
              className="w-full bg-transparent rounded-xl px-3 py-2 text-sm focus:outline-none resize-none"
              style={{ border: `1px solid ${borde}`, color: texto }} />
          </div>
        </div>

        {/* Líneas */}
        <div className="rounded-xl p-4 mb-4" style={{ border: `1px solid ${borde}` }}>
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs tracking-widest uppercase" style={{ color: textoSec }}>Líneas del presupuesto</p>
            <button onClick={añadirLinea} className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: boton, color: botonTexto }}>+ Añadir</button>
          </div>

          <div className="space-y-3">
            {form.lineas.map((l, i) => (
              <div key={i} className="rounded-xl p-3" style={{ background: fondoSec, border: `1px solid ${borde}` }}>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-medium" style={{ color: textoSec }}>Línea {i + 1}</p>
                  {form.lineas.length > 1 && (
                    <button onClick={() => quitarLinea(i)} className="text-xs" style={{ color: '#ef4444' }}>✕</button>
                  )}
                </div>
                <div className="mb-2 relative">
                  <input type="text" value={l.concepto}
                    onChange={e => { setLinea(i, 'concepto', e.target.value); setBusquedaCatalogo(i) }}
                    onFocus={() => setBusquedaCatalogo(i)}
                    onBlur={() => setTimeout(() => setBusquedaCatalogo(null), 150)}
                    placeholder="Concepto (ej: Cambio de aceite y filtro)"
                    className="w-full bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ border: `1px solid ${borde}`, color: texto }} />
                  {busquedaCatalogo === i && catalogo.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-xl overflow-hidden shadow-lg" style={{ background: fondoClaro ? '#fff' : '#1e293b', border: `1px solid ${borde}` }}>
                      {catalogo
                        .filter(s => !l.concepto || s.nombre.toLowerCase().includes(l.concepto.toLowerCase()))
                        .slice(0, 6)
                        .map(s => (
                          <button key={s.id} type="button"
                            onMouseDown={() => {
                              setForm(prev => {
                                const lineas = [...prev.lineas]
                                lineas[i] = { ...lineas[i], concepto: s.nombre, precio_unitario: s.precio || lineas[i].precio_unitario, tipo_iva: s.tipo_iva || 21, subtotal: (s.precio || 0) * lineas[i].cantidad }
                                return { ...prev, lineas }
                              })
                              setBusquedaCatalogo(null)
                            }}
                            className="w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:opacity-75"
                            style={{ borderBottom: `1px solid ${borde}`, color: texto }}>
                            <span>{s.nombre}{s.descripcion ? <span className="text-xs ml-2" style={{ color: textoSec }}>{s.descripcion}</span> : null}</span>
                            {s.precio && <span className="text-xs font-semibold ml-4 flex-shrink-0" style={{ color: primario }}>{Number(s.precio).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>}
                          </button>
                        ))}
                      {catalogo.filter(s => !l.concepto || s.nombre.toLowerCase().includes(l.concepto.toLowerCase())).length === 0 && (
                        <p className="px-3 py-2 text-xs" style={{ color: textoSec }}>Sin coincidencias en el catálogo</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Cant.', key: 'cantidad', type: 'number', step: '1', min: '0.01' },
                    { label: 'Precio €', key: 'precio_unitario', type: 'number', step: '0.01', min: '0' },
                    { label: 'Dto. %', key: 'descuento', type: 'number', step: '1', min: '0', max: '100' },
                  ].map(f => (
                    <div key={f.key}>
                      <p className="text-xs mb-1" style={{ color: textoSec }}>{f.label}</p>
                      <input type={f.type} value={(l as any)[f.key]} step={f.step} min={f.min}
                        onChange={e => setLinea(i, f.key as keyof Linea, parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                        style={{ border: `1px solid ${borde}`, color: texto }} />
                    </div>
                  ))}
                  <div>
                    <p className="text-xs mb-1" style={{ color: textoSec }}>IVA %</p>
                    <select value={l.tipo_iva} onChange={e => setLinea(i, 'tipo_iva', parseInt(e.target.value))}
                      className="w-full bg-transparent rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                      style={{ border: `1px solid ${borde}`, color: texto }}>
                      {[0, 4, 10, 21].map(v => <option key={v} value={v}>{v}%</option>)}
                    </select>
                  </div>
                </div>
                <div className="text-right mt-2">
                  <span className="text-xs font-semibold" style={{ color: primario }}>
                    Subtotal: {fmt(calcSubtotal(l))} €
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Totales preview */}
          <div className="mt-4 pt-3 flex justify-end" style={{ borderTop: `1px solid ${borde}` }}>
            <div className="min-w-44 space-y-1">
              <div className="flex justify-between text-xs" style={{ color: textoSec }}>
                <span>Base imponible</span><span>{fmt(baseCalc)} €</span>
              </div>
              <div className="flex justify-between text-xs" style={{ color: textoSec }}>
                <span>IVA</span><span>{fmt(ivaCalc)} €</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1" style={{ color: texto, borderTop: `1px solid ${borde}` }}>
                <span>TOTAL</span><span style={{ color: primario }}>{fmtCurrency(totalCalc)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Opciones */}
        <div className="rounded-xl p-4 mb-4" style={{ border: `1px solid ${borde}` }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs mb-1" style={{ color: textoSec }}>Validez (días)</p>
              <input type="number" value={form.validez_dias} onChange={e => setForm(p => ({ ...p, validez_dias: e.target.value }))}
                min="1" max="365"
                className="w-full bg-transparent rounded-xl px-3 py-2 text-sm focus:outline-none"
                style={{ border: `1px solid ${borde}`, color: texto }} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs mb-1" style={{ color: textoSec }}>Notas (aparecen en el documento)</p>
            <textarea value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
              placeholder="Condiciones, garantías, etc." rows={2}
              className="w-full bg-transparent rounded-xl px-3 py-2 text-sm focus:outline-none resize-none"
              style={{ border: `1px solid ${borde}`, color: texto }} />
          </div>
        </div>

        <button onClick={crear} disabled={guardando}
          className="w-full text-sm font-semibold rounded-xl py-3 disabled:opacity-40"
          style={{ background: boton, color: botonTexto }}>
          {guardando ? 'Creando…' : 'Crear presupuesto'}
        </button>
      </div>
    )
  }

  // ── VISTA LISTA ──
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 text-xs" style={{ color: textoSec }}>
          {Object.entries(ESTADOS).map(([key, info]) => {
            const n = presupuestos.filter(p => p.estado === key).length
            return n > 0 ? (
              <span key={key} className="px-2 py-0.5 rounded-full font-medium" style={{ background: info.bg, color: info.color }}>
                {info.label}: {n}
              </span>
            ) : null
          })}
        </div>
        <button onClick={() => { setForm({ ...formVacio }); setVista('nuevo') }}
          className="text-sm px-4 py-2 rounded-xl font-semibold"
          style={{ background: boton, color: botonTexto }}>
          + Nuevo
        </button>
      </div>

      {cargando ? (
        <p className="text-sm" style={{ color: textoSec }}>Cargando…</p>
      ) : presupuestos.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ border: `1px dashed ${borde}` }}>
          <p className="text-3xl mb-3">📋</p>
          <p className="text-sm" style={{ color: textoSec }}>Sin presupuestos todavía</p>
          <button onClick={() => { setForm({ ...formVacio }); setVista('nuevo') }}
            className="mt-3 text-sm px-4 py-2 rounded-xl font-semibold"
            style={{ background: boton, color: botonTexto }}>
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {presupuestos.map(p => {
            const est = ESTADOS[p.estado as keyof typeof ESTADOS] || ESTADOS.borrador
            const vencimiento = new Date(new Date(p.creado_en).getTime() + p.validez_dias * 86400000)
            const vencido = vencimiento < new Date() && p.estado !== 'aceptado' && p.estado !== 'rechazado'
            return (
              <div key={p.id}
                className="rounded-xl p-4 cursor-pointer transition-all hover:shadow-sm"
                style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : fondo }}
                onClick={() => { setSeleccionado(p); setVista('detalle') }}>
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold" style={{ color: texto }}>{p.numero_completo}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: est.bg, color: est.color }}>
                        {est.label}
                      </span>
                      {vencido && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-400">Vencido</span>}
                    </div>
                    <p className="text-sm mt-1 font-medium" style={{ color: texto }}>
                      {p.cliente_nombre || '—'}{p.matricula ? ` · ${p.matricula}` : ''}
                    </p>
                    {p.descripcion && (
                      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: textoSec }}>{p.descripcion}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm" style={{ color: primario }}>{fmtCurrency(p.total)}</p>
                    <p className="text-xs mt-0.5" style={{ color: textoSec }}>
                      {new Date(p.creado_en).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
