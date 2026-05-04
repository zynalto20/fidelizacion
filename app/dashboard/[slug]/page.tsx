'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const { slug } = useParams()
  const router = useRouter()
  const [restaurante, setRestaurante] = useState<any>(null)
  const [stats, setStats] = useState({ clientes: 0, sellos: 0, canjes: 0 })
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
      const { data: clientesData } = await supabase.from('loyalty_cards').select('*, customers(id, email, nombre, apellidos, telefono_nuevo, prefijo_telefono, dni, direccion, ciudad, codigo_postal, tipo_vehiculo, matricula)').eq('restaurant_id', rest.id).order('actualizado_en', { ascending: false })
      setClientes(clientesData || [])
      setCargando(false)
    }
    cargarDatos()
  }, [slug])

  async function verFichaCliente(cliente: any) {
    setClienteSeleccionado(cliente)
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
      tipo_vehiculo: cliente.customers?.tipo_vehiculo || '',
      matricula: cliente.customers?.matricula || '',
    })
    const { data: h } = await supabase.from('stamp_events').select('*').eq('card_id', cliente.id).order('creado_en', { ascending: false })
    setHistorial(h || [])
  }

  async function guardarFicha() {
    setGuardandoFicha(true)
    await supabase.from('customers').update(fichaForm).eq('id', clienteSeleccionado.customers?.id)
    setClienteSeleccionado({ ...clienteSeleccionado, customers: { ...clienteSeleccionado.customers, ...fichaForm } })
    setEditandoFicha(false)
    setGuardandoFicha(false)
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
      const { data: clientesData } = await supabase.from('loyalty_cards').select('*, customers(id, email, nombre, apellidos, telefono_nuevo, prefijo_telefono, dni, direccion, ciudad, codigo_postal, tipo_vehiculo, matricula)').eq('restaurant_id', restaurante.id).order('actualizado_en', { ascending: false })
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

  if (clienteSeleccionado) return (
    <main className="min-h-screen p-6 pb-24" style={{ background: fondo }}>
      <div className="max-w-sm mx-auto">
        <button onClick={() => setClienteSeleccionado(null)} className="mb-6 text-xs tracking-widest uppercase" style={{ color: textoSec }}>← Volver</button>
        <div className="mb-8">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: textoSec }}>Ficha de cliente</p>
          <h1 className="text-2xl font-bold break-all" style={{ color: texto }}>{clienteSeleccionado.customers?.nombre ? `${clienteSeleccionado.customers.nombre} ${clienteSeleccionado.customers.apellidos || ''}` : clienteSeleccionado.customers?.email || 'Sin email'}</h1>
          {clienteSeleccionado.customers?.nombre && <p className="text-sm mt-1" style={{ color: textoSec }}>{clienteSeleccionado.customers?.email}</p>}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[{ label: 'Sellos', value: clienteSeleccionado.sellos_actuales }, { label: 'Canjes', value: clienteSeleccionado.total_canjes }, { label: 'Visitas', value: historial.filter(h => h.tipo === 'sello').length }].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-4 text-center" style={{ border: `1px solid ${borde}` }}>
              <p className="text-3xl font-bold" style={{ color: texto }}>{value}</p>
              <p className="text-xs tracking-widest uppercase mt-1" style={{ color: textoSec }}>{label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl p-5 mb-6" style={{ border: `1px solid ${borde}` }}>
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs tracking-widest uppercase" style={{ color: textoSec }}>Datos del cliente</p>
            <button onClick={() => setEditandoFicha(!editandoFicha)} className="text-xs font-semibold px-3 py-1 rounded-lg" style={{ background: boton, color: botonTexto }}>
              {editandoFicha ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          {editandoFicha ? (
            <div>
              <p className="text-xs tracking-widest uppercase mb-3 mt-1" style={{ color: textoSec }}>Datos personales</p>
              {[
                { label: 'Nombre', key: 'nombre', type: 'text' },
                { label: 'Apellidos', key: 'apellidos', type: 'text' },
                { label: 'DNI', key: 'dni', type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key} className="mb-3">
                  <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>{label}</p>
                  <input type={type} value={fichaForm[key] || ''} onChange={(e) => setFichaForm({ ...fichaForm, [key]: e.target.value })} className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
                </div>
              ))}

              <p className="text-xs tracking-widest uppercase mb-3 mt-4" style={{ color: textoSec }}>Teléfono</p>
              <div className="flex gap-2 mb-3">
                <select value={fichaForm.prefijo_telefono || '+34'} onChange={(e) => setFichaForm({ ...fichaForm, prefijo_telefono: e.target.value })} className="bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm w-24" style={{ border: `1px solid ${borde}`, color: texto }}>
                  {['+34', '+1', '+44', '+33', '+49', '+39', '+351', '+52', '+54', '+57', '+56', '+51', '+593', '+598'].map(p => (
                    <option key={p} value={p} style={{ background: fondoClaro ? '#fff' : '#000' }}>{p}</option>
                  ))}
                </select>
                <input type="tel" value={fichaForm.telefono_nuevo || ''} onChange={(e) => setFichaForm({ ...fichaForm, telefono_nuevo: e.target.value })} placeholder="600 000 000" className="flex-1 bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
              </div>

              <p className="text-xs tracking-widest uppercase mb-3 mt-4" style={{ color: textoSec }}>Dirección</p>
              {[
                { label: 'Calle y número', key: 'direccion', type: 'text' },
                { label: 'Ciudad', key: 'ciudad', type: 'text' },
                { label: 'Código postal', key: 'codigo_postal', type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key} className="mb-3">
                  <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>{label}</p>
                  <input type={type} value={fichaForm[key] || ''} onChange={(e) => setFichaForm({ ...fichaForm, [key]: e.target.value })} className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
                </div>
              ))}

              <p className="text-xs tracking-widest uppercase mb-3 mt-4" style={{ color: textoSec }}>Vehículo</p>
              <div className="mb-3">
                <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Tipo</p>
                <select value={fichaForm.tipo_vehiculo || ''} onChange={(e) => setFichaForm({ ...fichaForm, tipo_vehiculo: e.target.value })} className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }}>
                  <option value="" style={{ background: fondoClaro ? '#fff' : '#000' }}>— Sin vehículo —</option>
                  {['Coche', 'Moto', 'Camioneta', 'Autobús', 'Camión', 'Furgoneta', 'Otro'].map(v => (
                    <option key={v} value={v} style={{ background: fondoClaro ? '#fff' : '#000' }}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Matrícula</p>
                <input type="text" value={fichaForm.matricula || ''} onChange={(e) => setFichaForm({ ...fichaForm, matricula: e.target.value.toUpperCase() })} placeholder="0000 AAA" className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm" style={{ border: `1px solid ${borde}`, color: texto }} />
              </div>

              <button onClick={guardarFicha} disabled={guardandoFicha} className="w-full font-semibold rounded-xl py-3 disabled:opacity-30 text-sm" style={{ background: boton, color: botonTexto }}>
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
                { label: 'Vehículo', value: clienteSeleccionado.customers?.tipo_vehiculo },
                { label: 'Matrícula', value: clienteSeleccionado.customers?.matricula },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${bordeClaro}` }}>
                  <p className="text-xs tracking-widest uppercase" style={{ color: textoSec }}>{label}</p>
                  <p className="text-sm" style={{ color: value ? texto : textoSec }}>{value || '—'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl p-5" style={{ border: `1px solid ${borde}` }}>
          <p className="text-xs tracking-widest uppercase mb-4" style={{ color: textoSec }}>Historial</p>
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
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[{ label: 'Clientes', value: stats.clientes }, { label: 'Sellos', value: stats.sellos }, { label: 'Canjes', value: stats.canjes }].map(({ label, value }) => (
                <div key={label} className="rounded-xl p-4 text-center" style={{ border: `1px solid ${borde}` }}>
                  <p className="text-3xl font-bold" style={{ color: texto }}>{value}</p>
                  <p className="text-xs tracking-widest uppercase mt-1" style={{ color: textoSec }}>{label}</p>
                </div>
              ))}
            </div>
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
                      {c.customers?.matricula && <p className="text-xs mt-0.5" style={{ color: primario }}>{c.customers.tipo_vehiculo} · {c.customers.matricula}</p>}
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
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: textoSec }}>Todas las reservas</p>
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