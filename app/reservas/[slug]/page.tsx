'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const DIAS_SEMANA = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
const DIAS_CORTO = ['Lu','Ma','Mi','Ju','Vi','Sá','Do']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

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
  const [editandoReservaId, setEditandoReservaId] = useState<string | null>(null)
  const [reservaForm, setReservaForm] = useState({ customer_name: '', customer_email: '', customer_phone: '', servicio: '', fecha: '', hora: '', notas: '' })
  const [mesReserva, setMesReserva] = useState(new Date())
  const [serviciosNegocio, setServiciosNegocio] = useState<any[]>([])
  const [creandoServicioNegocio, setCreandoServicioNegocio] = useState(false)
  const [editandoServicioNegocioId, setEditandoServicioNegocioId] = useState<string | null>(null)
  const [servicioNegocioForm, setServicioNegocioForm] = useState({ nombre: '', duracion_minutos: '' })
  const [horarios, setHorarios] = useState<any[]>([])
  const [vistaReservas, setVistaReservas] = useState<'dia' | 'semana' | 'mes' | 'año'>('semana')
  const [fechaVista, setFechaVista] = useState(new Date())

  useEffect(() => {
    async function cargarDatos() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/dashboard/login'); return }
      const { data: rest } = await supabase.from('restaurants').select('*').eq('slug', slug).eq('owner_id', session.user.id).single()
      if (!rest) { router.push('/dashboard/login'); return }
      setRestaurante(rest)
      setNuevoPin(rest.pin)
      setNuevaRecompensa(rest.recompensa)
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
      const { data: svcsNegocio } = await supabase.from('services').select('*').eq('restaurant_id', rest.id).order('nombre')
      setServiciosNegocio(svcsNegocio || [])
      const { data: horariosData } = await supabase.from('horarios').select('*').eq('restaurant_id', rest.id)
      setHorarios(horariosData || [])
      setCargando(false)
    }
    cargarDatos()
  }, [slug])

  function getHorarioDia(diaSemana: number) {
    return horarios.filter(h => h.dia_semana === diaSemana && h.activo)
  }

  function generarHorasDisponibles(diaSemana: number) {
    const hDia = horarios.filter(h => h.dia_semana === diaSemana && h.activo)
    if (hDia.length === 0) return []
    const horas: string[] = []
    hDia.forEach(franja => {
      if (!franja.hora_inicio || !franja.hora_fin) return
      const [hIni, mIni] = franja.hora_inicio.slice(0,5).split(':').map(Number)
      const [hFin, mFin] = franja.hora_fin.slice(0,5).split(':').map(Number)
      let mins = hIni * 60 + mIni
      const finMins = hFin * 60 + mFin
      while (mins < finMins) {
        horas.push(`${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`)
        mins += 30
      }
    })
    return horas
  }

  async function guardarHorario(diaSemana: number, franja: number, campo: string, valor: any) {
    const existing = horarios.find(h => h.dia_semana === diaSemana && h.franja === franja)
    if (existing) {
      await supabase.from('horarios').update({ [campo]: valor }).eq('id', existing.id)
      setHorarios(horarios.map(h => h.id === existing.id ? { ...h, [campo]: valor } : h))
    } else {
      const { data } = await supabase.from('horarios').insert({ restaurant_id: restaurante.id, dia_semana: diaSemana, franja, [campo]: valor, activo: true }).select().single()
      if (data) setHorarios([...horarios, data])
    }
  }

  async function toggleDia(diaSemana: number) {
    const existentes = horarios.filter(h => h.dia_semana === diaSemana)
    if (existentes.length > 0) {
      const nuevoActivo = !existentes[0].activo
      await Promise.all(existentes.map(h => supabase.from('horarios').update({ activo: nuevoActivo }).eq('id', h.id)))
      setHorarios(horarios.map(h => h.dia_semana === diaSemana ? { ...h, activo: nuevoActivo } : h))
    } else {
      const { data: f1 } = await supabase.from('horarios').insert({ restaurant_id: restaurante.id, dia_semana: diaSemana, franja: 0, hora_inicio: '09:00', hora_fin: '14:00', activo: true }).select().single()
      const { data: f2 } = await supabase.from('horarios').insert({ restaurant_id: restaurante.id, dia_semana: diaSemana, franja: 1, hora_inicio: '16:00', hora_fin: '20:00', activo: true }).select().single()
      if (f1 && f2) setHorarios([...horarios, f1, f2])
    }
  }

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

  function resetReservaForm() {
    setReservaForm({ customer_name: '', customer_email: '', customer_phone: '', servicio: '', fecha: '', hora: '', notas: '' })
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

  async function crearServicioNegocio() {
    const { data } = await supabase.from('services').insert({
      restaurant_id: restaurante.id,
      nombre: servicioNegocioForm.nombre,
      duracion_minutos: parseInt(servicioNegocioForm.duracion_minutos) || null,
      activo: true
    }).select().single()
    if (data) {
      setServiciosNegocio([...serviciosNegocio, data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setCreandoServicioNegocio(false)
      setServicioNegocioForm({ nombre: '', duracion_minutos: '' })
    }
  }

  async function editarServicioNegocio() {
    const payload = { nombre: servicioNegocioForm.nombre, duracion_minutos: parseInt(servicioNegocioForm.duracion_minutos) || null }
    await supabase.from('services').update(payload).eq('id', editandoServicioNegocioId)
    setServiciosNegocio(serviciosNegocio.map(s => s.id === editandoServicioNegocioId ? { ...s, ...payload } : s))
    setEditandoServicioNegocioId(null)
    setServicioNegocioForm({ nombre: '', duracion_minutos: '' })
  }

  async function eliminarServicioNegocio(id: string) {
    if (!confirm('¿Eliminar este servicio?')) return
    await supabase.from('services').delete().eq('id', id)
    setServiciosNegocio(serviciosNegocio.filter(s => s.id !== id))
  }

  async function toggleActivoServicioNegocio(s: any) {
    await supabase.from('services').update({ activo: !s.activo }).eq('id', s.id)
    setServiciosNegocio(serviciosNegocio.map(sv => sv.id === s.id ? { ...sv, activo: !sv.activo } : sv))
  }

  async function crearReserva() {
    const { data } = await supabase.from('bookings').insert({
      restaurant_id: restaurante.id,
      customer_name: reservaForm.customer_name,
      customer_email: reservaForm.customer_email || null,
      servicio: reservaForm.servicio || 'General',
      fecha: reservaForm.fecha,
      hora: reservaForm.hora,
      notas: (reservaForm.customer_phone ? `Tel: ${reservaForm.customer_phone}${reservaForm.notas ? ' | ' + reservaForm.notas : ''}` : reservaForm.notas) || null,
      estado: 'pendiente'
    }).select().single()
    if (data) {
      setReservas([...reservas, data].sort((a, b) => a.fecha > b.fecha ? 1 : -1))
      setCreandoReserva(false)
      resetReservaForm()
    }
  }

  async function editarReserva() {
    const payload = {
      customer_name: reservaForm.customer_name,
      customer_email: reservaForm.customer_email || null,
      servicio: reservaForm.servicio || 'General',
      fecha: reservaForm.fecha,
      hora: reservaForm.hora,
      notas: (reservaForm.customer_phone ? `Tel: ${reservaForm.customer_phone}${reservaForm.notas ? ' | ' + reservaForm.notas : ''}` : reservaForm.notas) || null,
    }
    await supabase.from('bookings').update(payload).eq('id', editandoReservaId)
    setReservas(reservas.map(r => r.id === editandoReservaId ? { ...r, ...payload } : r))
    setEditandoReservaId(null)
    resetReservaForm()
  }

  async function eliminarReserva(id: string) {
    if (!confirm('¿Eliminar esta reserva?')) return
    await supabase.from('bookings').delete().eq('id', id)
    setReservas(reservas.filter(r => r.id !== id))
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
    if (error) { setMensajeCliente('Este cliente ya existe') } else {
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
    await supabase.from('restaurants').update({ pin: nuevoPin, recompensa: nuevaRecompensa }).eq('id', restaurante.id)
    setMensaje('✓ Cambios guardados')
    setGuardando(false)
  }

  async function cambiarEstadoReserva(id: string, estado: string) {
    await supabase.from('bookings').update({ estado }).eq('id', id)
    setReservas(reservas.map(r => r.id === id ? { ...r, estado } : r))
    if (estado === 'confirmada') {
      const reserva = reservas.find(r => r.id === id)
      if (reserva?.customer_email) {
        await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: reserva.customer_email,
            subject: `Reserva confirmada en ${restaurante.nombre}`,
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
                <h2 style="color: #111;">Tu reserva está confirmada ✓</h2>
                <p style="color: #555;">Hola ${reserva.customer_name},</p>
                <p style="color: #555;">Tu reserva en <strong>${restaurante.nombre}</strong> ha sido confirmada.</p>
                <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; margin: 24px 0;">
                  <p style="margin: 0 0 8px; color: #111;"><strong>Servicio:</strong> ${reserva.servicio}</p>
                  <p style="margin: 0 0 8px; color: #111;"><strong>Fecha:</strong> ${reserva.fecha}</p>
                  <p style="margin: 0; color: #111;"><strong>Hora:</strong> ${reserva.hora}</p>
                </div>
                <p style="color: #555;">¡Te esperamos!</p>
                <p style="color: #999; font-size: 12px;">— ${restaurante.nombre}</p>
              </div>
            `
          })
        })
      }
    }
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
  const fondoSidebar = fondoClaro ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'

  function strFecha(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }

  function reservasDia(fecha: string) {
    return reservas.filter(r => r.fecha === fecha && r.estado !== 'cancelada')
  }

  function getLunesSemana(d: Date) {
    const day = d.getDay()
    const diff = (day === 0 ? -6 : 1 - day)
    const lunes = new Date(d)
    lunes.setDate(d.getDate() + diff)
    return lunes
  }

  const formServicioVehiculo = (onGuardar: () => void, onCancelar: () => void, titulo: string) => (
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

  const formReserva = (onGuardar: () => void, onCancelar: () => void, titulo: string) => {
    const diaSeleccionado = reservaForm.fecha ? new Date(reservaForm.fecha + 'T00:00:00').getDay() : -1
    const diaSemana = diaSeleccionado === 0 ? 6 : diaSeleccionado - 1
    const horasDisponibles = reservaForm.fecha ? generarHorasDisponibles(diaSemana) : []
    return (
      <div className="rounded-xl p-4 mb-4" style={{ border: `1px solid ${editandoReservaId ? primario : borde}` }}>
        <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>{titulo}</p>
        {[
          { label: 'Nombre cliente', key: 'customer_name', type: 'text' },
          { label: 'Email cliente', key: 'customer_email', type: 'email' },
          { label: 'Teléfono', key: 'customer_phone', type: 'tel' },
        ].map(({ label, key, type }) => (
          <div key={key} className="mb-3">
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>{label}</p>
            <input type={type} value={reservaForm[key as keyof typeof reservaForm]} onChange={(e) => setReservaForm({ ...reservaForm, [key]: e.target.value })} className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
          </div>
        ))}
        <div className="mb-3">
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Servicio</p>
          {serviciosNegocio.filter(s => s.activo).length > 0 ? (
            <select value={reservaForm.servicio} onChange={(e) => setReservaForm({ ...reservaForm, servicio: e.target.value })} className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }}>
              <option value="" style={{ background: fondoClaro ? '#fff' : '#000' }}>— Seleccionar —</option>
              {serviciosNegocio.filter(s => s.activo).map(s => (
                <option key={s.id} value={s.nombre} style={{ background: fondoClaro ? '#fff' : '#000' }}>{s.nombre}{s.duracion_minutos ? ` (${s.duracion_minutos} min)` : ''}</option>
              ))}
            </select>
          ) : (
            <input type="text" value={reservaForm.servicio} onChange={(e) => setReservaForm({ ...reservaForm, servicio: e.target.value })} className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
          )}
        </div>
        <div className="mb-3">
          <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Fecha</p>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setMesReserva(new Date(mesReserva.getFullYear(), mesReserva.getMonth()-1, 1))} className="text-xl px-2" style={{ color: textoSec }}>‹</button>
            <p className="text-sm font-medium" style={{ color: texto }}>{MESES[mesReserva.getMonth()]} {mesReserva.getFullYear()}</p>
            <button onClick={() => setMesReserva(new Date(mesReserva.getFullYear(), mesReserva.getMonth()+1, 1))} className="text-xl px-2" style={{ color: textoSec }}>›</button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {DIAS_CORTO.map(d => <div key={d} className="text-center text-xs py-1" style={{ color: textoSec }}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {Array.from({ length: (() => { const p = new Date(mesReserva.getFullYear(), mesReserva.getMonth(), 1).getDay(); return p === 0 ? 6 : p - 1 })() }).map((_, i) => <div key={i} />)}
            {Array.from({ length: new Date(mesReserva.getFullYear(), mesReserva.getMonth()+1, 0).getDate() }).map((_, i) => {
              const dia = i + 1
              const hoy = new Date(); hoy.setHours(0,0,0,0)
              const diaDate = new Date(mesReserva.getFullYear(), mesReserva.getMonth(), dia)
              const pasado = diaDate < hoy
              const dSemana = diaDate.getDay() === 0 ? 6 : diaDate.getDay() - 1
              const cerrado = getHorarioDia(dSemana).length === 0 && horarios.length > 0
              const strDia = `${mesReserva.getFullYear()}-${String(mesReserva.getMonth()+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
              const seleccionado = reservaForm.fecha === strDia
              return (
                <button key={dia} onClick={() => !pasado && !cerrado && setReservaForm({ ...reservaForm, fecha: strDia, hora: '' })} disabled={pasado || cerrado}
                  className="aspect-square rounded-full flex items-center justify-center text-xs transition-colors"
                  style={{ background: seleccionado ? primario : 'transparent', color: pasado || cerrado ? `${texto}20` : seleccionado ? botonTexto : texto, cursor: pasado || cerrado ? 'not-allowed' : 'pointer' }}>
                  {dia}
                </button>
              )
            })}
          </div>
        </div>
        {reservaForm.fecha && horasDisponibles.length > 0 && (
          <div className="mb-3">
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: textoSec }}>Hora</p>
            <div className="grid grid-cols-4 gap-2">
              {horasDisponibles.map(h => (
                <button key={h} onClick={() => setReservaForm({ ...reservaForm, hora: h })}
                  className="py-2 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: reservaForm.hora === h ? primario : 'transparent', color: reservaForm.hora === h ? botonTexto : texto, border: `1px solid ${reservaForm.hora === h ? primario : `${texto}20`}` }}>
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}
        {reservaForm.fecha && horasDisponibles.length === 0 && (
          <p className="text-xs mb-3" style={{ color: textoSec }}>Este día no hay horario configurado</p>
        )}
        <div className="mb-4">
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Notas (opcional)</p>
          <textarea value={reservaForm.notas} onChange={(e) => setReservaForm({ ...reservaForm, notas: e.target.value })} className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm resize-none h-16" style={{ border: `1px solid ${borde}`, color: texto }} />
        </div>
        <div className="flex gap-2">
          <button onClick={onGuardar} disabled={!reservaForm.customer_name || !reservaForm.fecha || !reservaForm.hora} className="flex-1 text-xs font-semibold rounded-lg py-2 disabled:opacity-30" style={{ background: boton, color: botonTexto }}>Guardar</button>
          <button onClick={onCancelar} className="flex-1 text-xs font-semibold rounded-lg py-2" style={{ border: `1px solid ${borde}`, color: textoSec, background: 'transparent' }}>Cancelar</button>
        </div>
      </div>
    )
  }

  function VistaDia() {
    const fechaStr = strFecha(fechaVista)
    const diaSemana = fechaVista.getDay() === 0 ? 6 : fechaVista.getDay() - 1
    const horas = generarHorasDisponibles(diaSemana)
    const resDelDia = reservasDia(fechaStr)
    const cerrado = horas.length === 0
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { const d = new Date(fechaVista); d.setDate(d.getDate()-1); setFechaVista(d) }} className="text-xl px-3 py-1 rounded-lg" style={{ color: textoSec, border: `1px solid ${borde}` }}>‹</button>
          <p className="font-medium" style={{ color: texto }}>{DIAS_SEMANA[diaSemana]}, {fechaVista.getDate()} de {MESES[fechaVista.getMonth()]}</p>
          <button onClick={() => { const d = new Date(fechaVista); d.setDate(d.getDate()+1); setFechaVista(d) }} className="text-xl px-3 py-1 rounded-lg" style={{ color: textoSec, border: `1px solid ${borde}` }}>›</button>
        </div>
        {cerrado ? (
          <div className="rounded-xl p-6 text-center" style={{ border: `1px solid ${borde}` }}>
            <p className="text-sm" style={{ color: textoSec }}>Cerrado este día</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${borde}` }}>
            {horas.map(h => {
              const res = resDelDia.filter(r => r.hora === h)
              return (
                <div key={h} className="flex gap-3 p-3" style={{ borderBottom: `1px solid ${bordeClaro}` }}>
                  <span className="text-xs w-12 pt-0.5 flex-shrink-0" style={{ color: textoSec }}>{h}</span>
                  {res.length > 0 ? (
                    <div className="flex-1">
                      {res.map(r => (
                        <div key={r.id} className="rounded-lg px-3 py-2 mb-1" style={{ background: `${primario}20`, border: `1px solid ${primario}40` }}>
                          <p className="text-xs font-medium" style={{ color: primario }}>{r.customer_name}</p>
                          <p className="text-xs" style={{ color: textoSec }}>{r.servicio}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button onClick={() => { setCreandoReserva(true); setEditandoReservaId(null); setReservaForm({ ...reservaForm, fecha: fechaStr, hora: h }) }} className="flex-1 text-left">
                      <span className="text-xs" style={{ color: `${texto}20` }}>+ Hueco libre</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  function VistaSemana() {
    const lunes = getLunesSemana(fechaVista)
    const dias = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(lunes); d.setDate(lunes.getDate() + i); return d
    })
    const horasUnicas = Array.from(new Set(dias.flatMap(d => {
      const ds = d.getDay() === 0 ? 6 : d.getDay() - 1
      return generarHorasDisponibles(ds)
    }))).sort()
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { const d = new Date(fechaVista); d.setDate(d.getDate()-7); setFechaVista(d) }} className="text-xl px-3 py-1 rounded-lg" style={{ color: textoSec, border: `1px solid ${borde}` }}>‹</button>
          <p className="font-medium text-sm" style={{ color: texto }}>{dias[0].getDate()} {MESES[dias[0].getMonth()].slice(0,3)} – {dias[6].getDate()} {MESES[dias[6].getMonth()].slice(0,3)} {dias[6].getFullYear()}</p>
          <button onClick={() => { const d = new Date(fechaVista); d.setDate(d.getDate()+7); setFechaVista(d) }} className="text-xl px-3 py-1 rounded-lg" style={{ color: textoSec, border: `1px solid ${borde}` }}>›</button>
        </div>
        <div className="overflow-x-auto">
          <div style={{ minWidth: '600px' }}>
            <div className="grid grid-cols-8 mb-1">
              <div />
              {dias.map((d, i) => {
                const hoy = new Date(); hoy.setHours(0,0,0,0)
                const esHoy = d.getTime() === hoy.getTime()
                return (
                  <div key={i} className="text-center pb-2">
                    <p className="text-xs" style={{ color: textoSec }}>{DIAS_CORTO[i]}</p>
                    <p className="text-sm font-medium" style={{ color: esHoy ? primario : texto }}>{d.getDate()}</p>
                  </div>
                )
              })}
            </div>
            {horasUnicas.map(h => (
              <div key={h} className="grid grid-cols-8" style={{ borderTop: `1px solid ${bordeClaro}` }}>
                <span className="text-xs p-2" style={{ color: textoSec }}>{h}</span>
                {dias.map((d, i) => {
                  const fechaStr = strFecha(d)
                  const ds = d.getDay() === 0 ? 6 : d.getDay() - 1
                  const horas = generarHorasDisponibles(ds)
                  const abierto = horas.includes(h)
                  const res = reservasDia(fechaStr).filter(r => r.hora === h)
                  return (
                    <div key={i} className="p-1 min-h-10" style={{ background: abierto ? 'transparent' : `${texto}05`, borderLeft: `1px solid ${bordeClaro}` }}>
                      {res.map(r => (
                        <div key={r.id} className="rounded px-1 py-0.5 mb-0.5 text-xs truncate" style={{ background: `${primario}20`, color: primario }}>{r.customer_name}</div>
                      ))}
                      {abierto && res.length === 0 && (
                        <button onClick={() => { setCreandoReserva(true); setEditandoReservaId(null); setReservaForm({ ...reservaForm, fecha: fechaStr, hora: h }) }} className="w-full h-full" />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  function VistaMes() {
    const year = fechaVista.getFullYear()
    const month = fechaVista.getMonth()
    const primerDia = new Date(year, month, 1).getDay()
    const offset = primerDia === 0 ? 6 : primerDia - 1
    const diasEnMes = new Date(year, month + 1, 0).getDate()
    const hoy = new Date(); hoy.setHours(0,0,0,0)
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setFechaVista(new Date(fechaVista.getFullYear(), fechaVista.getMonth()-1, 1))} className="text-xl px-3 py-1 rounded-lg" style={{ color: textoSec, border: `1px solid ${borde}` }}>‹</button>
          <p className="font-medium" style={{ color: texto }}>{MESES[month]} {year}</p>
          <button onClick={() => setFechaVista(new Date(fechaVista.getFullYear(), fechaVista.getMonth()+1, 1))} className="text-xl px-3 py-1 rounded-lg" style={{ color: textoSec, border: `1px solid ${borde}` }}>›</button>
        </div>
        <div className="grid grid-cols-7 mb-2">
          {DIAS_CORTO.map(d => <div key={d} className="text-center text-xs py-1" style={{ color: textoSec }}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offset }).map((_, i) => <div key={i} />)}
          {Array.from({ length: diasEnMes }).map((_, i) => {
            const dia = i + 1
            const diaDate = new Date(year, month, dia)
            const pasado = diaDate < hoy
            const fechaStr = strFecha(diaDate)
            const numRes = reservasDia(fechaStr).length
            const ds = diaDate.getDay() === 0 ? 6 : diaDate.getDay() - 1
            const cerrado = getHorarioDia(ds).length === 0 && horarios.length > 0
            const esHoy = fechaStr === strFecha(hoy)
            return (
              <button key={dia} onClick={() => { setFechaVista(diaDate); setVistaReservas('dia') }}
                className="aspect-square rounded-xl flex flex-col items-center justify-center text-xs p-1"
                style={{ background: esHoy ? `${primario}20` : cerrado ? `${texto}05` : 'transparent', border: esHoy ? `1px solid ${primario}` : `1px solid ${bordeClaro}`, color: pasado ? `${texto}30` : cerrado ? `${texto}30` : texto }}>
                <span className="font-medium">{dia}</span>
                {numRes > 0 && <span className="font-bold" style={{ color: primario }}>{numRes}</span>}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  function VistaAño() {
    const year = fechaVista.getFullYear()
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setFechaVista(new Date(year-1, 0, 1))} className="text-xl px-3 py-1 rounded-lg" style={{ color: textoSec, border: `1px solid ${borde}` }}>‹</button>
          <p className="font-medium" style={{ color: texto }}>{year}</p>
          <button onClick={() => setFechaVista(new Date(year+1, 0, 1))} className="text-xl px-3 py-1 rounded-lg" style={{ color: textoSec, border: `1px solid ${borde}` }}>›</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, monthIdx) => {
            const numRes = reservas.filter(r => {
              const [y, m] = r.fecha.split('-').map(Number)
              return y === year && m === monthIdx + 1 && r.estado !== 'cancelada'
            }).length
            return (
              <button key={monthIdx} onClick={() => { setFechaVista(new Date(year, monthIdx, 1)); setVistaReservas('mes') }}
                className="rounded-xl p-4 text-left"
                style={{ border: `1px solid ${borde}`, background: numRes > 0 ? `${primario}10` : 'transparent' }}>
                <p className="text-sm font-medium mb-1" style={{ color: texto }}>{MESES[monthIdx]}</p>
                {numRes > 0 ? <p className="text-xs font-bold" style={{ color: primario }}>{numRes} reservas</p> : <p className="text-xs" style={{ color: textoSec }}>Sin reservas</p>}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const tabs = [
    { key: 'inicio', label: 'Inicio', icon: '⌂' },
    { key: 'clientes', label: 'Clientes', icon: '👤' },
    { key: 'reservas', label: 'Reservas', icon: '📅' },
    { key: 'ajustes', label: 'Ajustes', icon: '⚙' },
  ]

  const contenido = (
    <div className="flex-1 p-6 pb-24 md:pb-6 overflow-y-auto">
      {vista === 'inicio' && (
        <>
          <h2 className="text-2xl font-bold mb-6" style={{ color: texto }}>Inicio</h2>
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
          <div className="rounded-xl p-5" style={{ border: `1px solid ${borde}` }}>
            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Próximas reservas</p>
            {reservas.filter(r => r.estado !== 'cancelada').slice(0, 5).length === 0 ? (
              <p className="text-sm" style={{ color: textoSec }}>No hay reservas próximas</p>
            ) : (
              reservas.filter(r => r.estado !== 'cancelada').slice(0, 5).map(r => (
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

      {vista === 'clientes' && !clienteSeleccionado && !vehiculoSeleccionado && (
        <>
          <h2 className="text-2xl font-bold mb-6" style={{ color: texto }}>Clientes</h2>
          <div className="flex justify-between items-center mb-4">
            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por email o nombre..." className="flex-1 bg-transparent rounded-xl px-4 py-3 mr-3 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
            <button onClick={() => setCreandoCliente(true)} className="text-xs font-semibold px-4 py-3 rounded-xl whitespace-nowrap" style={{ background: boton, color: botonTexto }}>+ Añadir</button>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {clientes.filter(c => !busqueda || c.customers?.email?.toLowerCase().includes(busqueda.toLowerCase()) || c.customers?.nombre?.toLowerCase().includes(busqueda.toLowerCase())).map(c => (
              <div key={c.id} className="rounded-xl p-4" style={{ border: `1px solid ${borde}` }}>
                <button onClick={() => verFichaCliente(c)} className="w-full text-left mb-3">
                  <p className="font-medium" style={{ color: texto }}>{c.customers?.nombre ? `${c.customers.nombre} ${c.customers.apellidos || ''}` : c.customers?.email || 'Sin email'}</p>
                  {c.customers?.nombre && <p className="text-xs mt-0.5" style={{ color: textoSec }}>{c.customers?.email}</p>}
                  <p className="text-sm mt-1" style={{ color: textoSec }}>{c.sellos_actuales} de {restaurante.sellos_necesarios} sellos · {c.total_canjes} canjes</p>
                </button>
                <div className="flex gap-2">
                  <button onClick={() => verFichaCliente(c)} className="flex-1 text-xs font-semibold rounded-lg py-2" style={{ border: `1px solid ${borde}`, color: textoSec, background: 'transparent' }}>Ver ficha</button>
                  <button onClick={() => eliminarCliente(c)} className="text-xs px-3 py-2 rounded-lg" style={{ color: textoSec, border: `1px solid ${borde}`, background: 'transparent' }}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {vista === 'clientes' && vehiculoSeleccionado && (
        <div className="max-w-lg">
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
          {editandoServicioId && formServicioVehiculo(editarServicio, () => { setEditandoServicioId(null); resetServicioForm() }, 'Editar servicio')}
          {creandoServicio && !editandoServicioId && formServicioVehiculo(crearServicio, () => { setCreandoServicio(false); resetServicioForm() }, 'Nuevo servicio')}
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
      )}

      {vista === 'clientes' && clienteSeleccionado && !vehiculoSeleccionado && (
        <div className="max-w-lg">
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
              <button onClick={() => setEditandoFicha(!editandoFicha)} className="text-xs font-semibold px-3 py-1 rounded-lg" style={{ background: boton, color: botonTexto }}>{editandoFicha ? 'Cancelar' : 'Editar'}</button>
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
                <button onClick={guardarFicha} disabled={guardandoFicha} className="w-full font-semibold rounded-xl py-3 mt-2 disabled:opacity-30 text-sm" style={{ background: boton, color: botonTexto }}>{guardandoFicha ? 'Guardando...' : 'Guardar cambios'}</button>
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
      )}

      {vista === 'reservas' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: texto }}>Reservas</h2>
            <button onClick={() => { setCreandoReserva(true); setEditandoReservaId(null); resetReservaForm() }} className="text-xs font-semibold px-4 py-2 rounded-xl" style={{ background: boton, color: botonTexto }}>+ Añadir</button>
          </div>
          {(creandoReserva || editandoReservaId) && (
            <div className="mb-6 max-w-md">
              {editandoReservaId ? formReserva(editarReserva, () => { setEditandoReservaId(null); resetReservaForm() }, 'Editar reserva') : formReserva(crearReserva, () => { setCreandoReserva(false); resetReservaForm() }, 'Nueva reserva')}
            </div>
          )}
          <div className="flex gap-2 mb-6">
            {(['dia','semana','mes','año'] as const).map(v => (
              <button key={v} onClick={() => setVistaReservas(v)} className="px-4 py-2 rounded-xl text-xs tracking-widest uppercase" style={{ background: vistaReservas === v ? primario : 'transparent', color: vistaReservas === v ? botonTexto : textoSec, border: vistaReservas === v ? 'none' : `1px solid ${borde}` }}>
                {v}
              </button>
            ))}
          </div>
          {vistaReservas === 'dia' && <VistaDia />}
          {vistaReservas === 'semana' && <VistaSemana />}
          {vistaReservas === 'mes' && <VistaMes />}
          {vistaReservas === 'año' && <VistaAño />}
        </>
      )}

      {vista === 'ajustes' && (
        <>
          <h2 className="text-2xl font-bold mb-6" style={{ color: texto }}>Ajustes</h2>
          <div className="max-w-lg">
            <div className="mb-6">
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>PIN para dar sello</p>
              <input type="number" value={nuevoPin} onChange={(e) => setNuevoPin(e.target.value)} className="w-full bg-transparent rounded-xl px-4 py-4 focus:outline-none" style={{ border: `1px solid ${borde}`, color: texto }} />
            </div>
            <div className="mb-8">
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Premio al completar</p>
              <input type="text" value={nuevaRecompensa} onChange={(e) => setNuevaRecompensa(e.target.value)} className="w-full bg-transparent rounded-xl px-4 py-4 focus:outline-none" style={{ border: `1px solid ${borde}`, color: texto }} />
            </div>
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs tracking-widest uppercase" style={{ color: textoSec }}>Servicios</p>
                <button onClick={() => { setCreandoServicioNegocio(true); setEditandoServicioNegocioId(null); setServicioNegocioForm({ nombre: '', duracion_minutos: '' }) }} className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: boton, color: botonTexto }}>+ Añadir</button>
              </div>
              {(creandoServicioNegocio || editandoServicioNegocioId) && (
                <div className="rounded-xl p-4 mb-4" style={{ border: `1px solid ${editandoServicioNegocioId ? primario : borde}` }}>
                  <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>{editandoServicioNegocioId ? 'Editar servicio' : 'Nuevo servicio'}</p>
                  <div className="mb-3">
                    <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Nombre</p>
                    <input type="text" value={servicioNegocioForm.nombre} onChange={(e) => setServicioNegocioForm({ ...servicioNegocioForm, nombre: e.target.value })} placeholder="Ej: Cambio de aceite" className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
                  </div>
                  <div className="mb-4">
                    <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Duración (minutos)</p>
                    <input type="number" value={servicioNegocioForm.duracion_minutos} onChange={(e) => setServicioNegocioForm({ ...servicioNegocioForm, duracion_minutos: e.target.value })} placeholder="Ej: 45" className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={editandoServicioNegocioId ? editarServicioNegocio : crearServicioNegocio} disabled={!servicioNegocioForm.nombre} className="flex-1 text-xs font-semibold rounded-lg py-2 disabled:opacity-30" style={{ background: boton, color: botonTexto }}>Guardar</button>
                    <button onClick={() => { setCreandoServicioNegocio(false); setEditandoServicioNegocioId(null); setServicioNegocioForm({ nombre: '', duracion_minutos: '' }) }} className="flex-1 text-xs font-semibold rounded-lg py-2" style={{ border: `1px solid ${borde}`, color: textoSec, background: 'transparent' }}>Cancelar</button>
                  </div>
                </div>
              )}
              {serviciosNegocio.length === 0 ? (
                <p className="text-sm mb-4" style={{ color: textoSec }}>Sin servicios todavía.</p>
              ) : (
                serviciosNegocio.map(s => (
                  <div key={s.id} className="rounded-xl p-4 mb-3" style={{ border: `1px solid ${editandoServicioNegocioId === s.id ? primario : borde}`, opacity: s.activo ? 1 : 0.5 }}>
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium text-sm" style={{ color: texto }}>{s.nombre}</p>
                        {s.duracion_minutos && <p className="text-xs mt-0.5" style={{ color: textoSec }}>{s.duracion_minutos} min</p>}
                      </div>
                      <div className="flex gap-2 items-center">
                        <button onClick={() => toggleActivoServicioNegocio(s)} className="text-xs px-2 py-1 rounded-lg" style={{ color: s.activo ? primario : textoSec, border: `1px solid ${s.activo ? primario : borde}` }}>{s.activo ? 'Activo' : 'Inactivo'}</button>
                        <button onClick={() => { setEditandoServicioNegocioId(s.id); setCreandoServicioNegocio(false); setServicioNegocioForm({ nombre: s.nombre, duracion_minutos: s.duracion_minutos?.toString() || '' }) }} className="text-xs px-2 py-1 rounded-lg" style={{ color: primario, border: `1px solid ${primario}` }}>Editar</button>
                        <button onClick={() => eliminarServicioNegocio(s.id)} className="text-xs px-2 py-1 rounded-lg" style={{ color: '#ef4444', border: '1px solid #fca5a5' }}>✕</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mb-8">
              <p className="text-xs tracking-widest uppercase mb-4" style={{ color: textoSec }}>Horarios</p>
              {DIAS_SEMANA.map((dia, i) => {
                const hDia = horarios.filter(h => h.dia_semana === i)
                const abierto = hDia.some(h => h.activo)
                const h1 = hDia.find(h => h.franja === 0)
                const h2 = hDia.find(h => h.franja === 1)
                return (
                  <div key={i} className="rounded-xl p-4 mb-3" style={{ border: `1px solid ${borde}`, opacity: abierto ? 1 : 0.6 }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-sm" style={{ color: texto }}>{dia}</p>
                      <button onClick={() => toggleDia(i)} className="text-xs px-3 py-1 rounded-lg" style={{ background: abierto ? primario : 'transparent', color: abierto ? botonTexto : textoSec, border: abierto ? 'none' : `1px solid ${borde}` }}>
                        {abierto ? 'Abierto' : 'Cerrado'}
                      </button>
                    </div>
                    {abierto && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-16" style={{ color: textoSec }}>Mañana</span>
                          <input type="time" defaultValue={h1?.hora_inicio?.slice(0,5) || '09:00'} onBlur={(e) => guardarHorario(i, 0, 'hora_inicio', e.target.value)} className="bg-transparent rounded-lg px-2 py-1 text-xs focus:outline-none" style={{ border: `1px solid ${borde}`, color: texto }} />
                          <span className="text-xs" style={{ color: textoSec }}>–</span>
                          <input type="time" defaultValue={h1?.hora_fin?.slice(0,5) || '14:00'} onBlur={(e) => guardarHorario(i, 0, 'hora_fin', e.target.value)} className="bg-transparent rounded-lg px-2 py-1 text-xs focus:outline-none" style={{ border: `1px solid ${borde}`, color: texto }} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-16" style={{ color: textoSec }}>Tarde</span>
                          <input type="time" defaultValue={h2?.hora_inicio?.slice(0,5) || '16:00'} onBlur={(e) => guardarHorario(i, 1, 'hora_inicio', e.target.value)} className="bg-transparent rounded-lg px-2 py-1 text-xs focus:outline-none" style={{ border: `1px solid ${borde}`, color: texto }} />
                          <span className="text-xs" style={{ color: textoSec }}>–</span>
                          <input type="time" defaultValue={h2?.hora_fin?.slice(0,5) || '20:00'} onBlur={(e) => guardarHorario(i, 1, 'hora_fin', e.target.value)} className="bg-transparent rounded-lg px-2 py-1 text-xs focus:outline-none" style={{ border: `1px solid ${borde}`, color: texto }} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <button onClick={guardarCambios} disabled={guardando} className="w-full font-semibold rounded-xl py-4 disabled:opacity-30 mb-4" style={{ background: boton, color: botonTexto }}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {mensaje && <p className="text-sm text-center mb-4" style={{ color: primario }}>{mensaje}</p>}
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/dashboard/login'))} className="w-full mt-2 text-xs tracking-widest uppercase" style={{ color: textoSec }}>
              Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="min-h-screen flex" style={{ background: fondo }}>
      <aside className="hidden md:flex flex-col w-56 min-h-screen p-6 flex-shrink-0" style={{ background: fondoSidebar, borderRight: `1px solid ${borde}` }}>
        <div className="mb-8">
          {restaurante.logo_url && <img src={restaurante.logo_url} alt={restaurante.nombre} className="h-10 object-contain mb-4" />}
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Dashboard</p>
          <p className="font-bold text-sm leading-tight" style={{ color: texto }}>{restaurante.nombre}</p>
        </div>
        <nav className="flex-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setVista(t.key as any); setClienteSeleccionado(null); setVehiculoSeleccionado(null) }}
              className="w-full text-left px-3 py-3 rounded-xl mb-1 flex items-center gap-3 text-sm transition-colors"
              style={{ background: vista === t.key ? primario : 'transparent', color: vista === t.key ? botonTexto : textoSec }}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/dashboard/login'))} className="text-xs tracking-widest uppercase text-left px-3 py-2" style={{ color: textoSec }}>
          Cerrar sesión
        </button>
      </aside>
      {contenido}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex" style={{ background: fondo, borderTop: `1px solid ${borde}` }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setVista(t.key as any); setClienteSeleccionado(null); setVehiculoSeleccionado(null) }}
            className="flex-1 py-3 flex flex-col items-center gap-1"
            style={{ color: vista === t.key ? primario : textoSec }}>
            <span className="text-lg">{t.icon}</span>
            <span className="text-xs">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}