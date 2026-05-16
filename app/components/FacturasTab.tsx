'use client'
import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { generarURLQR } from '../lib/verifactu'

interface Item {
  concepto: string
  cantidad: number
  precio_unitario: number
  descuento: number
  tipo_iva: number
  subtotal: number
}

interface Factura {
  id: string
  numero_completo: string
  fecha_expedicion: string
  tipo_factura: string
  descripcion?: string
  items: Item[]
  cliente_nombre?: string
  cliente_nif?: string
  cliente_email?: string
  cliente_direccion?: string
  base_imponible: number
  cuota_iva: number
  importe_total: number
  huella: string
  estado_verifactu: string
  csv_aeat?: string
  xml_verifactu?: string
  estado: string
  notas?: string
  creado_en: string
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
}

const TIPOS_IVA = [0, 4, 10, 21]
const ITEM_VACIO: Item = { concepto: '', cantidad: 1, precio_unitario: 0, descuento: 0, tipo_iva: 21, subtotal: 0 }

function calcSubtotal(i: Item) {
  return Math.round(i.cantidad * i.precio_unitario * (1 - i.descuento / 100) * 100) / 100
}

function fmt(n: number) { return n.toFixed(2).replace('.', ',') + ' €' }
function fmtN(n: number) { return n.toFixed(2) }

export default function FacturasTab({ restaurante, fondo, texto, borde, primario, boton, botonTexto, textoSec, fondoClaro }: Props) {
  const [vista, setVista] = useState<'lista' | 'nueva' | 'detalle'>('lista')
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [facturaActual, setFacturaActual] = useState<Factura | null>(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [enviandoAEAT, setEnviandoAEAT] = useState(false)
  const [mensaje, setMensaje] = useState<{ ok: boolean; txt: string } | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  // ── Form state ──
  const [items, setItems] = useState<Item[]>([{ ...ITEM_VACIO }])
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteNif, setClienteNif] = useState('')
  const [clienteEmail, setClienteEmail] = useState('')
  const [clienteDireccion, setClienteDireccion] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [tipoFactura, setTipoFactura] = useState<'F1' | 'F2'>('F1')
  const [notas, setNotas] = useState('')
  const [fechaExpedicion, setFechaExpedicion] = useState(new Date().toISOString().split('T')[0])

  const fondoSec = fondoClaro ? '#f8fafc' : 'rgba(255,255,255,0.03)'

  async function cargarFacturas() {
    setCargando(true)
    const res = await fetch(`/api/invoices?restaurant_id=${restaurante.id}`)
    const data = await res.json()
    setFacturas(Array.isArray(data) ? data : [])
    setCargando(false)
  }

  useEffect(() => { cargarFacturas() }, [])

  // ── Cálculos ──
  const baseImponible = items.reduce((acc, i) => acc + i.subtotal, 0)
  const cuotaIva = items.reduce((acc, i) => acc + i.subtotal * (i.tipo_iva / 100), 0)
  const importeTotal = baseImponible + cuotaIva
  const grupos = Object.values(
    items.reduce((acc: Record<number, { base: number; cuota: number }>, i) => {
      if (!acc[i.tipo_iva]) acc[i.tipo_iva] = { base: 0, cuota: 0 }
      acc[i.tipo_iva].base += i.subtotal
      acc[i.tipo_iva].cuota += i.subtotal * (i.tipo_iva / 100)
      return acc
    }, {})
  ).map((v, idx) => ({ tipoIva: TIPOS_IVA[idx] ?? 21, ...v }))

  function setItem(idx: number, campo: keyof Item, valor: any) {
    setItems(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [campo]: valor }
      next[idx].subtotal = calcSubtotal(next[idx])
      return next
    })
  }

  function addItem() { setItems(p => [...p, { ...ITEM_VACIO }]) }
  function removeItem(idx: number) { setItems(p => p.filter((_, i) => i !== idx)) }

  async function crearFactura() {
    if (!restaurante.nif) { setMensaje({ ok: false, txt: 'El negocio no tiene NIF configurado. Ve a Ajustes.' }); return }
    if (items.some(i => !i.concepto)) { setMensaje({ ok: false, txt: 'Todos los conceptos deben tener descripción.' }); return }
    setGuardando(true)
    setMensaje(null)
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_id: restaurante.id,
        items,
        cliente_nombre: clienteNombre,
        cliente_nif: clienteNif || null,
        cliente_email: clienteEmail || null,
        cliente_direccion: clienteDireccion || null,
        descripcion: descripcion || null,
        tipo_factura: tipoFactura,
        notas: notas || null,
        fecha_expedicion: fechaExpedicion,
      }),
    })
    const data = await res.json()
    setGuardando(false)
    if (!res.ok) { setMensaje({ ok: false, txt: data.error || 'Error al crear la factura' }); return }
    await cargarFacturas()
    setFacturaActual(data)
    setVista('detalle')
    resetForm()
  }

  function resetForm() {
    setItems([{ ...ITEM_VACIO }])
    setClienteNombre(''); setClienteNif(''); setClienteEmail(''); setClienteDireccion('')
    setDescripcion(''); setNotas(''); setTipoFactura('F1')
    setFechaExpedicion(new Date().toISOString().split('T')[0])
  }

  async function cambiarEstado(id: string, estado: string) {
    await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    setFacturas(prev => prev.map(f => f.id === id ? { ...f, estado } : f))
    if (facturaActual?.id === id) setFacturaActual(prev => prev ? { ...prev, estado } : prev)
  }

  async function enviarAEAT(id: string) {
    setEnviandoAEAT(true)
    setMensaje(null)
    const res = await fetch(`/api/invoices/${id}/verifactu`, { method: 'POST' })
    const data = await res.json()
    setEnviandoAEAT(false)
    if (data.ok) {
      setMensaje({ ok: true, txt: `✓ Enviada a la AEAT. CSV: ${data.csv || 'pendiente'}` })
      setFacturas(prev => prev.map(f => f.id === id ? { ...f, estado_verifactu: 'enviada', csv_aeat: data.csv } : f))
      if (facturaActual?.id === id) setFacturaActual(prev => prev ? { ...prev, estado_verifactu: 'enviada', csv_aeat: data.csv } : prev)
    } else {
      setMensaje({ ok: false, txt: `Error AEAT (${data.codigoError}): ${data.descripcionError}` })
    }
  }

  function imprimir() {
    window.print()
  }

  // ── Badges ──
  function badgeEstado(estado: string) {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      borrador: { label: 'Borrador', color: '#64748b', bg: fondoClaro ? '#f1f5f9' : 'rgba(100,116,139,0.15)' },
      emitida: { label: 'Emitida', color: '#3b82f6', bg: fondoClaro ? '#eff6ff' : 'rgba(59,130,246,0.15)' },
      pagada: { label: 'Pagada', color: '#22c55e', bg: fondoClaro ? '#f0fdf4' : 'rgba(34,197,94,0.15)' },
      anulada: { label: 'Anulada', color: '#ef4444', bg: fondoClaro ? '#fef2f2' : 'rgba(239,68,68,0.15)' },
    }
    return map[estado] || map.borrador
  }

  function badgeVerifactu(ev: string) {
    const map: Record<string, { label: string; color: string }> = {
      pendiente: { label: 'AEAT pendiente', color: '#f59e0b' },
      enviada: { label: 'AEAT ✓', color: '#22c55e' },
      error: { label: 'AEAT error', color: '#ef4444' },
    }
    return map[ev] || map.pendiente
  }

  // ── Vista: Lista ──
  if (vista === 'lista') return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div />
        <button onClick={() => { setVista('nueva'); setMensaje(null) }}
          className="text-xs font-semibold px-4 py-2 rounded-xl"
          style={{ background: boton, color: botonTexto }}>
          + Nueva factura
        </button>
      </div>

      {!restaurante.nif && (
        <div className="rounded-xl p-4 mb-4" style={{ background: fondoClaro ? '#fffbeb' : 'rgba(251,191,36,0.1)', border: '1px solid #fbbf24' }}>
          <p className="text-sm font-medium" style={{ color: texto }}>⚠ NIF no configurado</p>
          <p className="text-xs mt-0.5" style={{ color: textoSec }}>Ve a Ajustes y añade el NIF del negocio para poder emitir facturas.</p>
        </div>
      )}

      {cargando ? (
        <p className="text-sm" style={{ color: textoSec }}>Cargando facturas…</p>
      ) : facturas.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: textoSec }}>No hay facturas todavía</p>
        </div>
      ) : (
        <div>
          {facturas.map(f => {
            const b = badgeEstado(f.estado)
            const bv = badgeVerifactu(f.estado_verifactu)
            return (
              <div key={f.id}
                className="rounded-xl mb-2 p-4 cursor-pointer hover:opacity-90 transition-opacity"
                style={{ border: `1px solid ${borde}` }}
                onClick={() => { setFacturaActual(f); setVista('detalle') }}>
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: texto }}>{f.numero_completo}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: b.color, background: b.bg }}>{b.label}</span>
                      <span className="text-xs" style={{ color: bv.color }}>{bv.label}</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: textoSec }}>
                      {f.cliente_nombre || 'Sin cliente'} · {new Date(f.fecha_expedicion).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <p className="text-sm font-semibold flex-shrink-0" style={{ color: texto }}>{fmt(f.importe_total)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // ── Vista: Nueva factura ──
  if (vista === 'nueva') return (
    <div className="max-w-2xl">
      <button onClick={() => setVista('lista')} className="text-xs mb-4 flex items-center gap-1" style={{ color: textoSec }}>
        ← Volver
      </button>

      {/* Tipo */}
      <div className="rounded-xl p-4 mb-4" style={{ background: fondoSec, border: `1px solid ${borde}` }}>
        <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Tipo de factura</p>
        <div className="flex gap-2">
          {[{ val: 'F1', label: 'F1 — Completa' }, { val: 'F2', label: 'F2 — Simplificada' }].map(t => (
            <button key={t.val} onClick={() => setTipoFactura(t.val as any)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: tipoFactura === t.val ? primario : 'transparent', color: tipoFactura === t.val ? botonTexto : textoSec, border: `1px solid ${tipoFactura === t.val ? primario : borde}` }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fecha */}
      <div className="rounded-xl p-4 mb-4" style={{ background: fondoSec, border: `1px solid ${borde}` }}>
        <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Fecha de expedición</p>
        <input type="date" value={fechaExpedicion} onChange={e => setFechaExpedicion(e.target.value)}
          className="bg-transparent rounded-xl px-3 py-2 text-sm focus:outline-none"
          style={{ border: `1px solid ${borde}`, color: texto }} />
      </div>

      {/* Cliente */}
      <div className="rounded-xl p-4 mb-4" style={{ background: fondoSec, border: `1px solid ${borde}` }}>
        <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Datos del cliente</p>
        <div className="space-y-2">
          {[
            { label: 'Nombre / Razón social', val: clienteNombre, set: setClienteNombre, placeholder: 'Juan García S.L.' },
            { label: 'NIF / CIF', val: clienteNif, set: setClienteNif, placeholder: 'B12345678' },
            { label: 'Email', val: clienteEmail, set: setClienteEmail, placeholder: 'cliente@empresa.com' },
            { label: 'Dirección fiscal', val: clienteDireccion, set: setClienteDireccion, placeholder: 'Calle Mayor 1, 28001 Madrid' },
          ].map(f => (
            <div key={f.label}>
              <p className="text-xs mb-1" style={{ color: textoSec }}>{f.label}</p>
              <input type="text" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                className="w-full bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ border: `1px solid ${borde}`, color: texto }} />
            </div>
          ))}
        </div>
      </div>

      {/* Líneas */}
      <div className="rounded-xl p-4 mb-4" style={{ background: fondoSec, border: `1px solid ${borde}` }}>
        <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Conceptos</p>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="rounded-lg p-3" style={{ border: `1px solid ${borde}` }}>
              <div className="flex gap-2 mb-2">
                <input type="text" value={item.concepto} onChange={e => setItem(idx, 'concepto', e.target.value)}
                  placeholder="Descripción del servicio"
                  className="flex-1 bg-transparent rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                  style={{ border: `1px solid ${borde}`, color: texto }} />
                {items.length > 1 && (
                  <button onClick={() => removeItem(idx)} className="text-xs px-2" style={{ color: textoSec }}>✕</button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Uds', campo: 'cantidad', type: 'number', min: '0.001', step: '0.001' },
                  { label: 'Precio €', campo: 'precio_unitario', type: 'number', min: '0', step: '0.01' },
                  { label: 'Dto %', campo: 'descuento', type: 'number', min: '0', step: '0.01' },
                ].map(f => (
                  <div key={f.campo}>
                    <p className="text-xs mb-1" style={{ color: textoSec }}>{f.label}</p>
                    <input type={f.type} value={(item as any)[f.campo]} min={f.min} step={f.step}
                      onChange={e => setItem(idx, f.campo as keyof Item, parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none"
                      style={{ border: `1px solid ${borde}`, color: texto }} />
                  </div>
                ))}
                <div>
                  <p className="text-xs mb-1" style={{ color: textoSec }}>IVA %</p>
                  <select value={item.tipo_iva} onChange={e => setItem(idx, 'tipo_iva', parseInt(e.target.value))}
                    className="w-full bg-transparent rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                    style={{ border: `1px solid ${borde}`, color: texto, background: fondoClaro ? '#fff' : '#111' }}>
                    {TIPOS_IVA.map(t => <option key={t} value={t}>{t}%</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-right mt-2 font-medium" style={{ color: texto }}>Subtotal: {fmt(item.subtotal)}</p>
            </div>
          ))}
        </div>
        <button onClick={addItem} className="mt-3 text-xs px-3 py-1.5 rounded-lg"
          style={{ border: `1px solid ${borde}`, color: textoSec }}>
          + Añadir línea
        </button>

        {/* Totales */}
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${borde}` }}>
          {Object.entries(
            items.reduce((acc: Record<number, { base: number; cuota: number }>, i) => {
              if (!acc[i.tipo_iva]) acc[i.tipo_iva] = { base: 0, cuota: 0 }
              acc[i.tipo_iva].base += i.subtotal
              acc[i.tipo_iva].cuota += i.subtotal * (i.tipo_iva / 100)
              return acc
            }, {})
          ).map(([tiva, v]) => (
            <div key={tiva} className="flex justify-between text-xs mb-1" style={{ color: textoSec }}>
              <span>Base IVA {tiva}%</span>
              <span>{fmt(v.base)} + {fmt(v.cuota)} IVA</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-bold mt-2" style={{ color: texto }}>
            <span>Total</span>
            <span>{fmt(importeTotal)}</span>
          </div>
        </div>
      </div>

      {/* Descripción / Notas */}
      <div className="rounded-xl p-4 mb-4" style={{ background: fondoSec, border: `1px solid ${borde}` }}>
        <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Descripción de la operación</p>
        <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)}
          placeholder="Servicios de mantenimiento — mayo 2026"
          className="w-full bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none mb-3"
          style={{ border: `1px solid ${borde}`, color: texto }} />
        <p className="text-xs mb-1" style={{ color: textoSec }}>Notas (no aparece en la factura)</p>
        <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
          className="w-full bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
          style={{ border: `1px solid ${borde}`, color: texto }} />
      </div>

      {mensaje && (
        <p className="text-xs py-2 px-3 rounded-lg mb-3" style={{ color: mensaje.ok ? '#22c55e' : '#ef4444', background: mensaje.ok ? '#f0fdf4' : '#fef2f2' }}>
          {mensaje.txt}
        </p>
      )}

      <button onClick={crearFactura} disabled={guardando}
        className="w-full text-sm font-semibold rounded-xl py-3 disabled:opacity-40"
        style={{ background: boton, color: botonTexto }}>
        {guardando ? 'Generando factura…' : 'Emitir factura'}
      </button>
    </div>
  )

  // ── Vista: Detalle ──
  const f = facturaActual
  if (!f) return null

  const bEst = badgeEstado(f.estado)
  const bVer = badgeVerifactu(f.estado_verifactu)
  const qrUrl = restaurante.nif
    ? generarURLQR(restaurante.nif, f.numero_completo, f.fecha_expedicion.replace(/-/g, ''), fmtN(f.importe_total))
    : ''

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setVista('lista')} className="text-xs" style={{ color: textoSec }}>← Volver</button>
        <div className="flex gap-2">
          <button onClick={imprimir}
            className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ border: `1px solid ${borde}`, color: textoSec }}>
            🖨 Imprimir / PDF
          </button>
          {f.estado_verifactu !== 'enviada' && (
            <button onClick={() => enviarAEAT(f.id)} disabled={enviandoAEAT}
              className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-40"
              style={{ background: primario, color: botonTexto }}>
              {enviandoAEAT ? 'Enviando…' : 'Enviar a AEAT'}
            </button>
          )}
        </div>
      </div>

      {/* Estado */}
      <div className="flex gap-2 flex-wrap mb-4">
        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ color: bEst.color, background: bEst.bg }}>{bEst.label}</span>
        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ color: bVer.color, background: fondoClaro ? '#f8fafc' : 'rgba(255,255,255,0.05)' }}>{bVer.label}</span>
        {f.csv_aeat && <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ color: '#22c55e', background: '#f0fdf4' }}>CSV: {f.csv_aeat}</span>}
      </div>

      {/* Cambiar estado */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['emitida', 'pagada', 'anulada'].filter(e => e !== f.estado).map(e => (
          <button key={e} onClick={() => cambiarEstado(f.id, e)}
            className="text-xs px-3 py-1 rounded-lg"
            style={{ border: `1px solid ${borde}`, color: textoSec }}>
            Marcar como {e}
          </button>
        ))}
      </div>

      {mensaje && (
        <p className="text-xs py-2 px-3 rounded-lg mb-4" style={{ color: mensaje.ok ? '#22c55e' : '#ef4444', background: mensaje.ok ? '#f0fdf4' : '#fef2f2' }}>
          {mensaje.txt}
        </p>
      )}

      {/* Factura imprimible */}
      <div ref={printRef} className="rounded-xl p-6 print:rounded-none print:p-8 print:shadow-none"
        style={{ background: '#ffffff', border: `1px solid ${borde}`, color: '#111' }}>
        {/* Cabecera */}
        <div className="flex justify-between items-start mb-8">
          <div>
            {restaurante.logo_url && <img src={restaurante.logo_url} alt={restaurante.nombre} className="h-12 object-contain mb-2" />}
            <p className="text-lg font-bold text-gray-900">{restaurante.nombre}</p>
            {restaurante.nif && <p className="text-sm text-gray-500">NIF: {restaurante.nif}</p>}
            {restaurante.direccion_fiscal && <p className="text-sm text-gray-500">{restaurante.direccion_fiscal}</p>}
            {(restaurante.codigo_postal_fiscal || restaurante.ciudad_fiscal) && (
              <p className="text-sm text-gray-500">{[restaurante.codigo_postal_fiscal, restaurante.ciudad_fiscal].filter(Boolean).join(' ')}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">FACTURA</p>
            <p className="text-sm font-semibold text-gray-700 mt-1">{f.numero_completo}</p>
            <p className="text-sm text-gray-500">{new Date(f.fecha_expedicion).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            <p className="text-xs mt-1 px-2 py-0.5 rounded inline-block" style={{ background: '#f1f5f9', color: '#475569' }}>{f.tipo_factura === 'F1' ? 'Factura completa' : 'Factura simplificada'}</p>
          </div>
        </div>

        {/* Cliente */}
        {(f.cliente_nombre || f.cliente_nif) && (
          <div className="mb-6 p-4 rounded-lg" style={{ background: '#f8fafc' }}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Facturar a</p>
            {f.cliente_nombre && <p className="text-sm font-semibold text-gray-900">{f.cliente_nombre}</p>}
            {f.cliente_nif && <p className="text-sm text-gray-500">NIF: {f.cliente_nif}</p>}
            {f.cliente_direccion && <p className="text-sm text-gray-500">{f.cliente_direccion}</p>}
            {f.cliente_email && <p className="text-sm text-gray-500">{f.cliente_email}</p>}
          </div>
        )}

        {/* Líneas */}
        <table className="w-full mb-6 text-sm">
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">Concepto</th>
              <th className="text-right pb-2 text-xs font-semibold text-gray-400 uppercase tracking-widest w-16">Uds</th>
              <th className="text-right pb-2 text-xs font-semibold text-gray-400 uppercase tracking-widest w-24">P. unit.</th>
              <th className="text-right pb-2 text-xs font-semibold text-gray-400 uppercase tracking-widest w-16">Dto.</th>
              <th className="text-right pb-2 text-xs font-semibold text-gray-400 uppercase tracking-widest w-16">IVA</th>
              <th className="text-right pb-2 text-xs font-semibold text-gray-400 uppercase tracking-widest w-24">Total</th>
            </tr>
          </thead>
          <tbody>
            {f.items.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td className="py-2 text-gray-800">{item.concepto}</td>
                <td className="py-2 text-right text-gray-600">{item.cantidad}</td>
                <td className="py-2 text-right text-gray-600">{fmtN(item.precio_unitario)} €</td>
                <td className="py-2 text-right text-gray-600">{item.descuento > 0 ? `${item.descuento}%` : '—'}</td>
                <td className="py-2 text-right text-gray-600">{item.tipo_iva}%</td>
                <td className="py-2 text-right font-medium text-gray-900">{fmtN(item.subtotal)} €</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="flex justify-end mb-6">
          <div className="w-64">
            {Object.entries(
              f.items.reduce((acc: Record<number, { base: number; cuota: number }>, i) => {
                if (!acc[i.tipo_iva]) acc[i.tipo_iva] = { base: 0, cuota: 0 }
                acc[i.tipo_iva].base += i.subtotal
                acc[i.tipo_iva].cuota += i.subtotal * (i.tipo_iva / 100)
                return acc
              }, {})
            ).map(([tiva, v]) => (
              <div key={tiva}>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Base imponible ({tiva}% IVA)</span><span>{fmtN(v.base)} €</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>IVA {tiva}%</span><span>{fmtN(v.cuota)} €</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 mt-1" style={{ borderTop: '2px solid #e2e8f0' }}>
              <span>TOTAL</span><span>{fmtN(f.importe_total)} €</span>
            </div>
          </div>
        </div>

        {/* Verifactu */}
        <div className="flex items-start gap-4 pt-4" style={{ borderTop: '1px solid #e2e8f0' }}>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Verificación Verifactu</p>
            <p className="text-xs text-gray-400 font-mono break-all">{f.huella}</p>
            {f.csv_aeat && <p className="text-xs text-gray-500 mt-1">CSV AEAT: <span className="font-mono">{f.csv_aeat}</span></p>}
          </div>
          {qrUrl && (
            <div className="flex-shrink-0">
              <QRCodeSVG value={qrUrl} size={72} />
              <p className="text-xs text-gray-400 text-center mt-1">AEAT</p>
            </div>
          )}
        </div>
      </div>

      {/* XML descargable */}
      <div className="mt-4 print:hidden">
        <button
          onClick={() => {
            const blob = new Blob([f.xml_verifactu || ''], { type: 'application/xml' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = `${f.numero_completo}-verifactu.xml`; a.click()
          }}
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{ border: `1px solid ${borde}`, color: textoSec }}>
          ⬇ Descargar XML Verifactu
        </button>
      </div>
    </div>
  )
}
