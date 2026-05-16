'use client'
import { useState, useEffect } from 'react'

interface Pieza {
  id: string
  nombre: string
  referencia?: string
  categoria?: string
  cantidad: number
  cantidad_minima: number
  precio_coste?: number
  precio_venta?: number
  proveedor?: string
  ubicacion?: string
  notas?: string
  actualizado_en?: string
}

const CATEGORIAS = ['Filtros', 'Frenos', 'Motor', 'Suspensión', 'Electricidad', 'Carrocería', 'Lubricantes', 'Neumáticos', 'Transmisión', 'Refrigeración', 'Otros']

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

const FORM_VACIO = {
  nombre: '', referencia: '', categoria: '', cantidad: '0',
  cantidad_minima: '1', precio_coste: '', precio_venta: '',
  proveedor: '', ubicacion: '', notas: '',
}

export default function StockTab({ restaurante, fondo, texto, borde, primario, boton, botonTexto, textoSec, fondoClaro }: Props) {
  const [piezas, setPiezas] = useState<Pieza[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [soloStockBajo, setSoloStockBajo] = useState(false)
  const [modal, setModal] = useState<'nuevo' | 'editar' | null>(null)
  const [seleccionada, setSeleccionada] = useState<Pieza | null>(null)
  const [form, setForm] = useState({ ...FORM_VACIO })
  const [guardando, setGuardando] = useState(false)

  const fondoSec = fondoClaro ? '#f8fafc' : 'rgba(255,255,255,0.03)'

  async function cargar() {
    setCargando(true)
    const res = await fetch(`/api/stock?restaurant_id=${restaurante.id}`)
    const data = await res.json()
    setPiezas(Array.isArray(data) ? data : [])
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  function abrirNuevo() {
    setForm({ ...FORM_VACIO })
    setSeleccionada(null)
    setModal('nuevo')
  }

  function abrirEditar(p: Pieza) {
    setSeleccionada(p)
    setForm({
      nombre: p.nombre,
      referencia: p.referencia || '',
      categoria: p.categoria || '',
      cantidad: String(p.cantidad),
      cantidad_minima: String(p.cantidad_minima),
      precio_coste: p.precio_coste ? String(p.precio_coste) : '',
      precio_venta: p.precio_venta ? String(p.precio_venta) : '',
      proveedor: p.proveedor || '',
      ubicacion: p.ubicacion || '',
      notas: p.notas || '',
    })
    setModal('editar')
  }

  async function guardar() {
    if (!form.nombre.trim()) return
    setGuardando(true)
    const payload = {
      ...form,
      cantidad: parseInt(form.cantidad) || 0,
      cantidad_minima: parseInt(form.cantidad_minima) || 1,
      precio_coste: form.precio_coste ? parseFloat(form.precio_coste) : null,
      precio_venta: form.precio_venta ? parseFloat(form.precio_venta) : null,
    }

    if (modal === 'nuevo') {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_id: restaurante.id, ...payload }),
      })
      const data = await res.json()
      if (res.ok) setPiezas(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    } else if (modal === 'editar' && seleccionada) {
      const res = await fetch(`/api/stock/${seleccionada.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) setPiezas(prev => prev.map(p => p.id === data.id ? data : p))
    }
    setGuardando(false)
    setModal(null)
  }

  async function ajustarCantidad(p: Pieza, delta: number) {
    const nueva = Math.max(0, p.cantidad + delta)
    const res = await fetch(`/api/stock/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cantidad: nueva }),
    })
    const data = await res.json()
    if (res.ok) setPiezas(prev => prev.map(x => x.id === data.id ? data : x))
  }

  async function eliminar(p: Pieza) {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return
    await fetch(`/api/stock/${p.id}`, { method: 'DELETE' })
    setPiezas(prev => prev.filter(x => x.id !== p.id))
  }

  const stockBajoCount = piezas.filter(p => p.cantidad <= p.cantidad_minima).length

  const piezasFiltradas = piezas
    .filter(p => !soloStockBajo || p.cantidad <= p.cantidad_minima)
    .filter(p => !filtroCategoria || p.categoria === filtroCategoria)
    .filter(p => !busqueda.trim() ||
      [p.nombre, p.referencia, p.proveedor, p.categoria]
        .some(v => v?.toLowerCase().includes(busqueda.toLowerCase()))
    )

  const categoriasPiezas = [...new Set(piezas.map(p => p.categoria).filter(Boolean))] as string[]

  const fmt = (n?: number) => n != null ? n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) : '—'

  return (
    <div>
      {/* Modal nueva/editar */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto" style={{ background: fondoClaro ? '#fff' : '#1e293b' }}>
            <div className="px-5 py-4 flex justify-between items-center" style={{ background: primario }}>
              <p className="text-white font-semibold text-sm">{modal === 'nuevo' ? 'Nueva pieza / referencia' : 'Editar pieza'}</p>
              <button onClick={() => setModal(null)} className="text-white/70 hover:text-white">✕</button>
            </div>
            <div className="p-5 space-y-3">
              {/* Nombre + referencia */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs mb-1" style={{ color: textoSec }}>Nombre *</p>
                  <input type="text" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                    placeholder="Filtro de aceite" autoFocus
                    className="w-full bg-transparent rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ border: `1px solid ${borde}`, color: texto }} />
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: textoSec }}>Referencia</p>
                  <input type="text" value={form.referencia} onChange={e => setForm(p => ({ ...p, referencia: e.target.value }))}
                    placeholder="OC90 / 1234AB"
                    className="w-full bg-transparent rounded-xl px-3 py-2 text-sm focus:outline-none font-mono"
                    style={{ border: `1px solid ${borde}`, color: texto }} />
                </div>
              </div>
              {/* Categoría */}
              <div>
                <p className="text-xs mb-1" style={{ color: textoSec }}>Categoría</p>
                <select value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
                  className="w-full bg-transparent rounded-xl px-3 py-2 text-sm focus:outline-none"
                  style={{ border: `1px solid ${borde}`, color: texto }}>
                  <option value="">— Sin categoría —</option>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {/* Cantidades */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs mb-1" style={{ color: textoSec }}>Cantidad actual</p>
                  <input type="number" min="0" value={form.cantidad} onChange={e => setForm(p => ({ ...p, cantidad: e.target.value }))}
                    className="w-full bg-transparent rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ border: `1px solid ${borde}`, color: texto }} />
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: textoSec }}>Stock mínimo ⚠️</p>
                  <input type="number" min="0" value={form.cantidad_minima} onChange={e => setForm(p => ({ ...p, cantidad_minima: e.target.value }))}
                    className="w-full bg-transparent rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ border: `1px solid ${borde}`, color: texto }} />
                </div>
              </div>
              {/* Precios */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs mb-1" style={{ color: textoSec }}>Precio coste (€)</p>
                  <input type="number" min="0" step="0.01" value={form.precio_coste} onChange={e => setForm(p => ({ ...p, precio_coste: e.target.value }))}
                    placeholder="0.00"
                    className="w-full bg-transparent rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ border: `1px solid ${borde}`, color: texto }} />
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: textoSec }}>Precio venta (€)</p>
                  <input type="number" min="0" step="0.01" value={form.precio_venta} onChange={e => setForm(p => ({ ...p, precio_venta: e.target.value }))}
                    placeholder="0.00"
                    className="w-full bg-transparent rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ border: `1px solid ${borde}`, color: texto }} />
                </div>
              </div>
              {/* Proveedor + ubicación */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs mb-1" style={{ color: textoSec }}>Proveedor</p>
                  <input type="text" value={form.proveedor} onChange={e => setForm(p => ({ ...p, proveedor: e.target.value }))}
                    placeholder="AutoParts SL"
                    className="w-full bg-transparent rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ border: `1px solid ${borde}`, color: texto }} />
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: textoSec }}>Ubicación en taller</p>
                  <input type="text" value={form.ubicacion} onChange={e => setForm(p => ({ ...p, ubicacion: e.target.value }))}
                    placeholder="Estantería A3"
                    className="w-full bg-transparent rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ border: `1px solid ${borde}`, color: texto }} />
                </div>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: textoSec }}>Notas</p>
                <textarea value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
                  placeholder="Observaciones sobre esta pieza…" rows={2}
                  className="w-full bg-transparent rounded-xl px-3 py-2 text-sm focus:outline-none resize-none"
                  style={{ border: `1px solid ${borde}`, color: texto }} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={guardar} disabled={guardando || !form.nombre.trim()}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-40"
                  style={{ background: boton, color: botonTexto }}>
                  {guardando ? 'Guardando…' : modal === 'nuevo' ? 'Añadir al stock' : 'Guardar cambios'}
                </button>
                <button onClick={() => setModal(null)} className="px-4 py-3 rounded-xl text-sm"
                  style={{ border: `1px solid ${borde}`, color: textoSec }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar pieza, referencia…"
          className="bg-transparent rounded-xl px-3 py-2 text-sm focus:outline-none flex-1 min-w-40"
          style={{ border: `1px solid ${borde}`, color: texto }} />
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
          className="bg-transparent rounded-xl px-3 py-2 text-sm focus:outline-none"
          style={{ border: `1px solid ${borde}`, color: texto }}>
          <option value="">Todas las categorías</option>
          {categoriasPiezas.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => setSoloStockBajo(!soloStockBajo)}
          className="text-xs px-3 py-2 rounded-xl font-medium"
          style={{
            background: soloStockBajo ? '#f97316' : 'transparent',
            color: soloStockBajo ? '#fff' : textoSec,
            border: `1px solid ${soloStockBajo ? '#f97316' : borde}`,
          }}>
          ⚠️ {stockBajoCount > 0 ? `Stock bajo (${stockBajoCount})` : 'Stock bajo'}
        </button>
        <button onClick={abrirNuevo}
          className="text-xs font-semibold px-4 py-2 rounded-xl"
          style={{ background: boton, color: botonTexto }}>
          + Añadir
        </button>
      </div>

      {/* Resumen */}
      {!cargando && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Referencias', value: piezas.length, icon: '📦' },
            { label: 'Stock bajo', value: stockBajoCount, icon: '⚠️', alert: stockBajoCount > 0 },
            { label: 'Valor stock', icon: '💰', value: piezas.reduce((a, p) => a + (p.precio_coste || 0) * p.cantidad, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) },
          ].map(k => (
            <div key={k.label} className="rounded-xl p-3 text-center" style={{ border: `1px solid ${k.alert ? '#f97316' : borde}`, background: k.alert ? '#fff7ed' : fondoClaro ? '#fff' : fondo }}>
              <p className="text-lg">{k.icon}</p>
              <p className="text-xl font-bold mt-0.5" style={{ color: k.alert ? '#f97316' : texto }}>{k.value}</p>
              <p className="text-xs" style={{ color: textoSec }}>{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Lista */}
      {cargando ? (
        <p className="text-sm" style={{ color: textoSec }}>Cargando stock…</p>
      ) : piezasFiltradas.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ border: `1px dashed ${borde}` }}>
          <p className="text-3xl mb-3">📦</p>
          <p className="text-sm mb-3" style={{ color: textoSec }}>
            {piezas.length === 0 ? 'Sin piezas en el inventario todavía' : 'No hay resultados'}
          </p>
          {piezas.length === 0 && (
            <button onClick={abrirNuevo} className="text-sm px-4 py-2 rounded-xl font-semibold" style={{ background: boton, color: botonTexto }}>
              Añadir primera pieza
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {piezasFiltradas.map(p => {
            const bajo = p.cantidad <= p.cantidad_minima
            const agotado = p.cantidad === 0
            return (
              <div key={p.id} className="rounded-xl p-4" style={{
                border: `1px solid ${agotado ? '#ef4444' : bajo ? '#f97316' : borde}`,
                background: agotado ? '#fef2f2' : bajo ? '#fff7ed' : fondoClaro ? '#fff' : fondo,
              }}>
                <div className="flex items-start gap-3">
                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm" style={{ color: texto }}>{p.nombre}</p>
                      {p.referencia && (
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: fondoSec, color: textoSec }}>{p.referencia}</span>
                      )}
                      {p.categoria && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: primario + '18', color: primario }}>{p.categoria}</span>
                      )}
                      {agotado && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600">Agotado</span>}
                      {!agotado && bajo && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-600">Stock bajo</span>}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs" style={{ color: textoSec }}>
                      {p.proveedor && <span>🏭 {p.proveedor}</span>}
                      {p.ubicacion && <span>📍 {p.ubicacion}</span>}
                      {p.precio_coste && <span>Coste: {fmt(p.precio_coste)}</span>}
                      {p.precio_venta && <span>Venta: {fmt(p.precio_venta)}</span>}
                    </div>
                    {p.notas && <p className="text-xs mt-1 line-clamp-1" style={{ color: textoSec }}>{p.notas}</p>}
                  </div>

                  {/* Control de cantidad */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <button onClick={() => ajustarCantidad(p, -1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
                        style={{ border: `1px solid ${borde}`, color: texto }}>−</button>
                      <span className="w-10 text-center font-bold text-base" style={{ color: agotado ? '#ef4444' : bajo ? '#f97316' : texto }}>
                        {p.cantidad}
                      </span>
                      <button onClick={() => ajustarCantidad(p, 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
                        style={{ border: `1px solid ${borde}`, color: texto }}>+</button>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => abrirEditar(p)} className="text-xs px-2 py-1 rounded-lg" style={{ border: `1px solid ${borde}`, color: textoSec }}>✏️</button>
                      <button onClick={() => eliminar(p)} className="text-xs px-2 py-1 rounded-lg" style={{ color: '#ef4444' }}>🗑</button>
                    </div>
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
