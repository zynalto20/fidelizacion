'use client'
import { useState, useEffect, useRef } from 'react'

interface Orden {
  id: string
  numero: number
  numero_completo: string
  estado: string
  bloqueada?: boolean
  motivo_bloqueo?: string
  cliente_nombre?: string
  cliente_telefono?: string
  cliente_email?: string
  matricula?: string
  marca?: string
  modelo?: string
  anio?: number
  km_entrada?: number
  color?: string
  descripcion_problema?: string
  diagnostico?: string
  trabajos_realizados?: string
  fecha_entrada: string
  fecha_estimada?: string
  fecha_entrega?: string
  presupuesto?: number
  notas?: string
  creado_en: string
}

const MENSAJES_WA: Record<string, { emoji: string; titulo: string; cuerpo: string }> = {
  diagnostico:      { emoji: '🔍', titulo: 'Estamos revisando tu vehículo', cuerpo: 'Nuestros técnicos están realizando el diagnóstico. Te informaremos en breve.' },
  esperando_piezas: { emoji: '📦', titulo: 'Esperando llegada de piezas',   cuerpo: 'El diagnóstico está listo. Estamos a la espera de recibir los repuestos necesarios.' },
  reparacion:       { emoji: '🔧', titulo: 'Tu vehículo está en reparación', cuerpo: 'Nuestros mecánicos ya están trabajando en tu vehículo.' },
  terminado:        { emoji: '✅', titulo: '¡Tu vehículo está listo!',        cuerpo: 'La reparación ha finalizado. Puedes pasar a recogerlo cuando quieras.' },
  entregado:        { emoji: '🏁', titulo: 'Vehículo entregado',              cuerpo: 'Gracias por confiar en nosotros. Esperamos verte de nuevo pronto.' },
}

function buildMensajeWA(orden: Orden, nuevoEstado: string, nombreTaller: string): string {
  const msg = MENSAJES_WA[nuevoEstado]
  if (!msg) return ''
  const nombre = orden.cliente_nombre ? orden.cliente_nombre.split(' ')[0] : ''
  const vehiculo = [orden.matricula, orden.marca, orden.modelo].filter(Boolean).join(' ')
  const extra = nuevoEstado === 'terminado' && orden.presupuesto
    ? `\n💰 Importe: ${Number(orden.presupuesto).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`
    : ''
  return `${nombre ? `Hola ${nombre}, ` : ''}te escribimos desde *${nombreTaller}*.

${msg.emoji} *${msg.titulo}*${vehiculo ? `\n🚗 ${vehiculo}` : ''}
${msg.cuerpo}${extra}`
}

const COLUMNAS = [
  { key: 'recibido',         label: 'Recibido',          color: '#64748b', bg: '#f1f5f9' },
  { key: 'diagnostico',      label: 'Diagnóstico',        color: '#f59e0b', bg: '#fffbeb' },
  { key: 'esperando_piezas', label: 'Esperando piezas',   color: '#f97316', bg: '#fff7ed' },
  { key: 'reparacion',       label: 'En reparación',      color: '#3b82f6', bg: '#eff6ff' },
  { key: 'terminado',        label: 'Terminado',          color: '#8b5cf6', bg: '#f5f3ff' },
  { key: 'entregado',        label: 'Entregado',          color: '#22c55e', bg: '#f0fdf4' },
]

const FORM_VACIO = {
  cliente_nombre: '', cliente_telefono: '', cliente_email: '',
  matricula: '', marca: '', modelo: '', anio: '', km_entrada: '', color: '',
  descripcion_problema: '', fecha_entrada: new Date().toISOString().split('T')[0],
  fecha_estimada: '', presupuesto: '', notas: '',
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

export default function OrdenesTab({ restaurante, fondo, texto, borde, primario, boton, botonTexto, textoSec, fondoClaro }: Props) {
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [cargando, setCargando] = useState(true)
  const [vistaDetalle, setVistaDetalle] = useState<Orden | null>(null)
  const [formAbierto, setFormAbierto] = useState(false)
  const [form, setForm] = useState({ ...FORM_VACIO })
  const [guardando, setGuardando] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [editando, setEditando] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Orden>>({})
  const [guardandoEdit, setGuardandoEdit] = useState(false)
  const [buscando, setBuscando] = useState('')
  const [presupuestosOrden, setPresupuestosOrden] = useState<any[]>([])
  const [cargandoPresup, setCargandoPresup] = useState(false)
  const [eventos, setEventos] = useState<any[]>([])
  const [nuevaNota, setNuevaNota] = useState('')
  const [guardandoNota, setGuardandoNota] = useState(false)
  const [notifModal, setNotifModal] = useState<{ orden: Orden; nuevoEstado: string; mensaje: string } | null>(null)
  const [notifMensajeEdit, setNotifMensajeEdit] = useState('')
  const [bloqueoModal, setBloqueoModal] = useState<Orden | null>(null)
  const [motivoBloqueo, setMotivoBloqueo] = useState('')
  const [piezasOrden, setPiezasOrden] = useState<any[]>([])
  const [cargandoPiezas, setCargandoPiezas] = useState(false)
  const [piezaModal, setPiezaModal] = useState(false)
  const [stockDisponible, setStockDisponible] = useState<any[]>([])
  const [piezaForm, setPiezaForm] = useState({ stock_id: '', nombre: '', referencia: '', cantidad: '1', precio_coste: '', precio_venta: '' })
  const [guardandoPieza, setGuardandoPieza] = useState(false)
  const [busquedaPieza, setBusquedaPieza] = useState('')
  const [checklist, setChecklist] = useState<any[]>([])
  const [checklistAbierto, setChecklistAbierto] = useState(false)
  const [inicializandoChecklist, setInicializandoChecklist] = useState(false)

  const fondoSec = fondoClaro ? '#f8fafc' : 'rgba(255,255,255,0.03)'
  const [buscandoMatricula, setBuscandoMatricula] = useState(false)
  const [buscandoMatriculaEdit, setBuscandoMatriculaEdit] = useState(false)

  async function lookupMatricula(matricula: string, modo: 'nuevo' | 'editar') {
    if (!matricula || matricula.length < 4) return
    const set = modo === 'nuevo' ? setBuscandoMatricula : setBuscandoMatriculaEdit
    set(true)
    try {
      const res = await fetch('/api/matricula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricula }),
      })
      const json = await res.json()
      if (json.encontrado && json.datos) {
        const d = json.datos
        if (modo === 'nuevo') {
          setForm(prev => ({
            ...prev,
            marca: d.marca || prev.marca,
            modelo: d.modelo || prev.modelo,
            anio: d.anio ? String(d.anio) : prev.anio,
            color: d.color || prev.color,
          }))
        } else {
          setEditForm(prev => ({
            ...prev,
            marca: d.marca || prev.marca,
            modelo: d.modelo || prev.modelo,
            anio: d.anio || prev.anio,
            color: d.color || prev.color,
          }))
        }
      }
    } catch { /* ignorar errores de red */ }
    set(false)
  }

  async function cargar() {
    setCargando(true)
    const res = await fetch(`/api/orders?restaurant_id=${restaurante.id}`)
    const data = await res.json()
    setOrdenes(Array.isArray(data) ? data : [])
    setCargando(false)
  }

  async function bloquearOrden(orden: Orden, motivo: string) {
    const res = await fetch(`/api/orders/${orden.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bloqueada: true, motivo_bloqueo: motivo }),
    })
    const data = await res.json()
    if (res.ok) {
      setOrdenes(prev => prev.map(o => o.id === data.id ? data : o))
      if (vistaDetalle?.id === data.id) setVistaDetalle(data)
      cargarEventos(data.id)
    }
    setBloqueoModal(null)
    setMotivoBloqueo('')
  }

  async function desbloquearOrden(orden: Orden) {
    const res = await fetch(`/api/orders/${orden.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bloqueada: false, motivo_bloqueo: null }),
    })
    const data = await res.json()
    if (res.ok) {
      setOrdenes(prev => prev.map(o => o.id === data.id ? data : o))
      if (vistaDetalle?.id === data.id) setVistaDetalle(data)
      cargarEventos(data.id)
    }
  }

  useEffect(() => { cargar() }, [])

  // ── Cambio de estado centralizado ──
  async function aplicarCambioEstado(orden: Orden, nuevoEstado: string) {
    if (orden.estado === nuevoEstado) return
    const extra: any = {}
    if (nuevoEstado === 'entregado') extra.fecha_entrega = new Date().toISOString().split('T')[0]

    const res = await fetch(`/api/orders/${orden.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado, ...extra }),
    })
    const data = await res.json()
    if (res.ok) {
      setOrdenes(prev => prev.map(o => o.id === data.id ? data : o))
      if (vistaDetalle?.id === data.id) setVistaDetalle(data)
      cargarEventos(data.id)

      // Mostrar modal de notificación si hay teléfono y hay mensaje para este estado
      if (orden.cliente_telefono && MENSAJES_WA[nuevoEstado]) {
        const msg = buildMensajeWA({ ...orden, ...extra }, nuevoEstado, restaurante.nombre)
        setNotifMensajeEdit(msg)
        setNotifModal({ orden: { ...orden, ...extra }, nuevoEstado, mensaje: msg })
      }
    }
  }

  // ── Drag & Drop ──
  function onDragStart(id: string) { setDraggingId(id) }
  function onDragEnd() { setDraggingId(null); setDragOverCol(null) }

  async function onDrop(nuevoEstado: string) {
    if (!draggingId) return
    const orden = ordenes.find(o => o.id === draggingId)
    if (!orden || orden.estado === nuevoEstado) return
    setOrdenes(prev => prev.map(o => o.id === draggingId ? { ...o, estado: nuevoEstado } : o))
    setDraggingId(null)
    setDragOverCol(null)
    await aplicarCambioEstado(orden, nuevoEstado)
  }

  // ── Crear orden ──
  async function crearOrden() {
    setGuardando(true)
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_id: restaurante.id,
        ...form,
        anio: form.anio ? parseInt(form.anio) : null,
        km_entrada: form.km_entrada ? parseInt(form.km_entrada) : null,
        presupuesto: form.presupuesto ? parseFloat(form.presupuesto) : null,
        fecha_estimada: form.fecha_estimada || null,
      }),
    })
    const data = await res.json()
    setGuardando(false)
    if (res.ok) {
      setOrdenes(prev => [data, ...prev])
      setFormAbierto(false)
      setForm({ ...FORM_VACIO })
    }
  }

  // ── Guardar edición ──
  async function guardarEdicion() {
    if (!vistaDetalle) return
    setGuardandoEdit(true)
    const res = await fetch(`/api/orders/${vistaDetalle.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    const data = await res.json()
    setGuardandoEdit(false)
    if (res.ok) {
      setOrdenes(prev => prev.map(o => o.id === data.id ? data : o))
      setVistaDetalle(data)
      setEditando(false)
      cargarEventos(data.id)
    }
  }

  // ── Eliminar ──
  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta orden?')) return
    await fetch(`/api/orders/${id}`, { method: 'DELETE' })
    setOrdenes(prev => prev.filter(o => o.id !== id))
    setVistaDetalle(null)
  }

  async function cargarPresupuestosOrden(orderId: string) {
    setCargandoPresup(true)
    const res = await fetch(`/api/presupuestos?restaurant_id=${restaurante.id}&order_id=${orderId}`)
    const data = await res.json()
    setPresupuestosOrden(Array.isArray(data) ? data : [])
    setCargandoPresup(false)
  }

  async function crearPresupuestoDesdeOrden(o: Orden) {
    const res = await fetch('/api/presupuestos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_id: restaurante.id,
        order_id: o.id,
        cliente_nombre: o.cliente_nombre,
        cliente_telefono: o.cliente_telefono,
        cliente_email: o.cliente_email,
        matricula: o.matricula,
        marca: o.marca,
        modelo: o.modelo,
        descripcion: o.descripcion_problema,
        lineas: [{ concepto: o.descripcion_problema || 'Trabajos de reparación', cantidad: 1, precio_unitario: o.presupuesto || 0, descuento: 0, tipo_iva: 21, subtotal: o.presupuesto || 0 }],
        validez_dias: 30,
      }),
    })
    const data = await res.json()
    if (res.ok) setPresupuestosOrden(prev => [data, ...prev])
  }

  async function cargarEventos(orderId: string) {
    const res = await fetch(`/api/orders/${orderId}/events`)
    const data = await res.json()
    setEventos(Array.isArray(data) ? data : [])
  }

  async function cargarPiezas(orderId: string) {
    setCargandoPiezas(true)
    const res = await fetch(`/api/orders/${orderId}/piezas`)
    const data = await res.json()
    setPiezasOrden(Array.isArray(data) ? data : [])
    setCargandoPiezas(false)
  }

  async function cargarStock() {
    const res = await fetch(`/api/stock?restaurant_id=${restaurante.id}`)
    const data = await res.json()
    setStockDisponible(Array.isArray(data) ? data : [])
  }

  function seleccionarStockPieza(pieza: any) {
    setPiezaForm({
      stock_id: pieza.id,
      nombre: pieza.nombre,
      referencia: pieza.referencia || '',
      cantidad: '1',
      precio_coste: pieza.precio_coste ? String(pieza.precio_coste) : '',
      precio_venta: pieza.precio_venta ? String(pieza.precio_venta) : '',
    })
    setBusquedaPieza('')
  }

  async function guardarPieza() {
    if (!vistaDetalle || !piezaForm.nombre || !piezaForm.cantidad) return
    setGuardandoPieza(true)
    await fetch(`/api/orders/${vistaDetalle.id}/piezas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(piezaForm),
    })
    await cargarPiezas(vistaDetalle.id)
    await cargarEventos(vistaDetalle.id)
    setPiezaModal(false)
    setPiezaForm({ stock_id: '', nombre: '', referencia: '', cantidad: '1', precio_coste: '', precio_venta: '' })
    setBusquedaPieza('')
    setGuardandoPieza(false)
  }

  async function eliminarPieza(pieza_id: string) {
    if (!vistaDetalle) return
    await fetch(`/api/orders/${vistaDetalle.id}/piezas?pieza_id=${pieza_id}`, { method: 'DELETE' })
    await cargarPiezas(vistaDetalle.id)
  }

  async function cargarChecklist(orderId: string) {
    const res = await fetch(`/api/orders/${orderId}/checklist`)
    const data = await res.json()
    setChecklist(Array.isArray(data) ? data : [])
  }

  async function inicializarChecklist(orderId: string) {
    setInicializandoChecklist(true)
    await fetch(`/api/orders/${orderId}/checklist`, { method: 'POST' })
    await cargarChecklist(orderId)
    setChecklistAbierto(true)
    setInicializandoChecklist(false)
  }

  async function actualizarItemChecklist(itemId: string, estado: string, notas?: string) {
    if (!vistaDetalle) return
    await fetch(`/api/orders/${vistaDetalle.id}/checklist`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, estado, notas }),
    })
    setChecklist(prev => prev.map(i => i.id === itemId ? { ...i, estado, notas: notas ?? i.notas } : i))
  }

  async function agregarNota() {
    if (!vistaDetalle || !nuevaNota.trim()) return
    setGuardandoNota(true)
    await fetch(`/api/orders/${vistaDetalle.id}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'nota_manual', descripcion: nuevaNota.trim(), usuario: 'Taller' }),
    })
    setNuevaNota('')
    await cargarEventos(vistaDetalle.id)
    setGuardandoNota(false)
  }

  function abrirDetalle(o: Orden) {
    setVistaDetalle(o)
    cargarPresupuestosOrden(o.id)
    cargarEventos(o.id)
    cargarPiezas(o.id)
    cargarStock()
    cargarChecklist(o.id)
    setChecklistAbierto(false)
    setEditForm({
      cliente_nombre: o.cliente_nombre || '',
      cliente_telefono: o.cliente_telefono || '',
      cliente_email: o.cliente_email || '',
      matricula: o.matricula || '',
      marca: o.marca || '',
      modelo: o.modelo || '',
      anio: o.anio,
      km_entrada: o.km_entrada,
      color: o.color || '',
      descripcion_problema: o.descripcion_problema || '',
      diagnostico: o.diagnostico || '',
      trabajos_realizados: o.trabajos_realizados || '',
      fecha_entrada: o.fecha_entrada,
      fecha_estimada: o.fecha_estimada || '',
      fecha_entrega: o.fecha_entrega || '',
      presupuesto: o.presupuesto,
      notas: o.notas || '',
    })
    setEditando(false)
  }

  // ── Helpers ──
  function col(key: string) { return COLUMNAS.find(c => c.key === key)! }
  function vehiculoStr(o: Orden) {
    const parts = [o.matricula, [o.marca, o.modelo].filter(Boolean).join(' ')].filter(Boolean)
    return parts.join(' · ') || 'Sin vehículo'
  }

  function imprimirFicha(o: Orden) {
    const c = COLUMNAS.find(x => x.key === o.estado)!
    const totalPiezas = piezasOrden.reduce((acc, p) => acc + (p.precio_venta || 0) * p.cantidad, 0)
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ficha ${o.numero_completo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #1e293b; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
    .taller { font-size: 18px; font-weight: 700; }
    .numero { font-family: monospace; font-size: 20px; font-weight: 900; color: ${primario}; }
    .estado-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: ${c.bg}; color: ${c.color}; border: 1px solid ${c.color}40; }
    .section { margin-bottom: 16px; }
    .section-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
    .field { margin-bottom: 6px; }
    .field-label { font-size: 10px; color: #64748b; margin-bottom: 2px; }
    .field-value { font-size: 13px; color: #0f172a; font-weight: 500; }
    .matricula { font-family: monospace; font-size: 18px; font-weight: 900; letter-spacing: 2px; }
    .textarea-val { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; margin-top: 4px; line-height: 1.5; min-height: 40px; white-space: pre-wrap; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; text-align: left; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
    td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
    .total-row td { font-weight: 700; font-size: 13px; border-top: 2px solid #e2e8f0; }
    .firma-box { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; }
    .firma { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; height: 80px; display: flex; flex-direction: column; justify-content: flex-end; }
    .firma-label { font-size: 10px; color: #94a3b8; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="taller">${restaurante.nombre}</div>
      ${restaurante.direccion ? `<div style="font-size:11px;color:#64748b;margin-top:2px">${restaurante.direccion}</div>` : ''}
      ${restaurante.telefono ? `<div style="font-size:11px;color:#64748b">${restaurante.telefono}</div>` : ''}
      <div style="font-size:11px;color:#94a3b8;margin-top:4px">${new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
    </div>
    <div style="text-align:right">
      <div class="numero">${o.numero_completo}</div>
      <div style="margin-top:6px"><span class="estado-badge">${c.label}</span></div>
    </div>
  </div>

  <div class="grid2">
    <div>
      <div class="section">
        <div class="section-title">Cliente</div>
        <div class="field"><div class="field-value">${o.cliente_nombre || '—'}</div></div>
        ${o.cliente_telefono ? `<div class="field"><div class="field-label">Teléfono</div><div class="field-value">${o.cliente_telefono}</div></div>` : ''}
        ${o.cliente_email ? `<div class="field"><div class="field-label">Email</div><div class="field-value">${o.cliente_email}</div></div>` : ''}
      </div>
    </div>
    <div>
      <div class="section">
        <div class="section-title">Vehículo</div>
        ${o.matricula ? `<div class="field"><div class="matricula">${o.matricula}</div></div>` : ''}
        <div class="field"><div class="field-value">${[o.marca, o.modelo, o.anio].filter(Boolean).join(' ')}</div></div>
        ${o.color ? `<div class="field"><div class="field-label">Color</div><div class="field-value">${o.color}</div></div>` : ''}
        ${o.km_entrada ? `<div class="field"><div class="field-label">KM entrada</div><div class="field-value">${Number(o.km_entrada).toLocaleString('es-ES')} km</div></div>` : ''}
      </div>
    </div>
  </div>

  <div class="grid2" style="margin-bottom:0">
    <div class="field"><div class="field-label">Fecha entrada</div><div class="field-value">${o.fecha_entrada ? new Date(o.fecha_entrada + 'T00:00:00').toLocaleDateString('es-ES') : '—'}</div></div>
    <div class="field"><div class="field-label">Entrega estimada</div><div class="field-value">${o.fecha_estimada ? new Date(o.fecha_estimada + 'T00:00:00').toLocaleDateString('es-ES') : '—'}</div></div>
  </div>

  ${o.descripcion_problema ? `<div class="section" style="margin-top:16px"><div class="section-title">Problema reportado</div><div class="textarea-val">${o.descripcion_problema}</div></div>` : ''}
  ${o.diagnostico ? `<div class="section"><div class="section-title">Diagnóstico</div><div class="textarea-val">${o.diagnostico}</div></div>` : ''}
  ${o.trabajos_realizados ? `<div class="section"><div class="section-title">Trabajos realizados</div><div class="textarea-val">${o.trabajos_realizados}</div></div>` : ''}

  ${piezasOrden.length > 0 ? `
  <div class="section">
    <div class="section-title">Piezas utilizadas</div>
    <table>
      <thead><tr><th>Pieza</th><th>Ref.</th><th style="text-align:right">Cant.</th><th style="text-align:right">P. unit.</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>
        ${piezasOrden.map(p => `<tr>
          <td>${p.nombre}</td>
          <td style="color:#94a3b8">${p.referencia || '—'}</td>
          <td style="text-align:right">${p.cantidad}</td>
          <td style="text-align:right">${p.precio_venta ? Number(p.precio_venta).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) : '—'}</td>
          <td style="text-align:right;font-weight:600">${p.precio_venta ? Number(p.precio_venta * p.cantidad).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) : '—'}</td>
        </tr>`).join('')}
        ${totalPiezas > 0 ? `<tr class="total-row"><td colspan="4">Total piezas</td><td style="text-align:right">${totalPiezas.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td></tr>` : ''}
      </tbody>
    </table>
  </div>` : ''}

  ${o.presupuesto ? `<div style="text-align:right;margin-top:12px;padding:12px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0"><span style="font-size:15px;font-weight:700;color:#16a34a">Presupuesto total: ${Number(o.presupuesto).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span></div>` : ''}

  ${checklist.filter(i => i.estado !== 'pendiente').length > 0 ? `
  <div class="section" style="margin-top:16px">
    <div class="section-title">Checklist de recepción</div>
    <table>
      <thead><tr><th>Elemento</th><th>Categoría</th><th>Estado</th><th>Notas</th></tr></thead>
      <tbody>
        ${checklist.filter(i => i.estado !== 'pendiente').map(i => `<tr>
          <td>${i.item}</td>
          <td style="color:#94a3b8;font-size:11px">${i.categoria}</td>
          <td style="font-weight:600;color:${i.estado === 'ok' ? '#16a34a' : i.estado === 'mal' ? '#dc2626' : '#94a3b8'}">${i.estado === 'ok' ? '✓ OK' : i.estado === 'mal' ? '✗ Incidencia' : '— N/A'}</td>
          <td style="color:#64748b;font-size:11px">${i.notas || ''}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}
  ${o.notas ? `<div class="section" style="margin-top:16px"><div class="section-title">Notas internas</div><div class="textarea-val" style="color:#64748b">${o.notas}</div></div>` : ''}

  <div class="firma-box">
    <div class="firma"><div class="firma-label">Firma del cliente</div></div>
    <div class="firma"><div class="firma-label">Firma del taller</div></div>
  </div>
</body>
</html>`
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.onload = () => w.print()
  }

  const [soloBlockeadas, setSoloBlockeadas] = useState(false)
  const ordenesFiltradas = ordenes
    .filter(o => !soloBlockeadas || o.bloqueada)
    .filter(o => !buscando.trim() ||
      [o.cliente_nombre, o.matricula, o.marca, o.modelo, o.numero_completo]
        .some(v => v?.toLowerCase().includes(buscando.toLowerCase()))
    )

  // ── VISTA DETALLE ──
  if (vistaDetalle) {
    const c = col(vistaDetalle.estado)
    return (
      <div className="max-w-2xl">
        <BloqueoModal />
        <NotifModal />
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setVistaDetalle(null)} className="text-xs" style={{ color: textoSec }}>← Volver</button>
          <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ color: c.color, background: fondoClaro ? c.bg : `${c.color}20` }}>{c.label}</span>
          <span className="text-xs font-mono" style={{ color: textoSec }}>{vistaDetalle.numero_completo}</span>
          <div className="flex-1" />
          {!editando
            ? <button onClick={() => setEditando(true)} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ border: `1px solid ${primario}`, color: primario }}>Editar</button>
            : <>
                <button onClick={guardarEdicion} disabled={guardandoEdit} className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-40" style={{ background: boton, color: botonTexto }}>{guardandoEdit ? 'Guardando…' : 'Guardar'}</button>
                <button onClick={() => setEditando(false)} className="text-xs px-3 py-1.5 rounded-lg" style={{ border: `1px solid ${borde}`, color: textoSec }}>Cancelar</button>
              </>
          }
          {vistaDetalle.bloqueada ? (
            <button
              onClick={() => desbloquearOrden(vistaDetalle)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}>
              🔴 Desbloquear
            </button>
          ) : (
            <button
              onClick={() => { setBloqueoModal(vistaDetalle); setMotivoBloqueo('') }}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ border: `1px solid ${borde}`, color: textoSec }}>
              🔴 Bloquear
            </button>
          )}
          <button onClick={() => imprimirFicha(vistaDetalle)} className="text-xs px-3 py-1.5 rounded-lg" style={{ border: `1px solid ${borde}`, color: textoSec }}>🖨️ Imprimir</button>
          <button onClick={() => eliminar(vistaDetalle.id)} className="text-xs px-2 py-1.5 rounded-lg" style={{ color: '#ef4444' }}>🗑</button>
        </div>

        {/* Banner bloqueo */}
        {vistaDetalle.bloqueada && (
          <div className="mb-4 px-4 py-3 rounded-xl flex items-start gap-3" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <span className="text-lg flex-shrink-0">🔴</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>Orden bloqueada</p>
              <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>{vistaDetalle.motivo_bloqueo || 'Sin motivo especificado'}</p>
            </div>
            <button onClick={() => desbloquearOrden(vistaDetalle)} className="text-xs px-2.5 py-1.5 rounded-lg flex-shrink-0 font-medium" style={{ background: '#ef4444', color: '#fff' }}>
              Desbloquear
            </button>
          </div>
        )}

        {/* Cambiar estado */}
        <div className="mb-4">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: textoSec }}>Estado</p>
          <div className="flex gap-1.5 flex-wrap">
            {COLUMNAS.map(col => (
              <button key={col.key}
                onClick={() => aplicarCambioEstado(vistaDetalle, col.key)}
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{
                  background: vistaDetalle.estado === col.key ? col.color : 'transparent',
                  color: vistaDetalle.estado === col.key ? '#fff' : textoSec,
                  border: `1px solid ${vistaDetalle.estado === col.key ? col.color : borde}`,
                }}>
                {col.label}
              </button>
            ))}
          </div>
        </div>

        {/* Campos */}
        {[
          { section: 'Cliente', fields: [
            { label: 'Nombre', key: 'cliente_nombre', type: 'text' },
            { label: 'Teléfono', key: 'cliente_telefono', type: 'tel' },
            { label: 'Email', key: 'cliente_email', type: 'email' },
          ]},
          { section: 'Vehículo', fields: [
            { label: 'Matrícula', key: 'matricula', type: 'text' },
            { label: 'Marca', key: 'marca', type: 'text' },
            { label: 'Modelo', key: 'modelo', type: 'text' },
            { label: 'Año', key: 'anio', type: 'number' },
            { label: 'KM entrada', key: 'km_entrada', type: 'number' },
            { label: 'Color', key: 'color', type: 'text' },
          ]},
          { section: 'Trabajo', fields: [
            { label: 'Descripción del problema', key: 'descripcion_problema', type: 'textarea' },
            { label: 'Diagnóstico del taller', key: 'diagnostico', type: 'textarea' },
            { label: 'Trabajos realizados', key: 'trabajos_realizados', type: 'textarea' },
          ]},
          { section: 'Fechas y presupuesto', fields: [
            { label: 'Fecha entrada', key: 'fecha_entrada', type: 'date' },
            { label: 'Entrega estimada', key: 'fecha_estimada', type: 'date' },
            { label: 'Fecha entrega real', key: 'fecha_entrega', type: 'date' },
            { label: 'Presupuesto (€)', key: 'presupuesto', type: 'number' },
          ]},
          { section: 'Notas internas', fields: [
            { label: 'Notas', key: 'notas', type: 'textarea' },
          ]},
        ].map(({ section, fields }) => (
          <div key={section} className="rounded-xl p-4 mb-3" style={{ background: fondoSec, border: `1px solid ${borde}` }}>
            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>{section}</p>
            <div className="space-y-2">
              {fields.map(f => (
                <div key={f.key} className={f.type === 'textarea' ? '' : 'grid grid-cols-2 gap-2 items-start'}>
                  <p className="text-xs" style={{ color: textoSec }}>{f.label}</p>
                  {editando ? (
                    f.type === 'textarea'
                      ? <textarea value={(editForm as any)[f.key] || ''} onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))} rows={3}
                          className="w-full bg-transparent rounded-lg px-2 py-1.5 text-sm focus:outline-none resize-none mt-1"
                          style={{ border: `1px solid ${borde}`, color: texto }} />
                      : <div className="relative">
                          <input
                            type={f.type}
                            value={(editForm as any)[f.key] || ''}
                            onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                            onBlur={f.key === 'matricula' ? e => lookupMatricula(e.target.value, 'editar') : undefined}
                            className="w-full bg-transparent rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                            style={{
                              border: `1px solid ${borde}`,
                              color: texto,
                              fontFamily: f.key === 'matricula' ? 'monospace' : undefined,
                              fontWeight: f.key === 'matricula' ? 700 : undefined,
                              textTransform: f.key === 'matricula' ? 'uppercase' : undefined,
                            }}
                          />
                          {f.key === 'matricula' && buscandoMatriculaEdit && (
                            <span className="absolute right-2 top-1.5 text-xs animate-pulse" style={{ color: primario }}>🔍</span>
                          )}
                        </div>
                  ) : (
                    <p className="text-sm" style={{ color: f.key === 'matricula' ? texto : texto, fontFamily: f.key === 'matricula' ? 'monospace' : undefined, fontWeight: f.key === 'matricula' ? 700 : undefined }}>{(vistaDetalle as any)[f.key] || '—'}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Acciones rápidas */}
        <div className="mt-4 flex flex-wrap gap-2">
          {vistaDetalle.cliente_telefono && (
            <a
              href={`https://wa.me/${vistaDetalle.cliente_telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${vistaDetalle.cliente_nombre || ''},\n\nTe escribimos desde ${restaurante.nombre} sobre tu vehículo ${vistaDetalle.matricula || ''}.`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium"
              style={{ background: '#25D366', color: '#fff' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
          )}
          {vistaDetalle.cliente_telefono && (
            <a href={`tel:${vistaDetalle.cliente_telefono}`}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium"
              style={{ border: `1px solid ${borde}`, color: texto }}>
              📞 Llamar
            </a>
          )}
          {vistaDetalle.cliente_email && (
            <a href={`mailto:${vistaDetalle.cliente_email}`}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium"
              style={{ border: `1px solid ${borde}`, color: texto }}>
              ✉️ Email
            </a>
          )}
        </div>

        {/* Checklist de recepción */}
        {(() => {
          const cats = checklist.length > 0
            ? [...new Set(checklist.map(i => i.categoria))]
            : []
          const totalItems = checklist.length
          const okItems = checklist.filter(i => i.estado === 'ok').length
          const malItems = checklist.filter(i => i.estado === 'mal').length
          const pct = totalItems > 0 ? Math.round((okItems / totalItems) * 100) : 0

          return (
            <div className="mt-5 rounded-xl overflow-hidden" style={{ border: `1px solid ${borde}` }}>
              <button
                className="w-full flex items-center justify-between px-4 py-3"
                style={{ background: fondoSec }}
                onClick={() => checklist.length > 0 ? setChecklistAbierto(!checklistAbierto) : inicializarChecklist(vistaDetalle.id)}
              >
                <div className="flex items-center gap-3">
                  <p className="text-xs tracking-widest uppercase font-semibold" style={{ color: textoSec }}>🔍 Checklist recepción</p>
                  {totalItems > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full overflow-hidden" style={{ background: borde }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: malItems > 0 ? '#f59e0b' : '#10b981' }} />
                      </div>
                      <span className="text-xs" style={{ color: textoSec }}>{okItems}/{totalItems}</span>
                      {malItems > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: '#fef2f2', color: '#ef4444' }}>{malItems} incidencias</span>}
                    </div>
                  )}
                </div>
                <span className="text-xs" style={{ color: textoSec }}>
                  {checklist.length === 0
                    ? (inicializandoChecklist ? 'Creando…' : '+ Iniciar')
                    : checklistAbierto ? '▲' : '▼'}
                </span>
              </button>

              {checklistAbierto && checklist.length > 0 && (
                <div className="divide-y" style={{ borderTop: `1px solid ${borde}` }}>
                  {cats.map(cat => (
                    <div key={cat} className="px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: textoSec }}>{cat}</p>
                      <div className="space-y-1.5">
                        {checklist.filter(i => i.categoria === cat).map(item => (
                          <div key={item.id} className="flex items-center gap-2">
                            {/* Botones de estado */}
                            <div className="flex gap-1 flex-shrink-0">
                              {[
                                { key: 'ok', label: '✓', bg: '#dcfce7', color: '#16a34a', activeBg: '#16a34a' },
                                { key: 'mal', label: '✗', bg: '#fee2e2', color: '#dc2626', activeBg: '#dc2626' },
                                { key: 'na', label: '—', bg: '#f1f5f9', color: '#94a3b8', activeBg: '#64748b' },
                              ].map(opt => (
                                <button
                                  key={opt.key}
                                  onClick={() => actualizarItemChecklist(item.id, item.estado === opt.key ? 'pendiente' : opt.key)}
                                  className="w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all"
                                  style={{
                                    background: item.estado === opt.key ? opt.activeBg : opt.bg,
                                    color: item.estado === opt.key ? '#fff' : opt.color,
                                  }}>
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                            <p className="text-sm flex-1" style={{ color: item.estado === 'mal' ? '#dc2626' : item.estado === 'ok' ? '#16a34a' : texto }}>
                              {item.item}
                            </p>
                            {item.estado === 'mal' && (
                              <input
                                type="text"
                                placeholder="Nota…"
                                defaultValue={item.notas || ''}
                                onBlur={e => actualizarItemChecklist(item.id, 'mal', e.target.value)}
                                className="text-xs px-2 py-1 rounded-lg flex-shrink-0 w-28 bg-transparent focus:outline-none"
                                style={{ border: `1px solid #fca5a5`, color: texto }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        {/* Piezas utilizadas */}
        <div className="mt-5 rounded-xl p-4" style={{ border: `1px solid ${borde}` }}>
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-xs tracking-widest uppercase font-semibold" style={{ color: textoSec }}>
                Piezas utilizadas {piezasOrden.length > 0 ? `(${piezasOrden.length})` : ''}
              </p>
              {piezasOrden.length > 0 && (
                <p className="text-xs mt-0.5" style={{ color: primario }}>
                  Total: {piezasOrden.reduce((acc, p) => acc + (p.precio_venta || 0) * p.cantidad, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </p>
              )}
            </div>
            <button
              onClick={() => { setPiezaModal(true); setPiezaForm({ stock_id: '', nombre: '', referencia: '', cantidad: '1', precio_coste: '', precio_venta: '' }); setBusquedaPieza('') }}
              className="text-xs px-2.5 py-1 rounded-lg font-medium"
              style={{ background: boton, color: botonTexto }}>
              + Añadir pieza
            </button>
          </div>

          {cargandoPiezas ? (
            <p className="text-xs" style={{ color: textoSec }}>Cargando…</p>
          ) : piezasOrden.length === 0 ? (
            <p className="text-xs" style={{ color: textoSec }}>Sin piezas registradas en esta orden</p>
          ) : (
            <div className="space-y-1">
              {piezasOrden.map(p => (
                <div key={p.id} className="flex items-center gap-2 py-2" style={{ borderBottom: `1px solid ${borde}` }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: texto }}>{p.nombre}</p>
                    <p className="text-xs" style={{ color: textoSec }}>
                      {p.referencia ? `Ref: ${p.referencia} · ` : ''}×{p.cantidad}
                      {p.precio_venta ? ` · ${(p.precio_venta * p.cantidad).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}` : ''}
                    </p>
                  </div>
                  <button onClick={() => eliminarPieza(p.id)} className="text-xs px-1.5 py-1 rounded flex-shrink-0" style={{ color: '#ef4444' }}>🗑</button>
                </div>
              ))}
            </div>
          )}

          {/* Modal añadir pieza */}
          {piezaModal && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
              <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ background: fondoClaro ? '#fff' : '#1e293b' }}>
                <div className="px-5 py-4" style={{ background: primario }}>
                  <p className="text-white font-semibold text-sm">Añadir pieza</p>
                  <p className="text-white/70 text-xs mt-0.5">Busca en tu inventario o introduce manualmente</p>
                </div>
                <div className="p-5 space-y-3">
                  {/* Búsqueda en stock */}
                  <div>
                    <p className="text-xs mb-1" style={{ color: textoSec }}>Buscar en inventario</p>
                    <input
                      type="text"
                      value={busquedaPieza}
                      onChange={e => setBusquedaPieza(e.target.value)}
                      placeholder="Nombre o referencia…"
                      className="w-full bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ border: `1px solid ${borde}`, color: texto }}
                    />
                    {busquedaPieza.length > 0 && (
                      <div className="mt-1 rounded-lg overflow-hidden" style={{ border: `1px solid ${borde}` }}>
                        {stockDisponible
                          .filter(s => s.nombre.toLowerCase().includes(busquedaPieza.toLowerCase()) || (s.referencia || '').toLowerCase().includes(busquedaPieza.toLowerCase()))
                          .slice(0, 6)
                          .map(s => (
                            <button
                              key={s.id}
                              onClick={() => seleccionarStockPieza(s)}
                              className="w-full text-left px-3 py-2 text-sm hover:opacity-75 flex items-center justify-between"
                              style={{ borderBottom: `1px solid ${borde}`, color: texto, background: fondoClaro ? '#f8fafc' : '#0f172a' }}>
                              <span>
                                <span className="font-medium">{s.nombre}</span>
                                {s.referencia && <span className="ml-2 text-xs font-mono" style={{ color: textoSec }}>{s.referencia}</span>}
                              </span>
                              <span className="text-xs ml-2 flex-shrink-0" style={{ color: s.cantidad <= 0 ? '#ef4444' : s.cantidad <= s.cantidad_minima ? '#f59e0b' : '#10b981' }}>
                                Stock: {s.cantidad}
                              </span>
                            </button>
                          ))}
                        {stockDisponible.filter(s => s.nombre.toLowerCase().includes(busquedaPieza.toLowerCase()) || (s.referencia || '').toLowerCase().includes(busquedaPieza.toLowerCase())).length === 0 && (
                          <p className="px-3 py-2 text-xs" style={{ color: textoSec }}>Sin resultados</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <p className="text-xs mb-1" style={{ color: textoSec }}>Nombre *</p>
                      <input type="text" value={piezaForm.nombre} onChange={e => setPiezaForm(p => ({ ...p, nombre: e.target.value }))}
                        className="w-full bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{ border: `1px solid ${borde}`, color: texto }} />
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: textoSec }}>Referencia</p>
                      <input type="text" value={piezaForm.referencia} onChange={e => setPiezaForm(p => ({ ...p, referencia: e.target.value }))}
                        className="w-full bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{ border: `1px solid ${borde}`, color: texto }} />
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: textoSec }}>Cantidad *</p>
                      <input type="number" min="1" value={piezaForm.cantidad} onChange={e => setPiezaForm(p => ({ ...p, cantidad: e.target.value }))}
                        className="w-full bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{ border: `1px solid ${borde}`, color: texto }} />
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: textoSec }}>Precio coste (€)</p>
                      <input type="number" step="0.01" value={piezaForm.precio_coste} onChange={e => setPiezaForm(p => ({ ...p, precio_coste: e.target.value }))}
                        className="w-full bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{ border: `1px solid ${borde}`, color: texto }} />
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: textoSec }}>Precio venta (€)</p>
                      <input type="number" step="0.01" value={piezaForm.precio_venta} onChange={e => setPiezaForm(p => ({ ...p, precio_venta: e.target.value }))}
                        className="w-full bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{ border: `1px solid ${borde}`, color: texto }} />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setPiezaModal(false)} className="flex-1 py-2 rounded-xl text-sm" style={{ border: `1px solid ${borde}`, color: textoSec }}>Cancelar</button>
                    <button
                      onClick={guardarPieza}
                      disabled={!piezaForm.nombre || !piezaForm.cantidad || guardandoPieza}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-40"
                      style={{ background: boton, color: botonTexto }}>
                      {guardandoPieza ? 'Guardando…' : 'Añadir pieza'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Presupuestos vinculados */}
        <div className="mt-5 rounded-xl p-4" style={{ border: `1px solid ${borde}` }}>
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs tracking-widest uppercase font-semibold" style={{ color: textoSec }}>
              Presupuestos {presupuestosOrden.length > 0 ? `(${presupuestosOrden.length})` : ''}
            </p>
            <button
              onClick={() => crearPresupuestoDesdeOrden(vistaDetalle)}
              className="text-xs px-2.5 py-1 rounded-lg font-medium"
              style={{ background: boton, color: botonTexto }}>
              + Nuevo
            </button>
          </div>
          {cargandoPresup ? (
            <p className="text-xs" style={{ color: textoSec }}>Cargando…</p>
          ) : presupuestosOrden.length === 0 ? (
            <p className="text-xs" style={{ color: textoSec }}>Sin presupuestos para esta orden</p>
          ) : (
            <div className="space-y-2">
              {presupuestosOrden.map(p => {
                const COLORES_EST: Record<string, string> = { borrador: '#64748b', enviado: '#3b82f6', aceptado: '#10b981', rechazado: '#ef4444', caducado: '#94a3b8' }
                const colorEst = COLORES_EST[p.estado] || '#64748b'
                return (
                  <div key={p.id} className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${borde}` }}>
                    <div>
                      <span className="font-mono text-xs font-bold" style={{ color: texto }}>{p.numero_completo}</span>
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full" style={{ background: colorEst + '20', color: colorEst }}>
                        {p.estado}
                      </span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: primario }}>
                      {Number(p.total).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Historial de actividad */}
        <div className="mt-4 rounded-xl p-4" style={{ border: `1px solid ${borde}` }}>
          <p className="text-xs tracking-widest uppercase font-semibold mb-3" style={{ color: textoSec }}>Historial de actividad</p>

          {/* Añadir nota manual */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={nuevaNota}
              onChange={e => setNuevaNota(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && agregarNota()}
              placeholder="Añadir nota interna…"
              className="flex-1 bg-transparent rounded-xl px-3 py-2 text-sm focus:outline-none"
              style={{ border: `1px solid ${borde}`, color: texto }}
            />
            <button
              onClick={agregarNota}
              disabled={!nuevaNota.trim() || guardandoNota}
              className="text-xs px-3 py-2 rounded-xl font-medium disabled:opacity-40"
              style={{ background: boton, color: botonTexto }}>
              {guardandoNota ? '…' : 'Añadir'}
            </button>
          </div>

          {/* Timeline */}
          {eventos.length === 0 ? (
            <p className="text-xs" style={{ color: textoSec }}>Sin actividad registrada todavía</p>
          ) : (
            <div className="space-y-0">
              {eventos.map((ev, i) => {
                const iconos: Record<string, string> = {
                  estado: '🔄', bloqueo: '🔴', desbloqueo: '✅', diagnostico: '🔍',
                  trabajos: '🔧', presupuesto: '💰', fecha: '📅', nota: '📝',
                  nota_manual: '💬',
                }
                const colores: Record<string, string> = {
                  estado: primario, bloqueo: '#ef4444', desbloqueo: '#10b981',
                  diagnostico: '#f59e0b', trabajos: '#3b82f6', presupuesto: '#8b5cf6',
                  fecha: '#64748b', nota: '#64748b', nota_manual: '#0ea5e9',
                }
                const color = colores[ev.tipo] || '#94a3b8'
                const icono = iconos[ev.tipo] || '•'
                const fecha = new Date(ev.creado_en)
                const fechaStr = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                const horaStr = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

                return (
                  <div key={ev.id} className="flex gap-3 pb-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: color + '18', border: `1.5px solid ${color}30` }}>
                        {icono}
                      </div>
                      {i < eventos.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: borde }} />}
                    </div>
                    <div className="pt-1 pb-1 min-w-0">
                      <p className="text-sm" style={{ color: texto }}>{ev.descripcion}</p>
                      <p className="text-xs mt-0.5" style={{ color: textoSec }}>{fechaStr} · {horaStr}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── MODAL NOTIFICACIÓN WHATSAPP ──
  function NotifModal() {
    if (!notifModal) return null
    const { orden, nuevoEstado } = notifModal
    const col = COLUMNAS.find(c => c.key === nuevoEstado)!
    const telefono = orden.cliente_telefono!.replace(/\s/g, '')
    const telNorm = telefono.startsWith('+') ? telefono : `+34${telefono}`
    const waUrl = `https://wa.me/${telNorm.replace('+', '')}?text=${encodeURIComponent(notifMensajeEdit)}`

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
        <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ background: fondoClaro ? '#fff' : '#1e293b' }}>
          {/* Cabecera */}
          <div className="px-5 py-4" style={{ background: col.color }}>
            <p className="text-white font-semibold text-sm">¿Notificar al cliente?</p>
            <p className="text-white/70 text-xs mt-0.5">
              Estado cambiado a <strong className="text-white">{col.label}</strong>
              {orden.cliente_nombre ? ` · ${orden.cliente_nombre}` : ''}
            </p>
          </div>

          <div className="p-5">
            {/* Preview del mensaje editable */}
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: textoSec }}>
              Mensaje de WhatsApp (editable)
            </p>
            <textarea
              value={notifMensajeEdit}
              onChange={e => setNotifMensajeEdit(e.target.value)}
              rows={6}
              className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"
              style={{ border: `1px solid ${borde}`, color: texto, background: fondoSec, fontFamily: 'monospace', fontSize: 12 }}
            />
            <p className="text-xs mt-1 mb-4" style={{ color: textoSec }}>
              Se abrirá WhatsApp con este mensaje. Solo tendrás que pulsar Enviar.
            </p>

            {/* Botones */}
            <div className="flex gap-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setNotifModal(null)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                style={{ background: '#25D366', color: '#fff' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar WhatsApp
              </a>
              <button
                onClick={() => setNotifModal(null)}
                className="px-4 py-3 rounded-xl text-sm font-medium"
                style={{ border: `1px solid ${borde}`, color: textoSec }}>
                Solo estado
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── MODAL BLOQUEO ──
  function BloqueoModal() {
    if (!bloqueoModal) return null
    const o = bloqueoModal
    const tieneTelefono = !!o.cliente_telefono
    const sugerencias = [
      'Esperando aprobación del cliente',
      'Esperando pieza especial',
      'Esperando herramienta',
      'Pendiente de presupuesto adicional',
      'Cliente no localizable',
    ]

    // Mensaje WA pre-construido a partir del motivo
    const nombre = o.cliente_nombre ? o.cliente_nombre.split(' ')[0] : ''
    const vehiculo = [o.matricula, o.marca, o.modelo].filter(Boolean).join(' ')
    const msgWA = `${nombre ? `Hola ${nombre}, ` : ''}te escribimos desde *${restaurante.nombre}*.

⏸ *Tu vehículo está en espera*${vehiculo ? `\n🚗 ${vehiculo}` : ''}
${motivoBloqueo || '…'}

En cuanto se resuelva te avisamos de inmediato. Disculpa las molestias.`

    const telefono = o.cliente_telefono?.replace(/\s/g, '') || ''
    const telNorm = telefono.startsWith('+') ? telefono : `+34${telefono}`
    const waUrl = `https://wa.me/${telNorm.replace('+', '')}?text=${encodeURIComponent(msgWA)}`

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
        <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: fondoClaro ? '#fff' : '#1e293b' }}>

          {/* Cabecera */}
          <div className="px-5 py-4 flex items-center gap-3" style={{ background: '#ef4444' }}>
            <span className="text-2xl">⏸</span>
            <div>
              <p className="text-white font-semibold text-sm">Poner en espera</p>
              <p className="text-white/70 text-xs">{o.matricula || o.cliente_nombre || o.numero_completo}</p>
            </div>
          </div>

          <div className="p-5">
            {/* Motivo */}
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: textoSec }}>
              Motivo de la espera
            </p>
            <textarea
              value={motivoBloqueo}
              onChange={e => setMotivoBloqueo(e.target.value)}
              placeholder="Ej: Esperando aprobación del cliente para presupuesto adicional…"
              rows={3}
              autoFocus
              className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none mb-3"
              style={{ border: `1px solid ${borde}`, color: texto, background: fondoSec }}
            />
            <div className="flex flex-wrap gap-1.5 mb-4">
              {sugerencias.map(s => (
                <button key={s} onClick={() => setMotivoBloqueo(s)}
                  className="text-xs px-2.5 py-1 rounded-full transition-all"
                  style={{
                    border: `1px solid ${motivoBloqueo === s ? '#ef4444' : borde}`,
                    color: motivoBloqueo === s ? '#ef4444' : textoSec,
                    background: motivoBloqueo === s ? '#fef2f2' : 'transparent',
                  }}>
                  {s}
                </button>
              ))}
            </div>

            {/* Preview mensaje WA */}
            {tieneTelefono && motivoBloqueo.trim() && (
              <div className="rounded-xl p-3 mb-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <p className="text-xs font-semibold mb-1.5" style={{ color: '#15803d' }}>
                  Vista previa del mensaje al cliente
                </p>
                <p className="text-xs whitespace-pre-line" style={{ color: '#166534', fontFamily: 'monospace' }}>
                  {msgWA}
                </p>
              </div>
            )}

            {/* Botones */}
            <div className="space-y-2">
              {/* Con WhatsApp */}
              {tieneTelefono && (
                <a
                  href={motivoBloqueo.trim() ? waUrl : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={motivoBloqueo.trim() ? () => bloquearOrden(o, motivoBloqueo) : undefined}
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all ${!motivoBloqueo.trim() ? 'opacity-40 pointer-events-none' : ''}`}
                  style={{ background: '#25D366', color: '#fff' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Poner en espera y avisar al cliente
                </a>
              )}

              {/* Solo bloquear */}
              <button
                onClick={() => bloquearOrden(o, motivoBloqueo)}
                disabled={!motivoBloqueo.trim()}
                className="w-full py-2.5 rounded-xl text-sm font-medium disabled:opacity-40"
                style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}>
                {tieneTelefono ? 'Poner en espera sin avisar' : '⏸ Poner en espera'}
              </button>

              <button
                onClick={() => { setBloqueoModal(null); setMotivoBloqueo('') }}
                className="w-full py-2.5 rounded-xl text-sm"
                style={{ border: `1px solid ${borde}`, color: textoSec }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── VISTA KANBAN ──
  return (
    <div>
      <NotifModal />
      <BloqueoModal />
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <input
          type="text"
          placeholder="Buscar matrícula, cliente…"
          value={buscando}
          onChange={e => setBuscando(e.target.value)}
          className="bg-transparent rounded-xl px-3 py-2 text-sm focus:outline-none flex-1 min-w-40"
          style={{ border: `1px solid ${borde}`, color: texto }}
        />
        <button
          onClick={() => setSoloBlockeadas(!soloBlockeadas)}
          className="text-xs px-3 py-2 rounded-xl flex-shrink-0 font-medium transition-all"
          style={{
            background: soloBlockeadas ? '#ef4444' : 'transparent',
            color: soloBlockeadas ? '#fff' : textoSec,
            border: `1px solid ${soloBlockeadas ? '#ef4444' : borde}`,
          }}>
          🔴 {ordenes.filter(o => o.bloqueada).length > 0 ? `${ordenes.filter(o => o.bloqueada).length}` : 'Bloqueadas'}
        </button>
        <button
          onClick={() => {
            const cols = ['numero_completo','estado','cliente_nombre','cliente_telefono','cliente_email','matricula','marca','modelo','anio','km_entrada','descripcion_problema','fecha_entrada','fecha_estimada','presupuesto']
            const filas = ordenesFiltradas.map(o => cols.map(k => {
              const v = (o as any)[k]
              if (v == null) return ''
              if (typeof v === 'string' && v.includes(',')) return `"${v}"`
              return String(v)
            }).join(','))
            const csv = [cols.join(','), ...filas].join('\n')
            const a = document.createElement('a')
            a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
            a.download = `ordenes_${new Date().toISOString().split('T')[0]}.csv`
            a.click()
          }}
          className="text-xs px-3 py-2 rounded-xl flex-shrink-0"
          style={{ border: `1px solid ${borde}`, color: textoSec }}
          title="Exportar CSV">
          ⬇ CSV
        </button>
        <button onClick={() => setFormAbierto(true)}
          className="text-xs font-semibold px-4 py-2 rounded-xl flex-shrink-0"
          style={{ background: boton, color: botonTexto }}>
          + Nueva orden
        </button>
      </div>

      {/* Stats rápidas */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {COLUMNAS.filter(c => c.key !== 'entregado').map(c => {
          const n = ordenes.filter(o => o.estado === c.key).length
          if (n === 0) return null
          return (
            <span key={c.key} className="text-xs px-2 py-1 rounded-full font-medium" style={{ color: c.color, background: fondoClaro ? c.bg : `${c.color}20` }}>
              {n} {c.label.toLowerCase()}
            </span>
          )
        })}
      </div>

      {/* Modal nueva orden */}
      {formAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={e => { if (e.target === e.currentTarget) setFormAbierto(false) }}>
          <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: fondoClaro ? '#fff' : '#111', border: `1px solid ${borde}` }}>
            <div className="flex justify-between items-center mb-5">
              <p className="font-semibold text-sm" style={{ color: texto }}>Nueva orden de reparación</p>
              <button onClick={() => setFormAbierto(false)} style={{ color: textoSec }}>✕</button>
            </div>
            {[
              { section: 'Cliente', fields: [
                { label: 'Nombre', key: 'cliente_nombre', type: 'text', placeholder: 'Juan García' },
                { label: 'Teléfono', key: 'cliente_telefono', type: 'tel', placeholder: '600 000 000' },
                { label: 'Email', key: 'cliente_email', type: 'email', placeholder: 'juan@email.com' },
              ]},
              { section: 'Vehículo', fields: [
                { label: 'Matrícula', key: 'matricula', type: 'text', placeholder: '1234ABC' },
                { label: 'Marca', key: 'marca', type: 'text', placeholder: 'Toyota' },
                { label: 'Modelo', key: 'modelo', type: 'text', placeholder: 'Corolla' },
                { label: 'Año', key: 'anio', type: 'number', placeholder: '2019' },
                { label: 'KM entrada', key: 'km_entrada', type: 'number', placeholder: '85000' },
                { label: 'Color', key: 'color', type: 'text', placeholder: 'Blanco' },
              ]},
              { section: 'Trabajo', fields: [
                { label: 'Descripción del problema', key: 'descripcion_problema', type: 'textarea', placeholder: 'El cliente indica que…' },
              ]},
              { section: 'Fechas y presupuesto', fields: [
                { label: 'Fecha entrada', key: 'fecha_entrada', type: 'date', placeholder: '' },
                { label: 'Entrega estimada', key: 'fecha_estimada', type: 'date', placeholder: '' },
                { label: 'Presupuesto (€)', key: 'presupuesto', type: 'number', placeholder: '0.00' },
              ]},
              { section: 'Notas internas', fields: [
                { label: 'Notas', key: 'notas', type: 'textarea', placeholder: 'Observaciones…' },
              ]},
            ].map(({ section, fields }) => (
              <div key={section} className="mb-4">
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: textoSec }}>{section}</p>
                <div className="space-y-2">
                  {fields.map(f => (
                    <div key={f.key}>
                      <div className="flex items-center gap-1 mb-1">
                        <p className="text-xs" style={{ color: textoSec }}>{f.label}</p>
                        {f.key === 'matricula' && buscandoMatricula && (
                          <span className="text-xs animate-pulse" style={{ color: primario }}>🔍 Buscando…</span>
                        )}
                      </div>
                      {f.type === 'textarea'
                        ? <textarea value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} rows={3}
                            className="w-full bg-transparent rounded-xl px-3 py-2 text-sm focus:outline-none resize-none"
                            style={{ border: `1px solid ${borde}`, color: texto }} />
                        : <input
                            type={f.type}
                            value={(form as any)[f.key]}
                            onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                            onBlur={f.key === 'matricula' ? e => lookupMatricula(e.target.value, 'nuevo') : undefined}
                            placeholder={f.placeholder}
                            className="w-full bg-transparent rounded-xl px-3 py-2 text-sm focus:outline-none"
                            style={{
                              border: `1px solid ${f.key === 'matricula' ? primario + '80' : borde}`,
                              color: texto,
                              fontFamily: f.key === 'matricula' ? 'monospace' : undefined,
                              fontWeight: f.key === 'matricula' ? 700 : undefined,
                              textTransform: f.key === 'matricula' ? 'uppercase' : undefined,
                            }}
                          />
                      }
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={crearOrden} disabled={guardando}
              className="w-full text-sm font-semibold rounded-xl py-3 mt-2 disabled:opacity-40"
              style={{ background: boton, color: botonTexto }}>
              {guardando ? 'Creando…' : 'Crear orden'}
            </button>
          </div>
        </div>
      )}

      {/* Kanban */}
      {cargando ? (
        <p className="text-sm" style={{ color: textoSec }}>Cargando órdenes…</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
          {COLUMNAS.map(columna => {
            const ordenesCol = ordenesFiltradas.filter(o => o.estado === columna.key)
            const isOver = dragOverCol === columna.key
            return (
              <div
                key={columna.key}
                className="flex-shrink-0 rounded-xl flex flex-col"
                style={{ width: 240, background: isOver ? (fondoClaro ? columna.bg : `${columna.color}15`) : fondoSec, border: `1px solid ${isOver ? columna.color : borde}`, transition: 'all 0.15s' }}
                onDragOver={e => { e.preventDefault(); setDragOverCol(columna.key) }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={() => onDrop(columna.key)}>
                {/* Cabecera columna */}
                <div className="px-3 pt-3 pb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: columna.color }} />
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: columna.color }}>{columna.label}</p>
                  <span className="ml-auto text-xs rounded-full px-1.5 py-0.5 font-medium" style={{ background: fondoClaro ? '#e2e8f0' : 'rgba(255,255,255,0.1)', color: textoSec }}>{ordenesCol.length}</span>
                </div>

                {/* Cards */}
                <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto">
                  {ordenesCol.map(orden => (
                    <div
                      key={orden.id}
                      draggable
                      onDragStart={() => onDragStart(orden.id)}
                      onDragEnd={onDragEnd}
                      onClick={() => abrirDetalle(orden)}
                      className="rounded-xl p-3 cursor-pointer select-none"
                      style={{
                        background: fondoClaro ? '#fff' : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${orden.bloqueada ? '#ef4444' : draggingId === orden.id ? columna.color : borde}`,
                        opacity: draggingId === orden.id ? 0.5 : 1,
                        boxShadow: orden.bloqueada ? '0 0 0 1px #ef444440' : fondoClaro ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                        transition: 'opacity 0.15s',
                      }}>
                      {/* Badge bloqueada */}
                      {orden.bloqueada && (
                        <div className="flex items-center gap-1 mb-2 px-2 py-1 rounded-lg" style={{ background: '#fef2f2' }}>
                          <span className="text-xs">🔴</span>
                          <p className="text-xs font-medium truncate" style={{ color: '#ef4444' }}>
                            {orden.motivo_bloqueo || 'Bloqueada'}
                          </p>
                        </div>
                      )}
                      {/* Matrícula + número */}
                      <div className="flex justify-between items-start mb-1.5">
                        <p className="text-xs font-mono font-bold" style={{ color: primario }}>
                          {orden.matricula || '—'}
                        </p>
                        <p className="text-xs font-mono" style={{ color: textoSec }}>{orden.numero_completo}</p>
                      </div>
                      {/* Vehículo */}
                      {(orden.marca || orden.modelo) && (
                        <p className="text-xs font-medium mb-1" style={{ color: texto }}>
                          {[orden.marca, orden.modelo].filter(Boolean).join(' ')}
                          {orden.anio ? ` (${orden.anio})` : ''}
                        </p>
                      )}
                      {/* Cliente */}
                      {orden.cliente_nombre && (
                        <p className="text-xs mb-1" style={{ color: textoSec }}>{orden.cliente_nombre}</p>
                      )}
                      {/* Problema */}
                      {orden.descripcion_problema && (
                        <p className="text-xs leading-snug line-clamp-2 mb-2" style={{ color: textoSec }}>{orden.descripcion_problema}</p>
                      )}
                      {/* Footer */}
                      <div className="flex justify-between items-center pt-1.5" style={{ borderTop: `1px solid ${borde}` }}>
                        <p className="text-xs" style={{ color: textoSec }}>
                          {new Date(orden.fecha_entrada).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </p>
                        {orden.presupuesto && (
                          <p className="text-xs font-semibold" style={{ color: columna.color }}>
                            {Number(orden.presupuesto).toFixed(0)} €
                          </p>
                        )}
                        {orden.fecha_estimada && (
                          <p className="text-xs" style={{ color: textoSec }}>
                            ⏱ {new Date(orden.fecha_estimada).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Drop zone vacía */}
                  {ordenesCol.length === 0 && (
                    <div className="rounded-lg py-8 text-center" style={{ border: `2px dashed ${isOver ? columna.color : borde}` }}>
                      <p className="text-xs" style={{ color: textoSec }}>Arrastra aquí</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
