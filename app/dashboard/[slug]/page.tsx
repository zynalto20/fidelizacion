'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const { slug } = useParams()
  const router = useRouter()
  const [restaurante, setRestaurante] = useState<any>(null)
  const [stats, setStats] = useState({ clientes: 0, sellos: 0, canjes: 0 })
  const [statsServicios, setStatsServicios] = useState<any>({})
  const [reservas, setReservas] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null)
  const [historial, setHistorial] = useState<any[]>([])
  const [editandoFicha, setEditandoFicha] = useState(false)
  const [fichaForm, setFichaForm] = useState<any>({})
  const [guardandoFicha, setGuardandoFicha] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [creandoCliente, setCreandoCliente] = useState(false)
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [creando, setCreando] = useState(false)
  const [mensajeCliente, setMensajeCliente] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [nuevoPin, setNuevoPin] = useState('')
  const [nuevaRecompensa, setNuevaRecompensa] = useState('')
  const [colores, setColores] = useState<any>({})
  const [vista, setVista] = useState<'inicio' | 'clientes' | 'reservas' | 'ajustes'>('inicio')
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<any>(null)
  const [serviciosVehiculo, setServiciosVehiculo] = useState<any[]>([])
  const [creandoVehiculo, setCreandoVehiculo] = useState(false)
  const [vehiculoForm, setVehiculoForm] = useState({ tipo: 'Coche', marca: '', modelo: '', matricula: '', km_actuales: '' })
  const [creandoServicio, setCreandoServicio] = useState(false)
  const [editandoServicioId, setEditandoServicioId] = useState<string | null>(null)
  const [servicioForm, setServicioForm] = useState({ tipo_servicio: '', descripcion: '', fecha_servicio: '', km_servicio: '', proximo_servicio_fecha: '', proximo_servicio_km: '' })
  const [statsCliente, setStatsCliente] = useState<any>({})
  const [creandoReserva, setCreandoReserva] = useState(false)
  const [reservaForm, setReservaForm] = useState({ customer_name: '', customer_email: '', servicio: '', fecha: '', hora: '', notas: '' })

  useEffect(() => {
    async function cargarDatos() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/dashboard/login'); return }
      const { data: rest } = await supabase.from('restaurants').select('*').eq('slug', slug).eq('owner_id', session.user.id).single()
      if (!rest) { router.push('/dashboard/login'); return }
      setRestaurante(rest)
      setNuevoPin(rest.pin)
      setNuevaRecompensa(rest.recompensa)
      setColores({ color_fondo: rest.color_fondo || '#000000', color_texto: rest.color_texto || '#ffffff', color_primario: rest.color_primario || '#ffffff', color_boton: rest.color_boton || '#ffffff', color_boton_texto: rest.color_boton_texto || '#000000' })
      const { count: totalClientes } = await supabase.from('loyalty_cards').select('*', { count: 'exact', head: true }).eq('restaurant_id', rest.id)
      const { count: totalSellos } = await supabase.from('stamp_events').select('*', { count: 'exact', head: true }).eq('tipo', 'sello')
      const { count: totalCanjes } = await supabase.from('stamp_events').select('*', { count: 'exact', head: true }).eq('tipo', 'canje')
      setStats({ clientes: totalClientes || 0, sellos: totalSellos || 0, canjes: totalCanjes || 0 })
      const { data: res } = await supabase.from('bookings').select('*').eq('restaurant_id', rest.id).order('fecha', { ascending: true }).order('hora', { ascending: true })
      setReservas(res || [])
      const { data: clientesData } = await supabase.from('loyalty_cards').select('*, customers(id, email, nombre, apellidos, telefono_nuevo, prefijo_telefono, dni, direccion, ciudad, codigo_postal)').eq('restaurant_id', rest.id).order('actualizado_en', { ascending: false })
      setClientes(clientesData || [])
      const { data: serviciosData } = await supabase.from('vehicle_services').select('tipo_servicio').eq('restaurant_id', rest.id)
      const conteo: any = {}
      serviciosData?.forEach(s => { conteo[s.tipo_servicio] = (conteo[s.tipo_servicio] || 0) + 1 })
      setStatsServicios(conteo)
      setCargando(false)
    }
    cargarDatos()
  }, [slug])

  async function verFichaCliente(cliente: any) {
    setClienteSeleccionado(cliente)
    setVehiculoSeleccionado(null)
    setEditandoFicha(false)
    setFichaForm({
      nombre: cliente.customers?.nombre || '',
      apellidos: cliente.customers?.apellidos || '',
      prefijo_telefono: cliente.customers?.prefijo_telefono || '+34',
      telefono_nuevo: cliente.customers?.telefono_nuevo || '',
      dni: cliente.customers?.dni || '',
      direccion: cliente.customers?.direccion || '',
      ciudad: cliente.customers?.ciudad || '',
      codigo_postal: cliente.customers?.codigo_postal || '',
    })
    const { data: h } = await supabase.from('stamp_events').select('*').eq('card_id', cliente.id).order('creado_en', { ascending: false })
    setHistorial(h || [])
    const { data: v } = await supabase.from('vehicles').select('*').eq('customer_id', cliente.customers?.id).order('creado_en', { ascending: false })
    setVehiculos(v || [])
    if (v && v.length > 0) {
      const { data: svcs } = await supabase.from('vehicle_services').select('tipo_servicio').eq('restaurant_id', restaurante.id).in('vehicle_id', v.map((vv: any) => vv.id))
      const conteo: any = {}
      svcs?.forEach(s => { conteo[s.tipo_servicio] = (conteo[s.tipo_servicio] || 0) + 1 })
      setStatsCliente(conteo)
    } else {
      setStatsCliente({})
    }
  }

  async function verVehiculo(v: any) {
    setVehiculoSeleccionado(v)
    const { data: s } = await supabase.from('vehicle_services').select('*').eq('vehicle_id', v.id).order('fecha_servicio', { ascending: false })
    setServiciosVehiculo(s || [])
  }

  async function guardarFicha() {
    setGuardandoFicha(true)
    await supabase.from('customers').update(fichaForm).eq('id', clienteSeleccionado.customers?.id)
    setClienteSeleccionado({ ...clienteSeleccionado, customers: { ...clienteSeleccionado.customers, ...fichaForm } })
    setEditandoFicha(false)
    setGuardandoFicha(false)
  }

  async function crearVehiculo() {
    const { data } = await supabase.from('vehicles').insert({ ...vehiculoForm, km_actuales: parseInt(vehiculoForm.km_actuales) || 0, customer_id: clienteSeleccionado.customers?.id }).select().single()
    if (data) setVehiculos([data, ...vehiculos])
    setCreandoVehiculo(false)
    setVehiculoForm({ tipo: 'Coche', marca: '', modelo: '', matricula: '', km_actuales: '' })
  }

  async function eliminarVehiculo(id: string) {
    if (!confirm('¿Eliminar este vehículo y todo su historial?')) return
    await supabase.from('vehicle_services').delete().eq('vehicle_id', id)
    await supabase.from('vehicles').delete().eq('id', id)
    setVehiculos(vehiculos.filter(v => v.id !== id))
    if (vehiculoSeleccionado?.id === id) setVehiculoSeleccionado(null)
  }

  function resetServicioForm() {
    setServicioForm({ tipo_servicio: '', descripcion: '', fecha_servicio: '', km_servicio: '', proximo_servicio_fecha: '', proximo_servicio_km: '' })
  }

  async function crearServicio() {
    const payload: any = {
      tipo_servicio: servicioForm.tipo_servicio,
      descripcion: servicioForm.descripcion || null,
      fecha_servicio: servicioForm.fecha_servicio || null,
      km_servicio: parseInt(servicioForm.km_servicio) || null,
      proximo_servicio_fecha: servicioForm.proximo_servicio_fecha || null,
      proximo_servicio_km: parseInt(servicioForm.proximo_servicio_km) || null,
      vehicle_id: vehiculoSeleccionado.id,
      restaurant_id: restaurante.id
    }
    const { data } = await supabase.from('vehicle_services').insert(payload).select().single()
    if (data) {
      setServiciosVehiculo([data, ...serviciosVehiculo])
      setCreandoServicio(false)
      resetServicioForm()
    }
  }

  async function editarServicio() {
    const payload: any = {
      tipo_servicio: servicioForm.tipo_servicio,
      descripcion: servicioForm.descripcion || null,
      fecha_servicio: servicioForm.fecha_servicio || null,
      km_servicio: parseInt(servicioForm.km_servicio) || null,
      proximo_servicio_fecha: servicioForm.proximo_servicio_fecha || null,
      proximo_servicio_km: parseInt(servicioForm.proximo_servicio_km) || null,
    }
    await supabase.from('vehicle_services').update(payload).eq('id', editandoServicioId)
    setServiciosVehiculo(serviciosVehiculo.map(s => s.id === editandoServicioId ? { ...s, ...payload } : s))
    setEditandoServicioId(null)
    resetServicioForm()
  }

  async function eliminarServicio(id: string) {
    if (!confirm('¿Eliminar este servicio?')) return
    await supabase.from('vehicle_services').delete().eq('id', id)
    setServiciosVehiculo(serviciosVehiculo.filter(s => s.id !== id))
  }

  async function crearReserva() {
    const { data } = await supabase.from('bookings').insert({
      restaurant_id: restaurante.id,
      customer_name: reservaForm.customer_name,
      customer_email: reservaForm.customer_email || null,
      servicio: reservaForm.servicio || 'General',
      fecha: reservaForm.fecha,
      hora: reservaForm.hora,
      notas: reservaForm.notas || null,
      estado: 'pendiente'
    }).select().single()
    if (data) {
      setReservas([...reservas, data].sort((a, b) => a.fecha > b.fecha ? 1 : -1))
      setCreandoReserva(false)
      setReservaForm({ customer_name: '', customer_email: '', servicio: '', fecha: '', hora: '', notas: '' })
    }
  }

  async function crearCliente() {
    setCreando(true)
    setMensajeCliente('')
    const { data: clienteExiste } = await supabase.from('customers').select('*').eq('email', nuevoEmail).single()
    let customerId = clienteExiste?.id
    if (!customerId) {
      const { data: nuevo } = await supabase.from('customers').insert({ email: nuevoEmail, prefijo_telefono: '+34' }).select().single()
      customerId = nuevo?.id
    }
    if (!customerId) { setMensajeCliente('Error al crear el cliente'); setCreando(false); return }
    const { error } = await supabase.from('loyalty_cards').insert({ restaurant_id: restaurante.id, customer_id: customerId, sellos_actuales: 0 })
    if (error) {
      setMensajeCliente('Este cliente ya existe')
    } else {
      setMensajeCliente('✓ Cliente añadido')
      setNuevoEmail('')
      setCreandoCliente(false)
      const { data: clientesData } = await supabase.from('loyalty_cards').select('*, customers(id, email, nombre, apellidos, telefono_nuevo, prefijo_telefono, dni, direccion, ciudad, codigo_postal)').eq('restaurant_id', restaurante.id).order('actualizado_en', { ascending: false })
      setClientes(clientesData || [])
    }
    setCreando(false)
  }

  async function eliminarCliente(c: any) {
    if (!confirm('¿Eliminar este cliente? Se borrarán sus sellos y historial.')) return
    await supabase.from('stamp_events').delete().eq('card_id', c.id)
    await supabase.from('loyalty_cards').delete().eq('id', c.id)
    setClientes(clientes.filter(cl => cl.id !== c.id))
  }

  async function guardarCambios() {
    setGuardando(true)
    setMensaje('')
    await supabase.from('restaurants').update({ pin: nuevoPin, recompensa: nuevaRecompensa, ...colores }).eq('id', restaurante.id)
    setMensaje('✓ Cambios guardados')
    setGuardando(false)
  }

  async function cambiarEstadoReserva(id: string, estado: string) {
    await supabase.from('bookings').update({ estado }).eq('id', id)
    setReservas(reservas.map(r => r.id === id ? { ...r, estado } : r))
  }

  if (cargando) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white text-sm tracking-widest uppercase">Cargando</p>
    </div>
  )

  const fondo = restaurante.color_fondo || '#000000'
  const texto = restaurante.color_texto || '#ffffff'
  const boton = restaurante.color_boton || '#ffffff'
  const botonTexto = restaurante.color_boton_texto || '#000000'
  const primario = restaurante.color_primario || '#ffffff'

  const fondoClaro = (() => {
    try {
      const r = parseInt(fondo.slice(1, 3), 16)
      const g = parseInt(fondo.slice(3, 5), 16)
      const b = parseInt(fondo.slice(5, 7), 16)
      return (r * 299 + g * 587 + b * 114) / 1000 > 128
    } catch { return false }
  })()

  const textoSec = fondoClaro ? '#64748b' : 'rgba(255,255,255,0.5)'
  const borde = fondoClaro ? '#e2e8f0' : 'rgba(255,255,255,0.15)'
  const bordeClaro = fondoClaro ? '#f1f5f9' : 'rgba(255,255,255,0.08)'

  const formServicio = (onGuardar: () => void, onCancelar: () => void, titulo: string) => (
    <div className="rounded-xl p-4 mb-4" style={{ border: `1px solid ${editandoServicioId ? primario : borde}` }}>
      <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>{titulo}</p>
      <div className="mb-3">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Tipo de servicio</p>
        <select value={servicioForm.tipo_servicio} onChange={(e) => setServicioForm({ ...servicioForm, tipo_servicio: e.target.value })} className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }}>
          <option value="" style={{ background: fondoClaro ? '#fff' : '#000' }}>— Seleccionar —</option>
          {['Cambio de aceite', 'Revisión general', 'Frenos', 'Neumáticos', 'Filtros', 'Correa de distribución', 'Batería', 'ITV', 'Otro'].map(s => (
            <option key={s} value={s} style={{ background: fondoClaro ? '#fff' : '#000' }}>{s}</option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Descripción</p>
        <textarea value={servicioForm.descripcion} onChange={(e) => setServicioForm({ ...servicioForm, descripcion: e.target.value })} className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm resize-none h-20" style={{ border: `1px solid ${borde}`, color: texto }} />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Fecha servicio</p>
          <input type="date" value={servicioForm.fecha_servicio} onChange={(e) => setServicioForm({ ...servicioForm, fecha_servicio: e.target.value })} className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
        </div>
        <div>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>KM actuales</p>
          <input type="number" value={servicioForm.km_servicio} onChange={(e) => setServicioForm({ ...servicioForm, km_servicio: e.target.value })} placeholder="0" className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
        </div>
      </div>
      <p className="text-xs tracking-widest uppercase mb-2" style={{ color: textoSec }}>Próximo servicio</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs mb-1" style={{ color: textoSec }}>Fecha</p>
          <input type="date" value={servicioForm.proximo_servicio_fecha} onChange={(e) => setServicioForm({ ...servicioForm, proximo_servicio_fecha: e.target.value })} className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: textoSec }}>KM</p>
          <input type="number" value={servicioForm.proximo_servicio_km} onChange={(e) => setServicioForm({ ...servicioForm, proximo_servicio_km: e.target.value })} placeholder="0" className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onGuardar} disabled={!servicioForm.tipo_servicio} className="flex-1 text-xs font-semibold rounded-lg py-2 disabled:opacity-30" style={{ background: boton, color: botonTexto }}>Guardar</button>
        <button onClick={onCancelar} className="flex-1 text-xs font-semibold rounded-lg py-2" style={{ border: `1px solid ${borde}`, color: textoSec, background: 'transparent' }}>Cancelar</button>
      </div>
    </div>
  )

  if (vehiculoSeleccionado) return (
    <main className="min-h-screen p-6 pb-24" style={{ background: fondo }}>
      <div className="max-w-sm mx-auto">
        <button onClick={() => setVehiculoSeleccionado(null)} className="mb-6 text-xs tracking-widest uppercase" style={{ color: textoSec }}>← Volver</button>
        <div className="mb-6">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: textoSec }}>Vehículo</p>
          <h1 className="text-2xl font-bold" style={{ color: texto }}>{vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo}</h1>
          <p className="text-sm mt-1" style={{ color: textoSec }}>{vehiculoSeleccionado.matricula} · {vehiculoSeleccionado.tipo} · {vehiculoSeleccionado.km_actuales?.toLocaleString()} km</p>
        </div>

        <div className="flex justify-between items-center mb-4">
          <p className="text-xs tracking-widest uppercase" style={{ color: textoSec }}>Historial de servicios</p>
          <button onClick={() => { setCreandoServicio(true); setEditandoServicioId(null); resetServicioForm() }} className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: boton, color: botonTexto }}>+ Añadir</button>
        </div>

        {editandoServicioId && formServicio(editarServicio, () => { setEditandoServicioId(null); resetServicioForm() }, 'Editar servicio')}
        {creandoServicio && !editandoServicioId && formServicio(crearServicio, () => { setCreandoServicio(false); resetServicioForm() }, 'Nuevo servicio')}

        {serviciosVehiculo.length === 0 ? (
          <p className="text-sm" style={{ color: textoSec }}>Sin servicios todavía</p>
        ) : (
          serviciosVehiculo.map(s => (
            <div key={s.id} className="rounded-xl p-4 mb-3" style={{ border: `1px solid ${editandoServicioId === s.id ? primario : borde}` }}>
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium" style={{ color: texto }}>{s.tipo_servicio}</p>
                <div className="flex gap-2 items-center">
                  <p className="text-xs" style={{ color: textoSec }}>{s.fecha_servicio}</p>
                  <button onClick={() => { setEditandoServicioId(s.id); setCreandoServicio(false); setServicioForm({ tipo_servicio: s.tipo_servicio, descripcion: s.descripcion || '', fecha_servicio: s.fecha_servicio || '', km_servicio: s.km_servicio?.toString() || '', proximo_servicio_fecha: s.proximo_servicio_fecha || '', proximo_servicio_km: s.proximo_servicio_km?.toString() || '' }) }} className="text-xs px-2 py-1 rounded-lg" style={{ color: primario, border: `1px solid ${primario}` }}>Editar</button>
                  <button onClick={() => eliminarServicio(s.id)} className="text-xs px-2 py-1 rounded-lg" style={{ color: '#ef4444', border: '1px solid #fca5a5' }}>✕</button>
                </div>
              </div>
              {s.descripcion && <p className="text-sm mb-2" style={{ color: textoSec }}>{s.descripcion}</p>}
              {s.km_servicio && <p className="text-xs mb-2" style={{ color: textoSec }}>KM: {s.km_servicio?.toLocaleString()}</p>}
              {(s.proximo_servicio_fecha || s.proximo_servicio_km) && (
                <div className="rounded-lg p-2 mt-2" style={{ background: fondoClaro ? '#f0f9ff' : 'rgba(14,165,233,0.1)' }}>
                  <p className="text-xs font-medium" style={{ color: primario }}>Próximo servicio</p>
                  {s.proximo_servicio_fecha && <p className="text-xs" style={{ color: textoSec }}>Fecha: {s.proximo_servicio_fecha}</p>}
                  {s.proximo_servicio_km && <p className="text-xs" style={{ color: textoSec }}>KM: {s.proximo_servicio_km?.toLocaleString()}</p>}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  )

  if (clienteSeleccionado) return (
    <main className="min-h-screen p-6 pb-24" style={{ background: fondo }}>
      <div className="max-w-sm mx-auto">
        <button onClick={() => setClienteSeleccionado(null)} className="mb-6 text-xs tracking-widest uppercase" style={{ color: textoSec }}>← Volver</button>
        <div className="mb-8">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: textoSec }}>Ficha de cliente</p>
          <h1 className="text-2xl font-bold break-all" style={{ color: texto }}>{clienteSeleccionado.customers?.nombre ? `${clienteSeleccionado.customers.nombre} ${clienteSeleccionado.customers.apellidos || ''}` : clienteSeleccionado.customers?.email || 'Sin email'}</h1>
          {clienteSeleccionado.customers?.nombre && <p className="text-sm mt-1" style={{ color: textoSec }}>{clienteSeleccionado.customers?.email}</p>}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[{ label: 'Sellos', value: clienteSeleccionado.sellos_actuales }, { label: 'Canjes', value: clienteSeleccionado.total_canjes }, { label: 'Visitas', value: historial.filter(h => h.tipo === 'sello').length }].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-4 text-center" style={{ border: `1px solid ${borde}` }}>
              <p className="text-3xl font-bold" style={{ color: texto }}>{value}</p>
              <p className="text-xs tracking-widest uppercase mt-1" style={{ color: textoSec }}>{label}</p>
            </div>
          ))}
        </div>

        {Object.keys(statsCliente).length > 0 && (
          <div className="rounded-xl p-4 mb-6" style={{ border: `1px solid ${borde}` }}>
            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Servicios realizados</p>
            {Object.entries(statsCliente).sort((a: any, b: any) => b[1] - a[1]).map(([tipo, count]: any) => (
              <div key={tipo} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${bordeClaro}` }}>
                <p className="text-sm" style={{ color: texto }}>{tipo}</p>
                <p className="text-sm font-bold" style={{ color: primario }}>{count}</p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl p-5 mb-6" style={{ border: `1px solid ${borde}` }}>
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs tracking-widest uppercase" style={{ color: textoSec }}>Datos personales</p>
            <button onClick={() => setEditandoFicha(!editandoFicha)} className="text-xs font-semibold px-3 py-1 rounded-lg" style={{ background: boton, color: botonTexto }}>
              {editandoFicha ? 'Cancelar' : 'Editar'}
            </button>
          </div>
          {editandoFicha ? (
            <div>
              {[{ label: 'Nombre', key: 'nombre', type: 'text' }, { label: 'Apellidos', key: 'apellidos', type: 'text' }, { label: 'DNI', key: 'dni', type: 'text' }].map(({ label, key, type }) => (
                <div key={key} className="mb-3">
                  <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>{label}</p>
                  <input type={type} value={fichaForm[key] || ''} onChange={(e) => setFichaForm({ ...fichaForm, [key]: e.target.value })} className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
                </div>
              ))}
              <p className="text-xs tracking-widest uppercase mb-2 mt-3" style={{ color: textoSec }}>Teléfono</p>
              <div className="flex gap-2 mb-3">
                <select value={fichaForm.prefijo_telefono || '+34'} onChange={(e) => setFichaForm({ ...fichaForm, prefijo_telefono: e.target.value })} className="bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm w-24" style={{ border: `1px solid ${borde}`, color: texto }}>
                  {['+34', '+1', '+44', '+33', '+49', '+39', '+351', '+52', '+54', '+57', '+56', '+51'].map(p => (
                    <option key={p} value={p} style={{ background: fondoClaro ? '#fff' : '#000' }}>{p}</option>
                  ))}
                </select>
                <input type="tel" value={fichaForm.telefono_nuevo || ''} onChange={(e) => setFichaForm({ ...fichaForm, telefono_nuevo: e.target.value })} placeholder="600 000 000" className="flex-1 bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
              </div>
              <p className="text-xs tracking-widest uppercase mb-2 mt-3" style={{ color: textoSec }}>Dirección</p>
              {[{ label: 'Calle y número', key: 'direccion' }, { label: 'Ciudad', key: 'ciudad' }, { label: 'Código postal', key: 'codigo_postal' }].map(({ label, key }) => (
                <div key={key} className="mb-3">
                  <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>{label}</p>
                  <input type="text" value={fichaForm[key] || ''} onChange={(e) => setFichaForm({ ...fichaForm, [key]: e.target.value })} className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
                </div>
              ))}
              <button onClick={guardarFicha} disabled={guardandoFicha} className="w-full font-semibold rounded-xl py-3 mt-2 disabled:opacity-30 text-sm" style={{ background: boton, color: botonTexto }}>
                {guardandoFicha ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          ) : (
            <div>
              {[
                { label: 'Nombre', value: clienteSeleccionado.customers?.nombre },
                { label: 'Apellidos', value: clienteSeleccionado.customers?.apellidos },
                { label: 'DNI', value: clienteSeleccionado.customers?.dni },
                { label: 'Teléfono', value: clienteSeleccionado.customers?.telefono_nuevo ? `${clienteSeleccionado.customers.prefijo_telefono || '+34'} ${clienteSeleccionado.customers.telefono_nuevo}` : null },
                { label: 'Dirección', value: clienteSeleccionado.customers?.direccion },
                { label: 'Ciudad', value: clienteSeleccionado.customers?.ciudad },
                { label: 'C. Postal', value: clienteSeleccionado.customers?.codigo_postal },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${bordeClaro}` }}>
                  <p className="text-xs tracking-widest uppercase" style={{ color: textoSec }}>{label}</p>
                  <p className="text-sm" style={{ color: value ? texto : textoSec }}>{value || '—'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl p-5 mb-6" style={{ border: `1px solid ${borde}` }}>
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs tracking-widest uppercase" style={{ color: textoSec }}>Vehículos</p>
            <button onClick={() => setCreandoVehiculo(true)} className="text-xs font-semibold px-3 py-1 rounded-lg" style={{ background: boton, color: botonTexto }}>+ Añadir</button>
          </div>
          {creandoVehiculo && (
            <div className="mb-4 p-3 rounded-xl" style={{ border: `1px solid ${borde}` }}>
              <div className="mb-3">
                <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Tipo</p>
                <select value={vehiculoForm.tipo} onChange={(e) => setVehiculoForm({ ...vehiculoForm, tipo: e.target.value })} className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }}>
                  {['Coche', 'Moto', 'Camioneta', 'Autobús', 'Camión', 'Furgoneta', 'Otro'].map(v => (
                    <option key={v} value={v} style={{ background: fondoClaro ? '#fff' : '#000' }}>{v}</option>
                  ))}
                </select>
              </div>
              {[{ label: 'Marca', key: 'marca' }, { label: 'Modelo', key: 'modelo' }, { label: 'Matrícula', key: 'matricula' }].map(({ label, key }) => (
                <div key={key} className="mb-3">
                  <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>{label}</p>
                  <input type="text" value={vehiculoForm[key as keyof typeof vehiculoForm]} onChange={(e) => setVehiculoForm({ ...vehiculoForm, [key]: key === 'matricula' ? e.target.value.toUpperCase() : e.target.value })} className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
                </div>
              ))}
              <div className="mb-3">
                <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>KM actuales</p>
                <input type="number" value={vehiculoForm.km_actuales} onChange={(e) => setVehiculoForm({ ...vehiculoForm, km_actuales: e.target.value })} placeholder="0" className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
              </div>
              <div className="flex gap-2">
                <button onClick={crearVehiculo} className="flex-1 text-xs font-semibold rounded-lg py-2" style={{ background: boton, color: botonTexto }}>Guardar</button>
                <button onClick={() => setCreandoVehiculo(false)} className="flex-1 text-xs font-semibold rounded-lg py-2" style={{ border: `1px solid ${borde}`, color: textoSec, background: 'transparent' }}>Cancelar</button>
              </div>
            </div>
          )}
          {vehiculos.length === 0 ? (
            <p className="text-sm" style={{ color: textoSec }}>Sin vehículos todavía</p>
          ) : (
            vehiculos.map(v => (
              <div key={v.id} className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${bordeClaro}` }}>
                <button onClick={() => verVehiculo(v)} className="flex-1 text-left">
                  <p className="font-medium text-sm" style={{ color: texto }}>{v.marca} {v.modelo}</p>
                  <p className="text-xs" style={{ color: textoSec }}>{v.matricula} · {v.tipo} · {v.km_actuales?.toLocaleString()} km</p>
                </button>
                <button onClick={() => eliminarVehiculo(v.id)} className="ml-3 text-xs px-2 py-1 rounded-lg" style={{ color: '#ef4444', border: '1px solid #fca5a5' }}>✕</button>
              </div>
            ))
          )}
        </div>

        <div className="rounded-xl p-5" style={{ border: `1px solid ${borde}` }}>
          <p className="text-xs tracking-widest uppercase mb-4" style={{ color: textoSec }}>Historial de sellos</p>
          {historial.length === 0 ? (
            <p className="text-sm" style={{ color: textoSec }}>Sin actividad todavía</p>
          ) : (
            historial.map(h => (
              <div key={h.id} className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${bordeClaro}` }}>
                <span>{h.tipo === 'sello' ? '⬤' : '🎁'}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: texto }}>{h.tipo === 'sello' ? 'Sello dado' : 'Premio canjeado'}</p>
                  <p className="text-xs" style={{ color: textoSec }}>{new Date(h.creado_en).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen p-6 pb-24" style={{ background: fondo }}>
      <div className="max-w-sm mx-auto">
        <div className="mb-8 pt-6">
          {restaurante.logo_url && <img src={restaurante.logo_url} alt={restaurante.nombre} className="h-12 object-contain mb-6" />}
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: textoSec }}>Dashboard</p>
          <h1 className="text-4xl font-bold leading-tight" style={{ color: texto }}>{restaurante.nombre}</h1>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto">
          {['inicio', 'clientes', 'reservas', 'ajustes'].map(v => (
            <button key={v} onClick={() => setVista(v as any)} className="flex-shrink-0 px-3 py-2 rounded-xl text-xs tracking-widest uppercase transition-colors" style={{ background: vista === v ? primario : 'transparent', color: vista === v ? botonTexto : textoSec, border: vista === v ? 'none' : `1px solid ${borde}` }}>
              {v}
            </button>
          ))}
        </div>

        {vista === 'inicio' && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[{ label: 'Clientes', value: stats.clientes }, { label: 'Canjes', value: stats.canjes }, { label: 'Sellos', value: stats.sellos }].map(({ label, value }) => (
                <div key={label} className="rounded-xl p-4 text-center" style={{ border: `1px solid ${borde}` }}>
                  <p className="text-3xl font-bold" style={{ color: texto }}>{value}</p>
                  <p className="text-xs tracking-widest uppercase mt-1" style={{ color: textoSec }}>{label}</p>
                </div>
              ))}
            </div>
            {Object.keys(statsServicios).length > 0 && (
              <div className="rounded-xl p-5 mb-6" style={{ border: `1px solid ${borde}` }}>
                <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Servicios realizados</p>
                {Object.entries(statsServicios).sort((a: any, b: any) => b[1] - a[1]).map(([tipo, count]: any) => (
                  <div key={tipo} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${bordeClaro}` }}>
                    <p className="text-sm" style={{ color: texto }}>{tipo}</p>
                    <p className="text-sm font-bold" style={{ color: primario }}>{count}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="rounded-xl p-5 mb-4" style={{ border: `1px solid ${borde}` }}>
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Próximas reservas</p>
              {reservas.filter(r => r.estado !== 'cancelada').slice(0, 3).length === 0 ? (
                <p className="text-sm" style={{ color: textoSec }}>No hay reservas próximas</p>
              ) : (
                reservas.filter(r => r.estado !== 'cancelada').slice(0, 3).map(r => (
                  <div key={r.id} className="py-3" style={{ borderBottom: `1px solid ${bordeClaro}` }}>
                    <p className="font-medium" style={{ color: texto }}>{r.customer_name}</p>
                    <p className="text-sm" style={{ color: textoSec }}>{r.fecha} · {r.hora} · {r.servicio}</p>
                  </div>
                ))
              )}
              <button onClick={() => setVista('reservas')} className="w-full mt-3 text-xs tracking-widest uppercase" style={{ color: textoSec }}>Ver todas →</button>
            </div>
          </>
        )}

        {vista === 'clientes' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs tracking-widest uppercase" style={{ color: textoSec }}>Todos los clientes</p>
              <button onClick={() => setCreandoCliente(true)} className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: boton, color: botonTexto }}>+ Añadir</button>
            </div>
            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por email o nombre..." className="w-full bg-transparent rounded-xl px-4 py-3 mb-4 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
            {creandoCliente && (
              <div className="rounded-xl p-4 mb-4" style={{ border: `1px solid ${borde}` }}>
                <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Nuevo cliente</p>
                <input type="email" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} placeholder="email@cliente.com" className="w-full bg-transparent rounded-xl px-4 py-3 mb-3 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
                <div className="flex gap-2">
                  <button onClick={crearCliente} disabled={!nuevoEmail || creando} className="flex-1 text-xs font-semibold rounded-lg py-2 disabled:opacity-30" style={{ background: boton, color: botonTexto }}>{creando ? '...' : 'Crear'}</button>
                  <button onClick={() => { setCreandoCliente(false); setNuevoEmail('') }} className="flex-1 text-xs font-semibold rounded-lg py-2" style={{ border: `1px solid ${borde}`, color: textoSec, background: 'transparent' }}>Cancelar</button>
                </div>
                {mensajeCliente && <p className="text-xs mt-2" style={{ color: primario }}>{mensajeCliente}</p>}
              </div>
            )}
            {clientes.filter(c => !busqueda || c.customers?.email?.toLowerCase().includes(busqueda.toLowerCase()) || c.customers?.nombre?.toLowerCase().includes(busqueda.toLowerCase())).length === 0 ? (
              <p className="text-sm" style={{ color: textoSec }}>No hay clientes todavía</p>
            ) : (
              clientes.filter(c => !busqueda || c.customers?.email?.toLowerCase().includes(busqueda.toLowerCase()) || c.customers?.nombre?.toLowerCase().includes(busqueda.toLowerCase())).map(c => (
                <div key={c.id} className="rounded-xl p-4 mb-3" style={{ border: `1px solid ${borde}` }}>
                  <div className="flex justify-between items-center">
                    <button onClick={() => verFichaCliente(c)} className="flex-1 text-left">
                      <p className="font-medium" style={{ color: texto }}>{c.customers?.nombre ? `${c.customers.nombre} ${c.customers.apellidos || ''}` : c.customers?.email || 'Sin email'}</p>
                      {c.customers?.nombre && <p className="text-xs mt-0.5" style={{ color: textoSec }}>{c.customers?.email}</p>}
                      <p className="text-sm mt-1" style={{ color: textoSec }}>{c.sellos_actuales} de {restaurante.sellos_necesarios} sellos · {c.total_canjes} canjes</p>
                    </button>
                    <button onClick={() => eliminarCliente(c)} className="ml-3 text-xs px-2 py-1 rounded-lg" style={{ color: '#ef4444', border: '1px solid #fca5a5' }}>Eliminar</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {vista === 'reservas' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs tracking-widest uppercase" style={{ color: textoSec }}>Todas las reservas</p>
              <button onClick={() => setCreandoReserva(true)} className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: boton, color: botonTexto }}>+ Añadir</button>
            </div>

            {creandoReserva && (
              <div className="rounded-xl p-4 mb-4" style={{ border: `1px solid ${borde}` }}>
                <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Nueva reserva</p>
                {[
                  { label: 'Nombre cliente', key: 'customer_name', type: 'text' },
                  { label: 'Email cliente', key: 'customer_email', type: 'email' },
                  { label: 'Servicio', key: 'servicio', type: 'text' },
                ].map(({ label, key, type }) => (
                  <div key={key} className="mb-3">
                    <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>{label}</p>
                    <input type={type} value={reservaForm[key as keyof typeof reservaForm]} onChange={(e) => setReservaForm({ ...reservaForm, [key]: e.target.value })} className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Fecha</p>
                    <input type="date" value={reservaForm.fecha} onChange={(e) => setReservaForm({ ...reservaForm, fecha: e.target.value })} className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
                  </div>
                  <div>
                    <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Hora</p>
                    <input type="time" value={reservaForm.hora} onChange={(e) => setReservaForm({ ...reservaForm, hora: e.target.value })} className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Notas (opcional)</p>
                  <textarea value={reservaForm.notas} onChange={(e) => setReservaForm({ ...reservaForm, notas: e.target.value })} className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm resize-none h-16" style={{ border: `1px solid ${borde}`, color: texto }} />
                </div>
                <div className="flex gap-2">
                  <button onClick={crearReserva} disabled={!reservaForm.customer_name || !reservaForm.fecha || !reservaForm.hora} className="flex-1 text-xs font-semibold rounded-lg py-2 disabled:opacity-30" style={{ background: boton, color: botonTexto }}>Crear</button>
                  <button onClick={() => { setCreandoReserva(false); setReservaForm({ customer_name: '', customer_email: '', servicio: '', fecha: '', hora: '', notas: '' }) }} className="flex-1 text-xs font-semibold rounded-lg py-2" style={{ border: `1px solid ${borde}`, color: textoSec, background: 'transparent' }}>Cancelar</button>
                </div>
              </div>
            )}

            {reservas.length === 0 ? (
              <p className="text-sm" style={{ color: textoSec }}>No hay reservas todavía</p>
            ) : (
              reservas.map(r => (
                <div key={r.id} className="rounded-xl p-4 mb-3" style={{ border: `1px solid ${borde}` }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium" style={{ color: texto }}>{r.customer_name}</p>
                      <p className="text-sm" style={{ color: textoSec }}>{r.customer_email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${r.estado === 'confirmada' ? 'bg-green-100 text-green-700' : r.estado === 'cancelada' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{r.estado}</span>
                  </div>
                  <p className="text-sm mb-3" style={{ color: textoSec }}>{r.fecha} · {r.hora} · {r.servicio}</p>
                  {r.notas && <p className="text-xs mb-3" style={{ color: textoSec }}>"{r.notas}"</p>}
                  <div className="flex gap-2">
                    {r.estado !== 'confirmada' && <button onClick={() => cambiarEstadoReserva(r.id, 'confirmada')} className="flex-1 text-xs font-semibold rounded-lg py-2" style={{ background: boton, color: botonTexto }}>Confirmar</button>}
                    {r.estado !== 'cancelada' && <button onClick={() => cambiarEstadoReserva(r.id, 'cancelada')} className="flex-1 text-xs font-semibold rounded-lg py-2" style={{ border: `1px solid ${borde}`, color: textoSec, background: 'transparent' }}>Cancelar</button>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {vista === 'ajustes' && (
          <div>
            <div className="mb-6">
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>PIN para dar sello</p>
              <input type="number" value={nuevoPin} onChange={(e) => setNuevoPin(e.target.value)} className="w-full bg-transparent rounded-xl px-4 py-4 focus:outline-none" style={{ border: `1px solid ${borde}`, color: texto }} />
            </div>
            <div className="mb-6">
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Premio al completar</p>
              <input type="text" value={nuevaRecompensa} onChange={(e) => setNuevaRecompensa(e.target.value)} className="w-full bg-transparent rounded-xl px-4 py-4 focus:outline-none" style={{ border: `1px solid ${borde}`, color: texto }} />
            </div>
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: textoSec }}>Colores</p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[{ label: 'Fondo', key: 'color_fondo' }, { label: 'Texto', key: 'color_texto' }, { label: 'Primario', key: 'color_primario' }, { label: 'Botón', key: 'color_boton' }, { label: 'Texto botón', key: 'color_boton_texto' }].map(({ label, key }) => (
                <div key={key} className="rounded-xl p-3" style={{ border: `1px solid ${borde}` }}>
                  <p className="text-xs tracking-widest uppercase mb-2" style={{ color: textoSec }}>{label}</p>
                  <div className="flex items-center gap-2">
                    <input type="color" value={colores[key] || '#000000'} onChange={(e) => setColores({ ...colores, [key]: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                    <span className="text-xs font-mono" style={{ color: textoSec }}>{colores[key]}</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={guardarCambios} disabled={guardando} className="w-full font-semibold rounded-xl py-4 disabled:opacity-30 mb-4" style={{ background: boton, color: botonTexto }}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {mensaje && <p className="text-sm text-center mb-4" style={{ color: primario }}>{mensaje}</p>}
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/dashboard/login'))} className="w-full mt-2 text-xs tracking-widest uppercase" style={{ color: textoSec }}>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </main>
  )
}