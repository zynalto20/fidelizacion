'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import EmailConfigCard from '../../components/EmailConfigCard'
import CampaignCard from '../../components/CampaignCard'
import FacturasTab from '../../components/FacturasTab'
import OrdenesTab from '../../components/OrdenesTab'
import PresupuestosTab from '../../components/PresupuestosTab'
import EstadisticasTab from '../../components/EstadisticasTab'
import StockTab from '../../components/StockTab'
import BuscadorGlobal from '../../components/BuscadorGlobal'
import SoporteChat from '../../components/SoporteChat'
import SeoTab from '../../components/SeoTab'
import LandingCreator from '../../components/LandingCreator'
import SocialTab from '../../components/SocialTab'
import CompetidoresTab from '../../components/CompetidoresTab'

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
  const [nif, setNif] = useState('')
  const [direccionFiscal, setDireccionFiscal] = useState('')
  const [cpFiscal, setCpFiscal] = useState('')
  const [ciudadFiscal, setCiudadFiscal] = useState('')
  const [provincia, setProvincia] = useState('')
  const [serieFact, setSerieFact] = useState('A')
  const [recordatoriosActivos, setRecordatoriosActivos] = useState(false)
  const [recordatorioItvDias, setRecordatorioItvDias] = useState('30')
  const [recordatorioMantKm, setRecordatorioMantKm] = useState('500')
  const [notifEstadoActivo, setNotifEstadoActivo] = useState(true)
  const [notifWhatsappActivo, setNotifWhatsappActivo] = useState(false)
  const [notifValoracionActivo, setNotifValoracionActivo] = useState(false)
  const [googleMapsUrl, setGoogleMapsUrl] = useState('')
  const [telefonoNegocio, setTelefonoNegocio] = useState('')
  const [direccionNegocio, setDireccionNegocio] = useState('')
  const [webNegocio, setWebNegocio] = useState('')
  const [resendFromEmail, setResendFromEmail] = useState('')
  const [resendFromName, setResendFromName] = useState('')
  const [catalogo, setCatalogo] = useState<any[]>([])
  const [catalogoForm, setCatalogoForm] = useState({ nombre: '', descripcion: '', precio: '', tipo_iva: '21', categoria: '' })
  const [creandoCatalogo, setCreandoCatalogo] = useState(false)
  const [vista, setVista] = useState<'inicio' | 'clientes' | 'reservas' | 'marketing' | 'ordenes' | 'presupuestos' | 'estadisticas' | 'stock' | 'facturas' | 'ajustes'>('inicio')
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
  const [servicioNegocioForm, setServicioNegocioForm] = useState({ nombre: '', duracion_minutos: '', capacidad: '1' })
  const [horarios, setHorarios] = useState<any[]>([])
  const [vistaReservas, setVistaReservas] = useState<'dia' | 'semana' | 'mes' | 'año'>('semana')
  const [fechaVista, setFechaVista] = useState(new Date())
  const [emailConfigs, setEmailConfigs] = useState<any[]>([])
  const [editandoEmailTipo, setEditandoEmailTipo] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [ordenesResumen, setOrdenesResumen] = useState<{ bloqueadas: number; activas: number }>({ bloqueadas: 0, activas: 0 })
  const [stockBajo, setStockBajo] = useState<any[]>([])
  const [citasPendientes, setCitasPendientes] = useState<any[]>([])
  const [sellosMes, setSellosMes] = useState(0)
  const [canjesMes, setCanjesMes] = useState(0)
  const [darSelloCliente, setDarSelloCliente] = useState<string | null>(null)
  const [segmentoActivo, setSegmentoActivo] = useState<string | null>(null)
  const [seccionMarketing, setSeccionMarketing] = useState<'fidelizacion' | 'resenas' | 'campanas' | 'seo' | 'landing' | 'social' | 'competidores'>('fidelizacion')
  const [waMensaje, setWaMensaje] = useState('Hola [nombre], te escribimos desde [NEGOCIO]. ¡Recuerda que tienes sellos pendientes en tu tarjeta de fidelización! Visítanos pronto 🚗')
  const [waFiltros, setWaFiltros] = useState<any>({ actividad: '', diasInactividad: 30, sellos: '', minSellos: 5 })
  const [enviandoWa, setEnviandoWa] = useState(false)
  const [resultadoWa, setResultadoWa] = useState<any>(null)
  const [busquedaResena, setBusquedaResena] = useState('')
  const [enviandoResena, setEnviandoResena] = useState(false)

  useEffect(() => {
    async function cargarDatos() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push('/dashboard/login'); return }
        const { data: rest } = await supabase.from('restaurants').select('*').eq('slug', slug).eq('owner_id', session.user.id).single()
        if (!rest) { router.push('/dashboard/login'); return }
        setRestaurante(rest)
        setNuevoPin(rest.pin)
        setNuevaRecompensa(rest.recompensa)
        setNif(rest.nif || '')
        setDireccionFiscal(rest.direccion_fiscal || '')
        setCpFiscal(rest.codigo_postal_fiscal || '')
        setCiudadFiscal(rest.ciudad_fiscal || '')
        setProvincia(rest.provincia || '')
        setSerieFact(rest.serie_factura || 'A')
        setRecordatoriosActivos(rest.recordatorios_activos || false)
        setRecordatorioItvDias(String(rest.recordatorio_itv_dias || 30))
        setRecordatorioMantKm(String(rest.recordatorio_mant_km || 500))
        setNotifEstadoActivo(rest.notif_estado_activo !== false)
        setNotifWhatsappActivo(rest.notif_whatsapp_activo || false)
        setNotifValoracionActivo(rest.notif_valoracion_activo || false)
        setGoogleMapsUrl(rest.google_maps_url || '')
        setTelefonoNegocio(rest.telefono || '')
        setDireccionNegocio(rest.direccion || '')
        setWebNegocio(rest.web || '')
        setResendFromEmail(rest.resend_from_email || '')
        setResendFromName(rest.resend_from_name || '')

        // Carga en paralelo para mayor velocidad
        const [
          { count: totalClientes },
          { data: clientesData },
          { data: res },
          { data: serviciosData },
          { data: svcsNegocio },
          { data: horariosData },
          { data: emailConfigData },
          { data: campaignsData },
          { data: ordenesData },
          { data: stockData },
          { data: citasData },
          { data: catalogoData },
        ] = await Promise.all([
          supabase.from('loyalty_cards').select('*', { count: 'exact', head: true }).eq('restaurant_id', rest.id),
          supabase.from('loyalty_cards').select('*, customers(id, email, nombre, apellidos, telefono_nuevo, prefijo_telefono, dni, direccion, ciudad, codigo_postal)').eq('restaurant_id', rest.id).order('actualizado_en', { ascending: false }),
          supabase.from('bookings').select('*').eq('restaurant_id', rest.id).order('fecha', { ascending: true }).order('hora', { ascending: true }),
          supabase.from('vehicle_services').select('tipo_servicio').eq('restaurant_id', rest.id),
          supabase.from('services').select('*').eq('restaurant_id', rest.id).order('nombre'),
          supabase.from('horarios').select('*').eq('restaurant_id', rest.id),
          supabase.from('email_config').select('*').eq('restaurant_id', rest.id),
          supabase.from('campaigns').select('*').eq('restaurant_id', rest.id).order('creado_en', { ascending: false }).limit(10),
          supabase.from('orders').select('id, bloqueada, estado').eq('restaurant_id', rest.id),
          supabase.from('stock').select('id, nombre, cantidad, cantidad_minima').eq('restaurant_id', rest.id),
          supabase.from('bookings').select('*').eq('restaurant_id', rest.id).eq('origen', 'portal').eq('estado', 'pendiente').order('creado_en', { ascending: false }),
          supabase.from('catalogo_servicios').select('*').eq('restaurant_id', rest.id).order('nombre'),
        ])

        // Sellos/canjes del mes — calculados desde clientesData para evitar
        // queries sin filtro de restaurant_id en stamp_events
        const cards = clientesData || []
        setClientes(cards)
        setStats({ clientes: totalClientes || 0, sellos: 0, canjes: 0 })

        // Contamos sellos/canjes del mes desde los card_ids de este restaurante
        if (cards.length > 0) {
          const cardIds = cards.map((c: any) => c.id)
          const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0,0,0,0)
          const [{ count: cntSellos }, { count: cntCanjes }] = await Promise.all([
            supabase.from('stamp_events').select('*', { count: 'exact', head: true }).eq('tipo', 'sello').in('card_id', cardIds).gte('creado_en', inicioMes.toISOString()),
            supabase.from('stamp_events').select('*', { count: 'exact', head: true }).eq('tipo', 'canje').in('card_id', cardIds).gte('creado_en', inicioMes.toISOString()),
          ])
          setSellosMes(cntSellos || 0)
          setCanjesMes(cntCanjes || 0)
        }

        const conteo: any = {}
        serviciosData?.forEach((s: any) => { conteo[s.tipo_servicio] = (conteo[s.tipo_servicio] || 0) + 1 })
        setStatsServicios(conteo)
        setReservas(res || [])
        setServiciosNegocio(svcsNegocio || [])
        setHorarios(horariosData || [])
        setEmailConfigs(emailConfigData || [])
        setCampaigns(campaignsData || [])
        if (ordenesData) {
          setOrdenesResumen({
            bloqueadas: ordenesData.filter((o: any) => o.bloqueada).length,
            activas: ordenesData.filter((o: any) => !['entregado'].includes(o.estado)).length,
          })
        }
        setStockBajo((stockData || []).filter((s: any) => s.cantidad <= s.cantidad_minima))
        setCitasPendientes(citasData || [])
        setCatalogo(catalogoData || [])
      } catch (e) {
        console.error('Error cargando dashboard:', e)
      } finally {
        setCargando(false)
      }
    }
    cargarDatos()

    const channel = supabase.channel('bookings').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, (payload) => {
      setReservas(prev => [...prev, payload.new].sort((a: any, b: any) => a.fecha > b.fecha ? 1 : -1))
    }).subscribe()

    return () => { supabase.removeChannel(channel) }
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
      capacidad: parseInt(servicioNegocioForm.capacidad) || 1,
      activo: true
    }).select().single()
    if (data) {
      setServiciosNegocio([...serviciosNegocio, data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setCreandoServicioNegocio(false)
      setServicioNegocioForm({ nombre: '', duracion_minutos: '', capacidad: '1' })
    }
  }

  async function editarServicioNegocio() {
    const payload = { nombre: servicioNegocioForm.nombre, duracion_minutos: parseInt(servicioNegocioForm.duracion_minutos) || null, capacidad: parseInt(servicioNegocioForm.capacidad) || 1 }
    await supabase.from('services').update(payload).eq('id', editandoServicioNegocioId)
    setServiciosNegocio(serviciosNegocio.map(s => s.id === editandoServicioNegocioId ? { ...s, ...payload } : s))
    setEditandoServicioNegocioId(null)
    setServicioNegocioForm({ nombre: '', duracion_minutos: '', capacidad: '1' })
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

  async function darSello(c: any) {
    if (darSelloCliente) return
    setDarSelloCliente(c.id)
    const sellosNecesarios = restaurante.sellos_necesarios || 10
    const nuevosSellos = (c.sellos_actuales || 0) + 1
    const completa = nuevosSellos >= sellosNecesarios
    const ahora = new Date().toISOString()
    await supabase.from('loyalty_cards').update({
      sellos_actuales: completa ? 0 : nuevosSellos,
      total_canjes: completa ? (c.total_canjes || 0) + 1 : (c.total_canjes || 0),
      actualizado_en: ahora,
    }).eq('id', c.id)
    await supabase.from('stamp_events').insert({ card_id: c.id, tipo: 'sello' })
    if (completa) await supabase.from('stamp_events').insert({ card_id: c.id, tipo: 'canje' })
    const updated = {
      ...c,
      sellos_actuales: completa ? 0 : nuevosSellos,
      total_canjes: completa ? (c.total_canjes || 0) + 1 : (c.total_canjes || 0),
      actualizado_en: ahora,
    }
    setClientes(prev => prev.map(cl => cl.id === c.id ? updated : cl))
    if (clienteSeleccionado?.id === c.id) {
      setClienteSeleccionado(updated)
      const { data: h } = await supabase.from('stamp_events').select('*').eq('card_id', c.id).order('creado_en', { ascending: false })
      setHistorial(h || [])
    }
    if (completa) {
      setMensaje(`🎁 ¡Tarjeta completa! Premio canjeado para ${c.customers?.nombre || c.customers?.email || 'el cliente'}`)
      setTimeout(() => setMensaje(''), 5000)
      setSellosMes(p => p + 1)
      setCanjesMes(p => p + 1)
    } else {
      setSellosMes(p => p + 1)
    }
    setDarSelloCliente(null)
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
    await supabase.from('restaurants').update({
      pin: nuevoPin, recompensa: nuevaRecompensa,
      nif, direccion_fiscal: direccionFiscal, codigo_postal_fiscal: cpFiscal,
      ciudad_fiscal: ciudadFiscal, provincia, serie_factura: serieFact,
      recordatorios_activos: recordatoriosActivos,
      recordatorio_itv_dias: parseInt(recordatorioItvDias) || 30,
      recordatorio_mant_km: parseInt(recordatorioMantKm) || 500,
      notif_estado_activo: notifEstadoActivo,
      notif_whatsapp_activo: notifWhatsappActivo,
      notif_valoracion_activo: notifValoracionActivo,
      google_maps_url: googleMapsUrl || null,
      telefono: telefonoNegocio || null,
      direccion: direccionNegocio || null,
      web: webNegocio || null,
      resend_from_email: resendFromEmail || null,
      resend_from_name: resendFromName || null,
    }).eq('id', restaurante.id)
    setRestaurante((r: any) => ({ ...r, nif, direccion_fiscal: direccionFiscal, codigo_postal_fiscal: cpFiscal, ciudad_fiscal: ciudadFiscal, provincia, serie_factura: serieFact, recordatorios_activos: recordatoriosActivos }))
    setMensaje('✓ Cambios guardados')
    setGuardando(false)
  }
  async function toggleEmailConfig(tipo: string, activo: boolean) {
    const existing = emailConfigs.find((c: any) => c.tipo === tipo)
    if (existing) {
      await supabase.from('email_config').update({ activo }).eq('id', existing.id)
      setEmailConfigs(emailConfigs.map((c: any) => c.tipo === tipo ? { ...c, activo } : c))
    } else {
      const { data } = await supabase.from('email_config').insert({ restaurant_id: restaurante.id, tipo, activo }).select().single()
      if (data) setEmailConfigs([...emailConfigs, data])
    }
  }

  async function guardarEmailConfig(tipo: string, activo: boolean, dias: number) {
    const existing = emailConfigs.find((c: any) => c.tipo === tipo)
    if (existing) {
      await supabase.from('email_config').update({ dias_inactivo: dias }).eq('id', existing.id)
      setEmailConfigs(emailConfigs.map((c: any) => c.tipo === tipo ? { ...c, dias_inactivo: dias } : c))
    }
  }
  async function recargarCampaigns() {
    const { data } = await supabase.from('campaigns').select('*').eq('restaurant_id', restaurante.id).order('creado_en', { ascending: false }).limit(10)
    setCampaigns(data || [])
  }

  async function guardarPlantillaEmail(tipo: string, asunto: string, cuerpo: string) {
    const existing = emailConfigs.find((c: any) => c.tipo === tipo)
    if (existing) {
      await supabase.from('email_config').update({ asunto, cuerpo }).eq('id', existing.id)
      setEmailConfigs(emailConfigs.map((c: any) => c.tipo === tipo ? { ...c, asunto, cuerpo } : c))
    } else {
      const { data } = await supabase.from('email_config').insert({ restaurant_id: restaurante.id, tipo, activo: false, asunto, cuerpo }).select().single()
      if (data) setEmailConfigs([...emailConfigs, data])
    }
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
            html: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;"><h2 style="color: #111;">Tu reserva está confirmada ✓</h2><p style="color: #555;">Hola ${reserva.customer_name},</p><p style="color: #555;">Tu reserva en <strong>${restaurante.nombre}</strong> ha sido confirmada.</p><div style="background: #f5f5f5; border-radius: 12px; padding: 20px; margin: 24px 0;"><p style="margin: 0 0 8px; color: #111;"><strong>Servicio:</strong> ${reserva.servicio}</p><p style="margin: 0 0 8px; color: #111;"><strong>Fecha:</strong> ${reserva.fecha}</p><p style="margin: 0; color: #111;"><strong>Hora:</strong> ${reserva.hora}</p></div><p style="color: #555;">¡Te esperamos!</p><p style="color: #999; font-size: 12px;">— ${restaurante.nombre}</p></div>`
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
              {horasDisponibles.map(h => {
                const servicioActual = serviciosNegocio.find(s => s.nombre === reservaForm.servicio)
                const capacidad = servicioActual?.capacidad || 1
                const reservasEnHora = reservas.filter(r => r.fecha === reservaForm.fecha && r.hora?.slice(0,5) === h && r.estado !== 'cancelada' && r.id !== editandoReservaId).length
                const ocupada = reservasEnHora >= capacidad
                const libres = capacidad - reservasEnHora
                return (
                  <button key={h} onClick={() => !ocupada && setReservaForm({ ...reservaForm, hora: h })} disabled={ocupada}
                    className="py-2 rounded-lg text-xs font-medium transition-colors"
                    style={{ background: reservaForm.hora === h ? primario : ocupada ? `${texto}10` : 'transparent', color: ocupada ? `${texto}30` : reservaForm.hora === h ? botonTexto : texto, border: `1px solid ${reservaForm.hora === h ? primario : ocupada ? `${texto}10` : `${texto}20`}`, cursor: ocupada ? 'not-allowed' : 'pointer' }}>
                    {h}{ocupada ? ' ✗' : capacidad > 1 && libres < capacidad ? ` (${libres})` : ''}
                  </button>
                )
              })}
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
              const res = resDelDia.filter(r => r.hora?.slice(0,5) === h)
              return (
                <div key={h} className="flex gap-3 p-3" style={{ borderBottom: `1px solid ${bordeClaro}` }}>
                  <span className="text-xs w-12 pt-0.5 flex-shrink-0" style={{ color: textoSec }}>{h}</span>
                  {res.length > 0 ? (
                    <div className="flex-1">
                      {res.map(r => (
                        <div key={r.id} className="rounded-lg px-3 py-2 mb-1" style={{ background: `${primario}20`, border: `1px solid ${primario}40` }}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-medium" style={{ color: primario }}>{r.customer_name}</p>
                              <p className="text-xs" style={{ color: textoSec }}>{r.servicio}</p>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <button onClick={() => { setEditandoReservaId(r.id); setCreandoReserva(false); setReservaForm({ customer_name: r.customer_name || '', customer_email: r.customer_email || '', customer_phone: '', servicio: r.servicio || '', fecha: r.fecha || '', hora: r.hora?.slice(0,5) || '', notas: r.notas || '' }) }} className="text-xs px-2 py-0.5 rounded" style={{ color: primario, border: `1px solid ${primario}` }}>Editar</button>
                              <button onClick={() => cambiarEstadoReserva(r.id, 'confirmada')} className="text-xs px-2 py-0.5 rounded" style={{ color: '#22c55e', border: '1px solid #86efac' }}>✓</button>
                              <button onClick={() => eliminarReserva(r.id)} className="text-xs px-2 py-0.5 rounded" style={{ color: '#ef4444', border: '1px solid #fca5a5' }}>✕</button>
                            </div>
                          </div>
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
                  const res = reservasDia(fechaStr).filter(r => r.hora?.slice(0,5) === h)
                  return (
                    <div key={i} className="p-1 min-h-10" style={{ background: abierto ? 'transparent' : `${texto}05`, borderLeft: `1px solid ${bordeClaro}` }}>
                      {res.map(r => (
                        <div key={r.id} className="rounded px-1 py-0.5 mb-0.5 text-xs" style={{ background: `${primario}20`, color: primario }}>
                          <p className="truncate font-medium">{r.customer_name}</p>
                          <div className="flex gap-1 mt-0.5">
                            <button onClick={() => { setEditandoReservaId(r.id); setCreandoReserva(false); setReservaForm({ customer_name: r.customer_name || '', customer_email: r.customer_email || '', customer_phone: '', servicio: r.servicio || '', fecha: r.fecha || '', hora: r.hora?.slice(0,5) || '', notas: r.notas || '' }) }} className="text-xs px-1 rounded" style={{ background: `${primario}30`, color: primario }}>✎</button>
                            <button onClick={() => cambiarEstadoReserva(r.id, 'confirmada')} className="text-xs px-1 rounded" style={{ background: '#dcfce7', color: '#16a34a' }}>✓</button>
                            <button onClick={() => eliminarReserva(r.id)} className="text-xs px-1 rounded" style={{ background: '#fee2e2', color: '#ef4444' }}>✕</button>
                          </div>
                        </div>
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
    { key: 'marketing', label: 'Marketing', icon: '📣' },
    { key: 'ordenes', label: 'Órdenes', icon: '🔧' },
    { key: 'presupuestos', label: 'Presupuestos', icon: '📋' },
    { key: 'estadisticas', label: 'Estadísticas', icon: '📊' },
    { key: 'stock', label: 'Stock', icon: '📦' },
    { key: 'facturas', label: 'Facturas', icon: '🧾' },
    { key: 'ajustes', label: 'Ajustes', icon: '⚙' },
  ]

  const contenido = (
    <div className="flex-1 p-6 pb-24 md:pb-6 overflow-y-auto">
      {vista === 'inicio' && (
        <>
          <h2 className="text-2xl font-bold mb-1" style={{ color: texto }}>Inicio</h2>
          <p className="text-sm mb-6" style={{ color: textoSec }}>
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>

          {/* Panel de alertas */}
          {(citasPendientes.length > 0 || ordenesResumen.bloqueadas > 0 || stockBajo.length > 0) && (
            <div className="mb-5 space-y-2">
              {citasPendientes.length > 0 && (
                <button onClick={() => setVista('reservas')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:opacity-90"
                  style={{ background: '#fef9c3', border: '1px solid #fde047' }}>
                  <span className="text-xl flex-shrink-0">📅</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-yellow-800">{citasPendientes.length} solicitud{citasPendientes.length > 1 ? 'es' : ''} de cita pendiente{citasPendientes.length > 1 ? 's' : ''} del portal</p>
                    <p className="text-xs text-yellow-700 mt-0.5">La{citasPendientes.length > 1 ? 's' : ''} más reciente: {citasPendientes[0]?.customer_name} — {citasPendientes[0]?.servicio || 'Sin servicio especificado'}</p>
                  </div>
                  <span className="text-yellow-600 flex-shrink-0">→</span>
                </button>
              )}
              {ordenesResumen.bloqueadas > 0 && (
                <button onClick={() => setVista('ordenes')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:opacity-90"
                  style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <span className="text-xl flex-shrink-0">🔴</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-red-700">{ordenesResumen.bloqueadas} orden{ordenesResumen.bloqueadas > 1 ? 'es' : ''} bloqueada{ordenesResumen.bloqueadas > 1 ? 's' : ''}</p>
                    <p className="text-xs text-red-600 mt-0.5">Requieren atención antes de continuar</p>
                  </div>
                  <span className="text-red-400 flex-shrink-0">→</span>
                </button>
              )}
              {stockBajo.length > 0 && (
                <button onClick={() => setVista('stock')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:opacity-90"
                  style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                  <span className="text-xl flex-shrink-0">📦</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-orange-700">{stockBajo.length} artículo{stockBajo.length > 1 ? 's' : ''} con stock bajo</p>
                    <p className="text-xs text-orange-600 mt-0.5 truncate">{stockBajo.slice(0, 3).map(s => s.nombre).join(', ')}{stockBajo.length > 3 ? '…' : ''}</p>
                  </div>
                  <span className="text-orange-400 flex-shrink-0">→</span>
                </button>
              )}
            </div>
          )}

          {/* Accesos rápidos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Nueva orden', icon: '🔧', action: () => setVista('ordenes'), color: primario },
              { label: 'Nuevo presupuesto', icon: '📋', action: () => setVista('presupuestos'), color: '#8b5cf6' },
              { label: 'Ver estadísticas', icon: '📊', action: () => setVista('estadisticas'), color: '#3b82f6' },
              { label: 'Nueva cita', icon: '📅', action: () => setVista('reservas'), color: '#10b981' },
            ].map(a => (
              <button key={a.label} onClick={a.action}
                className="rounded-xl p-4 text-left transition-all hover:shadow-sm"
                style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : fondo }}>
                <span className="text-2xl">{a.icon}</span>
                <p className="text-xs font-semibold mt-2" style={{ color: a.color }}>{a.label}</p>
              </button>
            ))}
          </div>

          {/* KPIs rápidos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Órdenes activas', value: ordenesResumen.activas, icon: '🔧', action: () => setVista('ordenes') },
              { label: 'Clientes', value: stats.clientes, icon: '👤', action: () => setVista('clientes') },
              { label: 'Sellos dados', value: stats.sellos, icon: '⭐', action: undefined },
              { label: 'Canjes', value: stats.canjes, icon: '🎁', action: undefined },
            ].map(({ label, value, icon, action }) => (
              <button key={label} onClick={action} disabled={!action}
                className="rounded-xl p-4 text-center transition-all disabled:cursor-default"
                style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : fondo }}>
                <p className="text-xl mb-1">{icon}</p>
                <p className="text-2xl font-bold" style={{ color: texto }}>{value}</p>
                <p className="text-xs tracking-widest uppercase mt-1" style={{ color: textoSec }}>{label}</p>
              </button>
            ))}
          </div>

          {/* Próximas reservas */}
          <div className="rounded-xl p-5 mb-4" style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : fondo }}>
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs tracking-widest uppercase font-semibold" style={{ color: textoSec }}>Próximas citas</p>
              <button onClick={() => setVista('reservas')} className="text-xs" style={{ color: primario }}>Ver todas →</button>
            </div>
            {reservas.filter(r => r.estado !== 'cancelada').slice(0, 4).length === 0 ? (
              <p className="text-sm" style={{ color: textoSec }}>No hay citas próximas</p>
            ) : (
              reservas.filter(r => r.estado !== 'cancelada').slice(0, 4).map(r => (
                <div key={r.id} className="flex justify-between py-2.5" style={{ borderBottom: `1px solid ${bordeClaro}` }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: texto }}>{r.customer_name}</p>
                    <p className="text-xs" style={{ color: textoSec }}>{r.servicio}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold" style={{ color: primario }}>{r.hora?.slice(0, 5)}</p>
                    <p className="text-xs" style={{ color: textoSec }}>{new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Servicios más frecuentes */}
          {Object.keys(statsServicios).length > 0 && (
            <div className="rounded-xl p-5" style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : fondo }}>
              <p className="text-xs tracking-widest uppercase mb-3 font-semibold" style={{ color: textoSec }}>Servicios más frecuentes</p>
              {Object.entries(statsServicios).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5).map(([tipo, count]: any) => (
                <div key={tipo} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${bordeClaro}` }}>
                  <p className="text-sm" style={{ color: texto }}>{tipo}</p>
                  <p className="text-sm font-bold" style={{ color: primario }}>{count}</p>
                </div>
              ))}
            </div>
          )}
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
          {/* Tarjeta visual de sellos */}
          {(() => {
            const sellosNecesarios = restaurante.sellos_necesarios || 10
            const sellosActuales = clienteSeleccionado.sellos_actuales || 0
            const completa = sellosActuales >= sellosNecesarios
            return (
              <div className="rounded-xl p-5 mb-5" style={{ border: `1px solid ${completa ? '#fde047' : borde}`, background: completa ? (fondoClaro ? '#fefce8' : 'rgba(234,179,8,0.05)') : (fondoClaro ? '#fff' : fondo) }}>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs tracking-widest uppercase font-semibold" style={{ color: textoSec }}>Tarjeta de fidelización</p>
                  <p className="text-sm font-bold" style={{ color: completa ? '#ca8a04' : primario }}>{sellosActuales}/{sellosNecesarios}</p>
                </div>
                {/* Sellos visuales */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {Array.from({ length: sellosNecesarios }).map((_, i) => (
                    <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all"
                      style={{
                        background: i < sellosActuales ? primario : 'transparent',
                        border: `2px solid ${i < sellosActuales ? primario : borde}`,
                        color: i < sellosActuales ? botonTexto : textoSec,
                      }}>
                      {i < sellosActuales ? '★' : ''}
                    </div>
                  ))}
                </div>
                {/* Barra de progreso */}
                <div className="w-full h-1.5 rounded-full mb-4" style={{ background: borde }}>
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (sellosActuales / sellosNecesarios) * 100)}%`, background: primario }} />
                </div>
                {completa ? (
                  <div className="rounded-xl p-4 text-center mb-3" style={{ background: '#fef9c3', border: '1px solid #fde047' }}>
                    <p className="text-base font-bold text-yellow-800">🎁 ¡Tarjeta completa!</p>
                    <p className="text-sm text-yellow-700 mt-0.5">{restaurante.recompensa}</p>
                  </div>
                ) : null}
                <button onClick={() => darSello(clienteSeleccionado)} disabled={darSelloCliente === clienteSeleccionado.id}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: boton, color: botonTexto }}>
                  {darSelloCliente === clienteSeleccionado.id
                    ? <><span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: botonTexto, borderTopColor: 'transparent' }} /> Dando sello...</>
                    : '⭐ Dar sello'}
                </button>
              </div>
            )
          })()}
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[{ label: 'Sellos', value: clienteSeleccionado.sellos_actuales }, { label: 'Canjes', value: clienteSeleccionado.total_canjes }, { label: 'Visitas', value: historial.filter(h => h.tipo === 'sello').length }].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-4 text-center" style={{ border: `1px solid ${borde}` }}>
                <p className="text-2xl font-bold" style={{ color: texto }}>{value}</p>
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
            <h2 className="text-2xl font-bold" style={{ color: texto }}>
              Reservas
              {citasPendientes.length > 0 && (
                <span className="ml-2 text-sm px-2 py-0.5 rounded-full font-semibold" style={{ background: '#fde047', color: '#713f12' }}>{citasPendientes.length}</span>
              )}
            </h2>
            <button onClick={() => { setCreandoReserva(true); setEditandoReservaId(null); resetReservaForm() }} className="text-xs font-semibold px-4 py-2 rounded-xl" style={{ background: boton, color: botonTexto }}>+ Añadir</button>
          </div>

          {/* Solicitudes del portal */}
          {citasPendientes.length > 0 && (
            <div className="mb-6 rounded-xl overflow-hidden" style={{ border: '1px solid #fde047' }}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ background: '#fef9c3' }}>
                <span>📅</span>
                <p className="text-sm font-semibold text-yellow-800">Solicitudes del portal ({citasPendientes.length})</p>
              </div>
              {citasPendientes.map(c => (
                <div key={c.id} className="px-4 py-3 flex items-start gap-3" style={{ borderTop: '1px solid #fde047', background: fondoClaro ? '#fff' : fondo }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: texto }}>{c.customer_name}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {c.customer_phone && <a href={`tel:${c.customer_phone}`} className="text-xs" style={{ color: primario }}>📞 {c.customer_phone}</a>}
                      {c.servicio && <span className="text-xs" style={{ color: textoSec }}>· {c.servicio}</span>}
                      {c.fecha && <span className="text-xs" style={{ color: textoSec }}>· {new Date(c.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}{c.hora ? ` ${c.hora.slice(0,5)}` : ''}</span>}
                    </div>
                    {c.notas && <p className="text-xs mt-1 italic" style={{ color: textoSec }}>{c.notas}</p>}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={async () => {
                        await fetch(`/api/bookings/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: 'confirmada' }) })
                        setCitasPendientes(prev => prev.filter(x => x.id !== c.id))
                        setReservas(prev => prev.map(r => r.id === c.id ? { ...r, estado: 'confirmada' } : r))
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-lg font-medium"
                      style={{ background: '#dcfce7', color: '#16a34a' }}>
                      ✓ Confirmar
                    </button>
                    <button
                      onClick={async () => {
                        await fetch(`/api/bookings/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: 'cancelada' }) })
                        setCitasPendientes(prev => prev.filter(x => x.id !== c.id))
                        setReservas(prev => prev.map(r => r.id === c.id ? { ...r, estado: 'cancelada' } : r))
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-lg"
                      style={{ background: '#fee2e2', color: '#dc2626' }}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
        {vista === 'marketing' && (() => {
          const sellosNecesarios = restaurante.sellos_necesarios || 10
          const ahora = Date.now()
          const casiCompletan = clientes.filter(c => c.sellos_actuales >= sellosNecesarios - 2 && c.sellos_actuales > 0)
          const inactivos = clientes.filter(c => c.actualizado_en && (ahora - new Date(c.actualizado_en).getTime()) > 60 * 24 * 60 * 60 * 1000)
          const nuevos = clientes.filter(c => c.creado_en && (ahora - new Date(c.creado_en).getTime()) < 30 * 24 * 60 * 60 * 1000)
          const topClientes = [...clientes].sort((a, b) => (b.total_canjes || 0) - (a.total_canjes || 0)).slice(0, 5)
          const activos = clientes.filter(c => c.actualizado_en && (ahora - new Date(c.actualizado_en).getTime()) < 90 * 24 * 60 * 60 * 1000)
          const segmentos: Record<string, any[]> = { casi_completan: casiCompletan, inactivos, nuevos, top: topClientes }
          const segInfo = [
            { key: 'casi_completan', label: 'Casi completan', icon: '🏁', color: '#f59e0b', desc: `A 1-2 sellos del premio` },
            { key: 'inactivos', label: 'Inactivos +60 días', icon: '😴', color: '#ef4444', desc: 'Sin visita en más de 2 meses' },
            { key: 'nuevos', label: 'Nuevos este mes', icon: '🆕', color: '#10b981', desc: 'Últimos 30 días' },
            { key: 'top', label: 'Más fieles', icon: '⭐', color: '#8b5cf6', desc: 'Por canjes acumulados' },
          ]
          const clientesConTelefono = clientes.filter(c => c.customers?.telefono_nuevo)
          return (
          <>
            <h2 className="text-2xl font-bold mb-1" style={{ color: texto }}>Marketing</h2>
            <p className="text-sm mb-4" style={{ color: textoSec }}>Fidelización, reseñas y campañas</p>

            {/* Sub-navegación interna */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
              {[
                { key: 'fidelizacion', label: '⭐ Fidelización' },
                { key: 'resenas', label: '⭐ Reseñas' },
                { key: 'campanas', label: '📣 Campañas' },
                { key: 'seo', label: '🔍 SEO & GEO' },
                { key: 'landing', label: '🌐 Landing Page' },
                { key: 'social', label: '📸 Redes Sociales' },
                { key: 'competidores', label: '🔎 Competidores' },
              ].map(s => (
                <button key={s.key} onClick={() => setSeccionMarketing(s.key as any)}
                  className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0"
                  style={{
                    background: seccionMarketing === s.key ? primario : (fondoClaro ? '#fff' : fondo),
                    color: seccionMarketing === s.key ? botonTexto : textoSec,
                    border: `1px solid ${seccionMarketing === s.key ? primario : borde}`,
                  }}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* ══ FIDELIZACIÓN ══ */}
            {seccionMarketing === 'fidelizacion' && <div>

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { label: 'Total clientes', value: stats.clientes, icon: '👥' },
                { label: 'Sellos este mes', value: sellosMes, icon: '⭐' },
                { label: 'Canjes este mes', value: canjesMes, icon: '🎁' },
                { label: 'Activos 90 días', value: activos.length, icon: '🔥' },
              ].map(({ label, value, icon }) => (
                <div key={label} className="rounded-xl p-4 text-center" style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : fondo }}>
                  <p className="text-xl mb-1">{icon}</p>
                  <p className="text-2xl font-bold" style={{ color: texto }}>{value}</p>
                  <p className="text-xs tracking-widest uppercase mt-1" style={{ color: textoSec }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Segmentos */}
            <p className="text-xs tracking-widest uppercase mb-3 font-semibold" style={{ color: textoSec }}>Segmentos</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {segInfo.map(seg => {
                const count = segmentos[seg.key]?.length || 0
                const activo = segmentoActivo === seg.key
                return (
                  <button key={seg.key}
                    onClick={() => setSegmentoActivo(activo ? null : seg.key)}
                    className="rounded-xl p-4 text-left transition-all"
                    style={{ border: `1px solid ${activo ? seg.color : borde}`, background: activo ? seg.color + '12' : (fondoClaro ? '#fff' : fondo) }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">{seg.icon}</span>
                      <span className="text-xl font-bold" style={{ color: count > 0 ? seg.color : textoSec }}>{count}</span>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: texto }}>{seg.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: textoSec }}>{seg.desc}</p>
                  </button>
                )
              })}
            </div>

            {/* Lista del segmento activo */}
            {segmentoActivo && segmentos[segmentoActivo]?.length > 0 && (
              <div className="rounded-xl mb-6 overflow-hidden" style={{ border: `1px solid ${borde}` }}>
                <p className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: textoSec, borderBottom: `1px solid ${borde}` }}>
                  {segInfo.find(s => s.key === segmentoActivo)?.label}
                </p>
                {segmentos[segmentoActivo].map((c: any) => {
                  const nombre = [c.customers?.nombre, c.customers?.apellidos].filter(Boolean).join(' ') || c.customers?.email || 'Sin nombre'
                  const progreso = Math.round(((c.sellos_actuales || 0) / sellosNecesarios) * 100)
                  return (
                    <div key={c.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${bordeClaro}` }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold" style={{ background: primario + '18', color: primario }}>
                        {(c.customers?.nombre?.[0] || c.customers?.email?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: texto }}>{nombre}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-1.5 rounded-full" style={{ background: borde }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${progreso}%`, background: primario }} />
                          </div>
                          <span className="text-xs flex-shrink-0" style={{ color: textoSec }}>{c.sellos_actuales}/{sellosNecesarios}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => { verFichaCliente(c); setVista('clientes') }}
                          className="text-xs px-2.5 py-1.5 rounded-lg font-medium"
                          style={{ border: `1px solid ${borde}`, color: textoSec }}>
                          Ficha
                        </button>
                        <button onClick={() => darSello(c)} disabled={darSelloCliente === c.id}
                          className="text-xs px-2.5 py-1.5 rounded-lg font-semibold disabled:opacity-40"
                          style={{ background: boton, color: botonTexto }}>
                          {darSelloCliente === c.id ? '...' : '⭐ Sello'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Ranking top clientes */}
            <p className="text-xs tracking-widest uppercase mb-3 font-semibold" style={{ color: textoSec }}>Top clientes más fieles</p>
            <div className="rounded-xl mb-8" style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : fondo }}>
              {topClientes.length === 0 ? (
                <p className="px-4 py-6 text-sm text-center" style={{ color: textoSec }}>Aún no hay clientes con canjes</p>
              ) : topClientes.map((c: any, idx: number) => {
                const nombre = [c.customers?.nombre, c.customers?.apellidos].filter(Boolean).join(' ') || c.customers?.email || 'Sin nombre'
                const medallas = ['🥇','🥈','🥉','4️⃣','5️⃣']
                return (
                  <button key={c.id} onClick={() => { verFichaCliente(c); setVista('clientes') }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-80"
                    style={{ borderBottom: idx < topClientes.length - 1 ? `1px solid ${bordeClaro}` : 'none' }}>
                    <span className="text-xl flex-shrink-0">{medallas[idx]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: texto }}>{nombre}</p>
                      <p className="text-xs" style={{ color: textoSec }}>{c.sellos_actuales} sellos · {c.total_canjes || 0} canjes</p>
                    </div>
                    <span className="text-xs flex-shrink-0" style={{ color: primario }}>Ver →</span>
                  </button>
                )
              })}
            </div>

            </div>}

            {/* ══ RESEÑAS GOOGLE ══ */}
            {seccionMarketing === 'resenas' && <div>
              <h3 className="text-lg font-bold mb-1" style={{ color: texto }}>Reseñas Google</h3>
              <p className="text-sm mb-6" style={{ color: textoSec }}>Pide a tus clientes que te dejen una reseña en Google con un solo clic.</p>

              {/* Configurar enlace */}
              <div className="rounded-xl p-5 mb-4" style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : fondo }}>
                <p className="text-xs tracking-widest uppercase mb-3 font-semibold" style={{ color: textoSec }}>Tu enlace de Google</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={busquedaResena}
                    onChange={e => setBusquedaResena(e.target.value)}
                    placeholder="Pega aquí tu enlace de reseñas de Google…"
                    className="flex-1 text-sm rounded-xl px-3 py-2 focus:outline-none"
                    style={{ border: `1px solid ${borde}`, background: 'transparent', color: texto }}
                  />
                  <button
                    onClick={async () => {
                      if (!busquedaResena.trim()) return
                      await supabase.from('restaurants').update({ google_review_url: busquedaResena.trim() }).eq('id', restaurante.id)
                      setRestaurante((r: any) => ({ ...r, google_review_url: busquedaResena.trim() }))
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: boton, color: botonTexto }}>
                    Guardar
                  </button>
                </div>
                <p className="text-xs" style={{ color: textoSec }}>
                  Para obtener tu enlace: Google Maps → busca tu negocio → &quot;Pedir reseñas&quot; → copia el enlace
                </p>
              </div>

              {/* Vista previa del mensaje */}
              {(restaurante.google_review_url || busquedaResena) && (
                <div className="rounded-xl p-5 mb-4" style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : fondo }}>
                  <p className="text-xs tracking-widest uppercase mb-3 font-semibold" style={{ color: textoSec }}>Vista previa del mensaje</p>
                  <div className="rounded-xl p-4 text-sm" style={{ background: fondoClaro ? '#f0f2f5' : 'rgba(255,255,255,0.05)', color: texto }}>
                    <p>Hola [nombre] 👋</p>
                    <p className="mt-2">Gracias por confiar en <strong>{restaurante.nombre}</strong>. Si estás contento con nuestro servicio, nos ayudarías mucho dejando una reseña en Google. ¡Solo te lleva 1 minuto!</p>
                    <p className="mt-2">👉 {restaurante.google_review_url || busquedaResena}</p>
                    <p className="mt-2">¡Muchas gracias! 🙏</p>
                  </div>
                </div>
              )}

              {/* Enviar a clientes */}
              <div className="rounded-xl p-5 mb-4" style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : fondo }}>
                <p className="text-xs tracking-widest uppercase mb-3 font-semibold" style={{ color: textoSec }}>Enviar solicitud de reseña</p>
                <p className="text-sm mb-4" style={{ color: textoSec }}>
                  Envía el enlace de reseñas por WhatsApp a tus clientes con teléfono registrado.
                </p>
                <button
                  onClick={async () => {
                    const url = restaurante.google_review_url || busquedaResena
                    if (!url) { alert('Primero guarda tu enlace de Google'); return }
                    setEnviandoResena(true)
                    const mensaje = `Hola [nombre] 👋\n\nGracias por confiar en ${restaurante.nombre}. Si estás contento con nuestro servicio, nos ayudarías mucho dejando una reseña en Google:\n\n👉 ${url}\n\n¡Muchas gracias! 🙏`
                    const res = await fetch('/api/whatsapp-campaign', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ restaurant_id: restaurante.id, mensaje, filtros: null }),
                    })
                    const data = await res.json()
                    setEnviandoResena(false)
                    alert(`✅ Solicitud enviada a ${data.enviados} clientes`)
                  }}
                  disabled={enviandoResena || (!restaurante.google_review_url && !busquedaResena)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                  style={{ background: '#25D366', color: '#fff' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.858L0 24l6.305-1.654A11.932 11.932 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.87 0-3.618-.5-5.12-1.37l-.367-.217-3.812 1 1.017-3.71-.24-.38A9.96 9.96 0 0 1 2 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/></svg>
                  {enviandoResena ? 'Enviando…' : `Enviar por WhatsApp (${clientesConTelefono.length})`}
                </button>
                <p className="text-xs mt-3" style={{ color: textoSec }}>
                  Se enviará a los {clientesConTelefono.length} clientes con teléfono registrado.
                </p>
              </div>

              {/* Consejos */}
              <div className="rounded-xl p-5" style={{ border: `1px solid #fde68a`, background: fondoClaro ? '#fffbeb' : 'rgba(245,158,11,0.08)' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: '#92400e' }}>💡 Consejos para conseguir más reseñas</p>
                <ul className="text-xs space-y-1.5" style={{ color: '#92400e' }}>
                  <li>• Envía la solicitud justo después de que el cliente recoja su vehículo</li>
                  <li>• Personaliza el mensaje mencionando el servicio realizado</li>
                  <li>• No envíes la misma solicitud más de una vez por cliente</li>
                  <li>• Las reseñas de 5 estrellas mejoran tu posicionamiento en Google Maps</li>
                </ul>
              </div>
            </div>}

            {/* ══ CAMPAÑAS ══ */}
            {seccionMarketing === 'campanas' && <div>
              <h3 className="text-lg font-bold mb-1" style={{ color: texto }}>Campañas</h3>
              <p className="text-sm mb-6" style={{ color: textoSec }}>Envía mensajes masivos por WhatsApp o email a tus clientes.</p>

              {/* WhatsApp masivo */}
              <div className="rounded-xl p-5 mb-4" style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : fondo }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">💬</span>
                  <p className="font-semibold text-sm" style={{ color: texto }}>Campaña WhatsApp</p>
                </div>
                <p className="text-xs mb-4" style={{ color: textoSec }}>{clientesConTelefono.length} clientes con teléfono disponibles.</p>

                <div className="mb-3">
                  <p className="text-xs tracking-widest uppercase mb-2" style={{ color: textoSec }}>Mensaje</p>
                  <textarea
                    value={waMensaje}
                    onChange={e => setWaMensaje(e.target.value)}
                    placeholder="Escribe tu mensaje… usa [nombre] para personalizar"
                    rows={4}
                    className="w-full text-sm resize-none rounded-xl px-3 py-2.5 focus:outline-none"
                    style={{ border: `1px solid ${borde}`, background: 'transparent', color: texto }}
                  />
                  <p className="text-xs mt-1" style={{ color: textoSec }}>Variable: <span style={{ color: primario }}>[nombre]</span></p>
                </div>

                {/* Filtros */}
                <div className="mb-4">
                  <p className="text-xs tracking-widest uppercase mb-2" style={{ color: textoSec }}>Segmentar destinatarios</p>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { label: 'Todos', val: null },
                      { label: 'Activos últimos 30 días', val: { actividad: 'activos', diasInactividad: 30 } },
                      { label: 'Inactivos +60 días', val: { actividad: 'inactivos', diasInactividad: 60 } },
                      { label: 'Con ≥5 sellos', val: { sellos: 'min_sellos', minSellos: 5 } },
                    ] as const).map((op, i) => {
                      const activo = JSON.stringify(waFiltros) === JSON.stringify(op.val)
                      return (
                        <button key={i} onClick={() => setWaFiltros(op.val as any)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium"
                          style={{ background: activo ? primario : 'transparent', color: activo ? botonTexto : textoSec, border: `1px solid ${activo ? primario : borde}` }}>
                          {op.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <button
                  onClick={async () => {
                    if (!waMensaje.trim()) return
                    setEnviandoWa(true)
                    setResultadoWa(null)
                    const res = await fetch('/api/whatsapp-campaign', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ restaurant_id: restaurante.id, mensaje: waMensaje, filtros: waFiltros }),
                    })
                    const data = await res.json()
                    setResultadoWa(data)
                    setEnviandoWa(false)
                    if (!data.error) { setWaMensaje(''); recargarCampaigns() }
                  }}
                  disabled={enviandoWa || !waMensaje.trim()}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: '#25D366', color: '#fff' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.858L0 24l6.305-1.654A11.932 11.932 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.87 0-3.618-.5-5.12-1.37l-.367-.217-3.812 1 1.017-3.71-.24-.38A9.96 9.96 0 0 1 2 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/></svg>
                  {enviandoWa ? 'Enviando…' : 'Enviar campaña WhatsApp'}
                </button>
                {resultadoWa && (
                  <div className="mt-3 rounded-xl px-4 py-3 text-sm" style={{ background: resultadoWa.error ? (fondoClaro ? '#fef2f2' : 'rgba(239,68,68,0.1)') : (fondoClaro ? '#f0fdf4' : 'rgba(34,197,94,0.1)'), color: resultadoWa.error ? '#ef4444' : '#22c55e' }}>
                    {resultadoWa.error ? `❌ Error: ${resultadoWa.error}` : `✅ ${resultadoWa.enviados} mensajes enviados de ${resultadoWa.total}`}
                  </div>
                )}
              </div>

              {/* Email masivo */}
              <div className="rounded-xl p-5 mb-4" style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : fondo }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">📧</span>
                  <p className="font-semibold text-sm" style={{ color: texto }}>Campaña Email</p>
                </div>
                <p className="text-xs mb-4" style={{ color: textoSec }}>Envía newsletters y promociones con editor profesional.</p>
                <CampaignCard
                  restauranteId={restaurante.id}
                  fondo={fondo} texto={texto} borde={borde} primario={primario}
                  boton={boton} botonTexto={botonTexto} textoSec={textoSec}
                  fondoClaro={fondoClaro} restaurante={restaurante}
                  onEnviada={recargarCampaigns}
                />
              </div>

              {/* Historial */}
              {campaigns.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs tracking-widest uppercase mb-3 font-semibold" style={{ color: textoSec }}>Historial de campañas</p>
                  {campaigns.map((c: any) => {
                    const estado = c.estado || 'enviada'
                    const f = c.filtros
                    let segDesc = 'Todos los clientes'
                    if (f) {
                      const parts: string[] = []
                      if (f.actividad === 'activos') parts.push(`activos ${f.diasInactividad}d`)
                      if (f.actividad === 'inactivos') parts.push(`inactivos +${f.diasInactividad}d`)
                      if (f.sellos === 'min_sellos') parts.push(`≥${f.minSellos} sellos`)
                      if (f.sellos === 'tarjeta_completa') parts.push('tarjeta completa')
                      if (parts.length) segDesc = parts.join(' · ')
                    }
                    const badge = estado === 'programada'
                      ? { label: 'Programada', color: '#f59e0b', bg: fondoClaro ? '#fffbeb' : 'rgba(245,158,11,0.1)' }
                      : estado === 'error'
                      ? { label: 'Error', color: '#ef4444', bg: fondoClaro ? '#fef2f2' : 'rgba(239,68,68,0.1)' }
                      : { label: 'Enviada', color: '#22c55e', bg: fondoClaro ? '#f0fdf4' : 'rgba(34,197,94,0.1)' }
                    const canal = c.canal === 'whatsapp' ? '💬' : '📧'
                    return (
                      <div key={c.id} className="rounded-xl mb-2 p-4" style={{ border: `1px solid ${borde}` }}>
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span>{canal}</span>
                              <p className="text-sm font-medium truncate" style={{ color: texto }}>{c.asunto}</p>
                              <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium" style={{ color: badge.color, background: badge.bg }}>{badge.label}</span>
                            </div>
                            <p className="text-xs" style={{ color: textoSec }}>{segDesc} · {c.total_enviados ?? 0} enviados</p>
                          </div>
                          <p className="text-xs flex-shrink-0" style={{ color: textoSec }}>
                            {c.creado_en ? new Date(c.creado_en).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : ''}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Emails automáticos */}
              <p className="text-xs tracking-widest uppercase mb-4 font-semibold" style={{ color: textoSec }}>Emails automáticos</p>
              {[
                { tipo: 'recordatorio_reserva', label: 'Recordatorio 24h antes', desc: 'Se envía el día anterior a cada cita confirmada', asuntoDefault: 'Recordatorio: tu cita es mañana', cuerpoDefault: '<p>Hola <strong>[nombre]</strong>,</p><p>Te recordamos que mañana tienes una cita.</p><ul><li><strong>Servicio:</strong> [servicio]</li><li><strong>Fecha:</strong> [fecha]</li><li><strong>Hora:</strong> [hora]</li></ul><p>¡Te esperamos!</p>' },
                { tipo: 'inactivos', label: 'Te echamos de menos', desc: 'Clientes que llevan tiempo sin visitarte', asuntoDefault: '¡Te echamos de menos!', cuerpoDefault: '<p>Hola <strong>[nombre]</strong>,</p><p>Llevamos un tiempo sin verte y te echamos de menos.</p><p>¡Esperamos verte pronto!</p>' },
                { tipo: 'revision_vehiculo', label: 'Recordatorio revisión vehículo', desc: 'Aviso 7 días antes de la próxima revisión', asuntoDefault: 'Recordatorio: revisión de tu vehículo', cuerpoDefault: '<p>Hola <strong>[nombre]</strong>,</p><p>En 7 días vence la revisión de tu <strong>[marca] [modelo]</strong> ([matricula]).</p><p>Contacta con nosotros para reservar tu cita.</p>' },
              ].map(({ tipo, label, desc, asuntoDefault, cuerpoDefault }) => (
                <EmailConfigCard key={tipo} tipo={tipo} label={label} desc={desc}
                  asuntoDefault={asuntoDefault} cuerpoDefault={cuerpoDefault}
                  config={emailConfigs.find((c: any) => c.tipo === tipo)}
                  onToggle={toggleEmailConfig} onGuardar={guardarPlantillaEmail}
                  fondo={fondo} texto={texto} borde={borde} primario={primario}
                  boton={boton} botonTexto={botonTexto} textoSec={textoSec}
                  fondoClaro={fondoClaro} restaurante={restaurante}
                />
              ))}
            </div>}

            {/* ══ SEO & GEO ══ */}
            {seccionMarketing === 'seo' && <div>
              <h3 className="text-lg font-bold mb-1" style={{ color: texto }}>SEO & GEO</h3>
              <p className="text-sm mb-6" style={{ color: textoSec }}>Posicionamiento en Google y en motores de inteligencia artificial</p>
              <SeoTab
                restaurante={restaurante}
                fondo={fondo}
                texto={texto}
                borde={borde}
                primario={primario}
                boton={boton}
                botonTexto={botonTexto}
                textoSec={textoSec}
                fondoClaro={fondoClaro}
              />
            </div>}

            {/* ══ LANDING PAGE ══ */}
            {seccionMarketing === 'landing' && <div>
              <h3 className="text-lg font-bold mb-1" style={{ color: texto }}>Creador de Landing Page</h3>
              <LandingCreator
                restaurante={restaurante}
                fondo={fondo}
                texto={texto}
                borde={borde}
                primario={primario}
                boton={boton}
                botonTexto={botonTexto}
                textoSec={textoSec}
                fondoClaro={fondoClaro}
              />
            </div>}

            {/* ══ REDES SOCIALES ══ */}
            {seccionMarketing === 'social' && <div>
              <h3 className="text-lg font-bold mb-1" style={{ color: texto }}>Redes Sociales</h3>
              <p className="text-sm mb-6" style={{ color: textoSec }}>Generador de posts para Instagram con IA</p>
              <SocialTab
                restaurante={restaurante}
                fondo={fondo}
                texto={texto}
                borde={borde}
                primario={primario}
                boton={boton}
                botonTexto={botonTexto}
                textoSec={textoSec}
                fondoClaro={fondoClaro}
              />
            </div>}
            {seccionMarketing === 'competidores' && <div>
              <h3 className="text-lg font-bold mb-1" style={{ color: texto }}>Análisis de Competidores</h3>
              <p className="text-sm mb-6" style={{ color: textoSec }}>Compara tu posicionamiento SEO y GEO frente a la competencia</p>
              <CompetidoresTab
                restaurante={restaurante}
                fondo={fondo}
                texto={texto}
                borde={borde}
                primario={primario}
                boton={boton}
                botonTexto={botonTexto}
                textoSec={textoSec}
                fondoClaro={fondoClaro}
              />
            </div>}
          </>
          )
        })()}
      {vista === 'ordenes' && (
        <>
          <h2 className="text-2xl font-bold mb-6" style={{ color: texto }}>Órdenes de reparación</h2>
          <OrdenesTab
            restaurante={restaurante}
            fondo={fondo}
            texto={texto}
            borde={borde}
            primario={primario}
            boton={boton}
            botonTexto={botonTexto}
            textoSec={textoSec}
            fondoClaro={fondoClaro}
          />
        </>
      )}
      {vista === 'presupuestos' && (
        <>
          <h2 className="text-2xl font-bold mb-6" style={{ color: texto }}>Presupuestos</h2>
          <div className="max-w-3xl">
            <PresupuestosTab
              restaurante={restaurante}
              fondo={fondo}
              texto={texto}
              borde={borde}
              primario={primario}
              boton={boton}
              botonTexto={botonTexto}
              textoSec={textoSec}
              fondoClaro={fondoClaro}
            />
          </div>
        </>
      )}
      {vista === 'estadisticas' && (
        <>
          <h2 className="text-2xl font-bold mb-6" style={{ color: texto }}>Estadísticas</h2>
          <EstadisticasTab
            restaurante={restaurante}
            fondo={fondo}
            texto={texto}
            borde={borde}
            primario={primario}
            textoSec={textoSec}
            fondoClaro={fondoClaro}
          />
        </>
      )}
      {vista === 'stock' && (
        <>
          <h2 className="text-2xl font-bold mb-6" style={{ color: texto }}>Stock</h2>
          <StockTab
            restaurante={restaurante}
            fondo={fondo}
            texto={texto}
            borde={borde}
            primario={primario}
            boton={boton}
            botonTexto={botonTexto}
            textoSec={textoSec}
            fondoClaro={fondoClaro}
          />
        </>
      )}
      {vista === 'facturas' && (
        <>
          <h2 className="text-2xl font-bold mb-6" style={{ color: texto }}>Facturas</h2>
          <div className="max-w-2xl">
            <FacturasTab
              restaurante={restaurante}
              fondo={fondo}
              texto={texto}
              borde={borde}
              primario={primario}
              boton={boton}
              botonTexto={botonTexto}
              textoSec={textoSec}
              fondoClaro={fondoClaro}
            />
          </div>
        </>
      )}
      {vista === 'ajustes' && (
        <>
          <h2 className="text-2xl font-bold mb-6" style={{ color: texto }}>Ajustes</h2>
          <div className="max-w-lg">

            {/* Email remitente */}
            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Email remitente (Resend)</p>
            <div className="rounded-xl p-4 mb-6" style={{ border: `1px solid ${borde}` }}>
              <p className="text-xs mb-3" style={{ color: textoSec }}>
                Si tienes un dominio verificado en Resend, los emails saldrán con tu dirección en lugar de noreply@zynalto.com
              </p>
              <div className="mb-3">
                <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Nombre del remitente</p>
                <input type="text" value={resendFromName} onChange={e => setResendFromName(e.target.value)}
                  placeholder={restaurante?.nombre || 'Mi Taller'}
                  className="w-full bg-transparent rounded-xl px-3 py-2.5 focus:outline-none text-sm"
                  style={{ border: `1px solid ${borde}`, color: texto }} />
              </div>
              <div>
                <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Email remitente</p>
                <input type="email" value={resendFromEmail} onChange={e => setResendFromEmail(e.target.value)}
                  placeholder="noreply@mitaller.es"
                  className="w-full bg-transparent rounded-xl px-3 py-2.5 focus:outline-none text-sm"
                  style={{ border: `1px solid ${borde}`, color: texto }} />
              </div>
            </div>

            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Portal del cliente</p>
            <div className="rounded-xl p-4 mb-6 flex items-center justify-between gap-3" style={{ border: `1px solid ${borde}` }}>
              <div className="min-w-0">
                <p className="text-sm font-medium mb-0.5" style={{ color: texto }}>Enlace público para tus clientes</p>
                <p className="text-xs truncate" style={{ color: textoSec }}>{typeof window !== 'undefined' ? `${window.location.origin}/portal/${restaurante?.slug}` : ''}</p>
              </div>
              <button
                onClick={() => { if (typeof window !== 'undefined') { navigator.clipboard.writeText(`${window.location.origin}/portal/${restaurante?.slug}`); setMensaje('¡Enlace copiado!'); setTimeout(() => setMensaje(''), 2000) } }}
                className="flex-shrink-0 text-xs px-3 py-2 rounded-lg font-medium"
                style={{ background: boton, color: botonTexto }}
              >
                Copiar
              </button>
            </div>
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: textoSec }}>Datos fiscales (facturas)</p>
            <div className="rounded-xl p-4 mb-6" style={{ border: `1px solid ${borde}` }}>
              {[
                { label: 'NIF / CIF', val: nif, set: setNif, placeholder: 'B12345678' },
                { label: 'Dirección fiscal', val: direccionFiscal, set: setDireccionFiscal, placeholder: 'Calle Mayor 1' },
                { label: 'Código postal', val: cpFiscal, set: setCpFiscal, placeholder: '28001' },
                { label: 'Ciudad', val: ciudadFiscal, set: setCiudadFiscal, placeholder: 'Madrid' },
                { label: 'Provincia', val: provincia, set: setProvincia, placeholder: 'Madrid' },
                { label: 'Serie de facturación', val: serieFact, set: setSerieFact, placeholder: 'A' },
              ].map(f => (
                <div key={f.label} className="mb-3">
                  <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>{f.label}</p>
                  <input type="text" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                    className="w-full bg-transparent rounded-xl px-3 py-2.5 focus:outline-none text-sm"
                    style={{ border: `1px solid ${borde}`, color: texto }} />
                </div>
              ))}
            </div>
            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Notificaciones al cliente</p>
            <div className="rounded-xl p-4 mb-6" style={{ border: `1px solid ${borde}` }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: texto }}>Email al cambiar estado de la orden</p>
                  <p className="text-xs mt-0.5" style={{ color: textoSec }}>El cliente recibe un email cuando su vehículo pasa a diagnóstico, reparación, terminado…</p>
                </div>
                <button
                  onClick={() => setNotifEstadoActivo(!notifEstadoActivo)}
                  className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
                  style={{ background: notifEstadoActivo ? primario : borde }}>
                  <span className="absolute top-0.5 transition-all w-5 h-5 rounded-full bg-white shadow"
                    style={{ left: notifEstadoActivo ? '22px' : '2px' }} />
                </button>
              </div>
              <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${borde}` }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: texto }}>WhatsApp al cambiar estado</p>
                  <p className="text-xs mt-0.5" style={{ color: textoSec }}>Requiere configurar Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM)</p>
                </div>
                <button
                  onClick={() => setNotifWhatsappActivo(!notifWhatsappActivo)}
                  className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
                  style={{ background: notifWhatsappActivo ? '#25D366' : borde }}>
                  <span className="absolute top-0.5 transition-all w-5 h-5 rounded-full bg-white shadow"
                    style={{ left: notifWhatsappActivo ? '22px' : '2px' }} />
                </button>
              </div>
            </div>
            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Recordatorios automáticos</p>
            <div className="rounded-xl p-4 mb-6" style={{ border: `1px solid ${borde}` }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: texto }}>Activar recordatorios</p>
                  <p className="text-xs mt-0.5" style={{ color: textoSec }}>Envío automático por email de ITV y mantenimiento</p>
                </div>
                <button
                  onClick={() => setRecordatoriosActivos(!recordatoriosActivos)}
                  className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
                  style={{ background: recordatoriosActivos ? primario : borde }}
                >
                  <span className="absolute top-0.5 transition-all w-5 h-5 rounded-full bg-white shadow"
                    style={{ left: recordatoriosActivos ? '22px' : '2px' }} />
                </button>
              </div>
              {recordatoriosActivos && (
                <div className="space-y-3 pt-3" style={{ borderTop: `1px solid ${borde}` }}>
                  <div>
                    <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Avisar de ITV con X días de antelación</p>
                    <div className="flex items-center gap-2">
                      <input type="number" min="7" max="90" value={recordatorioItvDias} onChange={e => setRecordatorioItvDias(e.target.value)}
                        className="w-24 bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm"
                        style={{ border: `1px solid ${borde}`, color: texto }} />
                      <span className="text-sm" style={{ color: textoSec }}>días</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Avisar de mantenimiento cuando falten X km</p>
                    <div className="flex items-center gap-2">
                      <input type="number" min="100" max="5000" step="100" value={recordatorioMantKm} onChange={e => setRecordatorioMantKm(e.target.value)}
                        className="w-24 bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm"
                        style={{ border: `1px solid ${borde}`, color: texto }} />
                      <span className="text-sm" style={{ color: textoSec }}>km</span>
                    </div>
                  </div>
                  <p className="text-xs pt-1" style={{ color: textoSec }}>
                    💡 Los emails se envían diariamente a las 9:00h. No se repiten en 20 días para el mismo vehículo.
                  </p>
                </div>
              )}
            </div>
            {/* Valoración post-entrega */}
            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Valoración post-entrega</p>
            <div className="rounded-xl p-4 mb-6" style={{ border: `1px solid ${borde}` }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: texto }}>Email de reseña al entregar el vehículo</p>
                  <p className="text-xs mt-0.5" style={{ color: textoSec }}>Cuando la orden pasa a "Entregado", el cliente recibe un email pidiendo valoración</p>
                </div>
                <button
                  onClick={() => setNotifValoracionActivo(!notifValoracionActivo)}
                  className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
                  style={{ background: notifValoracionActivo ? '#f59e0b' : borde }}>
                  <span className="absolute top-0.5 transition-all w-5 h-5 rounded-full bg-white shadow"
                    style={{ left: notifValoracionActivo ? '22px' : '2px' }} />
                </button>
              </div>
              {notifValoracionActivo && (
                <div style={{ borderTop: `1px solid ${borde}`, paddingTop: 12 }}>
                  <p className="text-xs mb-1" style={{ color: textoSec }}>Enlace a Google Maps / Reseñas (opcional)</p>
                  <input
                    type="url"
                    value={googleMapsUrl}
                    onChange={e => setGoogleMapsUrl(e.target.value)}
                    placeholder="https://g.page/r/tu-negocio/review"
                    className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm"
                    style={{ border: `1px solid ${borde}`, color: texto }}
                  />
                  <p className="text-xs mt-1.5" style={{ color: textoSec }}>Busca tu enlace en Google Maps → tu negocio → "Pedir reseñas"</p>
                </div>
              )}
            </div>

            {/* Datos del negocio */}
            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Datos del negocio</p>
            <div className="rounded-xl p-4 mb-6" style={{ border: `1px solid ${borde}` }}>
              {[
                { label: 'Teléfono', val: telefonoNegocio, set: setTelefonoNegocio, placeholder: '912 345 678', type: 'tel' },
                { label: 'Dirección', val: direccionNegocio, set: setDireccionNegocio, placeholder: 'Calle Mayor 1, 28001 Madrid', type: 'text' },
                { label: 'Web', val: webNegocio, set: setWebNegocio, placeholder: 'https://www.mitaller.es', type: 'url' },
              ].map(f => (
                <div key={f.label} className="mb-3">
                  <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>{f.label}</p>
                  <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                    className="w-full bg-transparent rounded-xl px-3 py-2.5 focus:outline-none text-sm"
                    style={{ border: `1px solid ${borde}`, color: texto }} />
                </div>
              ))}
            </div>

            <div className="mb-6">
            {/* Catálogo de servicios */}
            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Catálogo de servicios</p>
            <div className="rounded-xl p-4 mb-6" style={{ border: `1px solid ${borde}` }}>
              <p className="text-xs mb-3" style={{ color: textoSec }}>Los servicios del catálogo aparecen como sugerencias al crear presupuestos, agilizando el proceso.</p>
              {creandoCatalogo && (
                <div className="mb-4 rounded-xl p-3" style={{ background: fondoClaro ? '#f8fafc' : 'rgba(255,255,255,0.04)', border: `1px solid ${borde}` }}>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="col-span-2">
                      <p className="text-xs mb-1" style={{ color: textoSec }}>Nombre *</p>
                      <input type="text" value={catalogoForm.nombre} onChange={e => setCatalogoForm(f => ({ ...f, nombre: e.target.value }))}
                        placeholder="Ej: Cambio de aceite"
                        className="w-full bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{ border: `1px solid ${borde}`, color: texto }} />
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: textoSec }}>Precio (€)</p>
                      <input type="number" step="0.01" value={catalogoForm.precio} onChange={e => setCatalogoForm(f => ({ ...f, precio: e.target.value }))}
                        placeholder="0.00"
                        className="w-full bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{ border: `1px solid ${borde}`, color: texto }} />
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: textoSec }}>IVA %</p>
                      <select value={catalogoForm.tipo_iva} onChange={e => setCatalogoForm(f => ({ ...f, tipo_iva: e.target.value }))}
                        className="w-full bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{ border: `1px solid ${borde}`, color: texto }}>
                        {['0','4','10','21'].map(v => <option key={v} value={v}>{v}%</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs mb-1" style={{ color: textoSec }}>Descripción</p>
                      <input type="text" value={catalogoForm.descripcion} onChange={e => setCatalogoForm(f => ({ ...f, descripcion: e.target.value }))}
                        placeholder="Descripción opcional"
                        className="w-full bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{ border: `1px solid ${borde}`, color: texto }} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setCreandoCatalogo(false)} className="flex-1 py-1.5 rounded-lg text-xs" style={{ border: `1px solid ${borde}`, color: textoSec }}>Cancelar</button>
                    <button
                      disabled={!catalogoForm.nombre}
                      onClick={async () => {
                        const res = await fetch('/api/catalogo', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ restaurant_id: restaurante.id, ...catalogoForm, precio: catalogoForm.precio ? Number(catalogoForm.precio) : null, tipo_iva: Number(catalogoForm.tipo_iva) }),
                        })
                        const data = await res.json()
                        if (res.ok) { setCatalogo(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre))); setCreandoCatalogo(false); setCatalogoForm({ nombre: '', descripcion: '', precio: '', tipo_iva: '21', categoria: '' }) }
                      }}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                      style={{ background: boton, color: botonTexto }}>
                      Guardar
                    </button>
                  </div>
                </div>
              )}
              {catalogo.length === 0 && !creandoCatalogo && (
                <p className="text-sm mb-3" style={{ color: textoSec }}>Sin servicios en el catálogo todavía</p>
              )}
              {catalogo.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${borde}` }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: texto }}>{s.nombre}</p>
                    {s.descripcion && <p className="text-xs" style={{ color: textoSec }}>{s.descripcion}</p>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    {s.precio && <span className="text-sm font-semibold" style={{ color: primario }}>{Number(s.precio).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>}
                    <span className="text-xs" style={{ color: textoSec }}>{s.tipo_iva}% IVA</span>
                    <button onClick={async () => { await fetch(`/api/catalogo?id=${s.id}`, { method: 'DELETE' }); setCatalogo(prev => prev.filter(x => x.id !== s.id)) }} className="text-xs" style={{ color: '#ef4444' }}>🗑</button>
                  </div>
                </div>
              ))}
              <button onClick={() => setCreandoCatalogo(true)} className="mt-3 text-xs font-medium" style={{ color: primario }}>+ Añadir servicio</button>
            </div>

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
                <button onClick={() => { setCreandoServicioNegocio(true); setEditandoServicioNegocioId(null); setServicioNegocioForm({ nombre: '', duracion_minutos: '', capacidad: '1' }) }} className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: boton, color: botonTexto }}>+ Añadir</button>
              </div>
              {(creandoServicioNegocio || editandoServicioNegocioId) && (
                <div className="rounded-xl p-4 mb-4" style={{ border: `1px solid ${editandoServicioNegocioId ? primario : borde}` }}>
                  <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>{editandoServicioNegocioId ? 'Editar servicio' : 'Nuevo servicio'}</p>
                  <div className="mb-3">
                    <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Nombre</p>
                    <input type="text" value={servicioNegocioForm.nombre} onChange={(e) => setServicioNegocioForm({ ...servicioNegocioForm, nombre: e.target.value })} placeholder="Ej: Cambio de aceite" className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
                  </div>
                  <div className="mb-3">
                    <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Duración (minutos)</p>
                    <input type="number" value={servicioNegocioForm.duracion_minutos} onChange={(e) => setServicioNegocioForm({ ...servicioNegocioForm, duracion_minutos: e.target.value })} placeholder="Ej: 45" className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
                  </div>
                  <div className="mb-4">
                    <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Capacidad máxima</p>
                    <input type="number" value={servicioNegocioForm.capacidad} onChange={(e) => setServicioNegocioForm({ ...servicioNegocioForm, capacidad: e.target.value })} placeholder="Ej: 1" className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={editandoServicioNegocioId ? editarServicioNegocio : crearServicioNegocio} disabled={!servicioNegocioForm.nombre} className="flex-1 text-xs font-semibold rounded-lg py-2 disabled:opacity-30" style={{ background: boton, color: botonTexto }}>Guardar</button>
                    <button onClick={() => { setCreandoServicioNegocio(false); setEditandoServicioNegocioId(null); setServicioNegocioForm({ nombre: '', duracion_minutos: '', capacidad: '1' }) }} className="flex-1 text-xs font-semibold rounded-lg py-2" style={{ border: `1px solid ${borde}`, color: textoSec, background: 'transparent' }}>Cancelar</button>
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
                        {s.duracion_minutos && <p className="text-xs mt-0.5" style={{ color: textoSec }}>{s.duracion_minutos} min · cap. {s.capacidad || 1}</p>}
                      </div>
                      <div className="flex gap-2 items-center">
                        <button onClick={() => toggleActivoServicioNegocio(s)} className="text-xs px-2 py-1 rounded-lg" style={{ color: s.activo ? primario : textoSec, border: `1px solid ${s.activo ? primario : borde}` }}>{s.activo ? 'Activo' : 'Inactivo'}</button>
                        <button onClick={() => { setEditandoServicioNegocioId(s.id); setCreandoServicioNegocio(false); setServicioNegocioForm({ nombre: s.nombre, duracion_minutos: s.duracion_minutos?.toString() || '', capacidad: s.capacidad?.toString() || '1' }) }} className="text-xs px-2 py-1 rounded-lg" style={{ color: primario, border: `1px solid ${primario}` }}>Editar</button>
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

  const buscarProps = {
    restaurante, primario, fondo, texto, borde, textoSec, fondoClaro,
    onVerOrden: () => setVista('ordenes'),
    onVerCliente: () => setVista('clientes'),
    onVerPresupuesto: () => setVista('presupuestos'),
  }

  // Tabs que caben en el bottom nav móvil (los más usados)
  const tabsMobile = tabs.filter(t => ['inicio','ordenes','reservas','stock','ajustes'].includes(t.key))

  return (
    <div className="min-h-screen flex" style={{ background: fondo }}>

      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen flex-shrink-0 sticky top-0 h-screen"
        style={{ background: fondoSidebar, borderRight: `1px solid ${borde}` }}>

        {/* Logo + nombre */}
        <div className="px-5 pt-6 pb-4" style={{ borderBottom: `1px solid ${borde}` }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base font-bold" style={{ background: primario, color: botonTexto }}>
              {restaurante.nombre?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight truncate" style={{ color: texto }}>{restaurante.nombre}</p>
              <p className="text-xs mt-0.5" style={{ color: textoSec }}>Dashboard</p>
            </div>
          </div>
        </div>

        {/* Buscador */}
        <div className="px-3 py-3" style={{ borderBottom: `1px solid ${borde}` }}>
          <BuscadorGlobal {...buscarProps} />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {tabs.map(t => {
            const activo = vista === t.key
            const badgeCitas = t.key === 'reservas' && citasPendientes.length > 0
            const badgeBloqueos = t.key === 'ordenes' && ordenesResumen.bloqueadas > 0
            return (
              <button
                key={t.key}
                onClick={() => { setVista(t.key as any); setClienteSeleccionado(null); setVehiculoSeleccionado(null) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: activo ? primario : 'transparent',
                  color: activo ? botonTexto : textoSec,
                }}>
                <span className="text-base leading-none">{t.icon}</span>
                <span className="flex-1 text-left">{t.label}</span>
                {badgeCitas && <span className="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: '#fde047', color: '#713f12' }}>{citasPendientes.length}</span>}
                {badgeBloqueos && <span className="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: '#fecaca', color: '#b91c1c' }}>{ordenesResumen.bloqueadas}</span>}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-5 pt-3" style={{ borderTop: `1px solid ${borde}` }}>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push('/dashboard/login'))}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all hover:opacity-70"
            style={{ color: textoSec }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar móvil */}
        <header className="md:hidden sticky top-0 z-10 flex items-center gap-3 px-4 py-3" style={{ background: fondoSidebar, borderBottom: `1px solid ${borde}` }}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: primario, color: botonTexto }}>{restaurante.nombre?.[0]?.toUpperCase()}</div>
            <p className="font-bold text-sm truncate" style={{ color: texto }}>{restaurante.nombre}</p>
          </div>
          <BuscadorGlobal {...buscarProps} />
        </header>

        {/* Vista actual */}
        <main className="flex-1 pb-24 md:pb-0">
          {contenido}
        </main>
      </div>

      {/* ── SOPORTE ── */}
      <SoporteChat restaurante={restaurante} />

      {/* ── BOTTOM NAV MÓVIL ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 flex" style={{ background: fondoSidebar, borderTop: `1px solid ${borde}` }}>
        {tabsMobile.map(t => {
          const activo = vista === t.key
          return (
            <button
              key={t.key}
              onClick={() => { setVista(t.key as any); setClienteSeleccionado(null); setVehiculoSeleccionado(null) }}
              className="flex-1 py-2.5 flex flex-col items-center gap-0.5 relative"
              style={{ color: activo ? primario : textoSec }}>
              <span className="text-xl leading-none">{t.icon}</span>
              <span className="text-[10px] font-medium">{t.label}</span>
              {t.key === 'reservas' && citasPendientes.length > 0 && (
                <span className="absolute top-1.5 right-1/4 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: '#f59e0b', color: '#fff' }}>{citasPendientes.length}</span>
              )}
            </button>
          )
        })}
      </nav>

    </div>
  )
}