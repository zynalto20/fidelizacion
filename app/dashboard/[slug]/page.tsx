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
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [nuevoPin, setNuevoPin] = useState('')
  const [nuevaRecompensa, setNuevaRecompensa] = useState('')
  const [colores, setColores] = useState<any>({})
  const [vista, setVista] = useState<'inicio' | 'reservas' | 'ajustes'>('inicio')

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
      const { count: clientes } = await supabase.from('loyalty_cards').select('*', { count: 'exact', head: true }).eq('restaurant_id', rest.id)
      const { count: sellos } = await supabase.from('stamp_events').select('*', { count: 'exact', head: true }).eq('tipo', 'sello')
      const { count: canjes } = await supabase.from('stamp_events').select('*', { count: 'exact', head: true }).eq('tipo', 'canje')
      setStats({ clientes: clientes || 0, sellos: sellos || 0, canjes: canjes || 0 })
      const { data: res } = await supabase.from('bookings').select('*').eq('restaurant_id', rest.id).order('fecha', { ascending: true }).order('hora', { ascending: true })
      setReservas(res || [])
      setCargando(false)
    }
    cargarDatos()
  }, [slug])

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

  return (
    <main className="min-h-screen p-6 pb-24" style={{ background: fondo }}>
      <div className="max-w-sm mx-auto">
        <div className="mb-8 pt-6">
          {restaurante.logo_url && <img src={restaurante.logo_url} alt={restaurante.nombre} className="h-12 object-contain mb-6" />}
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: `${texto}60` }}>Dashboard</p>
          <h1 className="text-4xl font-bold leading-tight" style={{ color: texto }}>{restaurante.nombre}</h1>
        </div>

        <div className="flex gap-2 mb-8">
          {['inicio', 'reservas', 'ajustes'].map(v => (
            <button key={v} onClick={() => setVista(v as any)} className="flex-1 py-2 rounded-xl text-xs tracking-widest uppercase transition-colors" style={{ background: vista === v ? primario : 'transparent', color: vista === v ? botonTexto : `${texto}60`, border: vista === v ? 'none' : `1px solid ${texto}30` }}>
              {v}
            </button>
          ))}
        </div>

        {vista === 'inicio' && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[{ label: 'Clientes', value: stats.clientes }, { label: 'Sellos', value: stats.sellos }, { label: 'Canjes', value: stats.canjes }].map(({ label, value }) => (
                <div key={label} className="rounded-xl p-4 text-center" style={{ border: `1px solid ${texto}20` }}>
                  <p className="text-3xl font-bold" style={{ color: texto }}>{value}</p>
                  <p className="text-xs tracking-widest uppercase mt-1" style={{ color: `${texto}50` }}>{label}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-5 mb-4" style={{ border: `1px solid ${texto}20` }}>
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: `${texto}50` }}>Próximas reservas</p>
              {reservas.filter(r => r.estado !== 'cancelada').slice(0, 3).length === 0 ? (
                <p className="text-sm" style={{ color: `${texto}40` }}>No hay reservas próximas</p>
              ) : (
                reservas.filter(r => r.estado !== 'cancelada').slice(0, 3).map(r => (
                  <div key={r.id} className="py-3" style={{ borderBottom: `1px solid ${texto}10` }}>
                    <p className="font-medium" style={{ color: texto }}>{r.customer_name}</p>
                    <p className="text-sm" style={{ color: `${texto}50` }}>{r.fecha} · {r.hora} · {r.servicio}</p>
                  </div>
                ))
              )}
              <button onClick={() => setVista('reservas')} className="w-full mt-3 text-xs tracking-widest uppercase" style={{ color: `${texto}40` }}>Ver todas →</button>
            </div>
          </>
        )}

        {vista === 'reservas' && (
          <div>
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: `${texto}60` }}>Todas las reservas</p>
            {reservas.length === 0 ? (
              <p className="text-sm" style={{ color: `${texto}40` }}>No hay reservas todavía</p>
            ) : (
              reservas.map(r => (
                <div key={r.id} className="rounded-xl p-4 mb-3" style={{ border: `1px solid ${texto}20` }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium" style={{ color: texto }}>{r.customer_name}</p>
                      <p className="text-sm" style={{ color: `${texto}50` }}>{r.customer_email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${r.estado === 'confirmada' ? 'bg-green-900 text-green-400' : r.estado === 'cancelada' ? 'bg-red-900 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>{r.estado}</span>
                  </div>
                  <p className="text-sm mb-3" style={{ color: `${texto}40` }}>{r.fecha} · {r.hora} · {r.servicio}</p>
                  {r.notas && <p className="text-xs mb-3" style={{ color: `${texto}30` }}>"{r.notas}"</p>}
                  <div className="flex gap-2">
                    {r.estado !== 'confirmada' && <button onClick={() => cambiarEstadoReserva(r.id, 'confirmada')} className="flex-1 text-xs font-semibold rounded-lg py-2" style={{ background: boton, color: botonTexto }}>Confirmar</button>}
                    {r.estado !== 'cancelada' && <button onClick={() => cambiarEstadoReserva(r.id, 'cancelada')} className="flex-1 text-xs font-semibold rounded-lg py-2" style={{ border: `1px solid ${texto}30`, color: `${texto}60`, background: 'transparent' }}>Cancelar</button>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {vista === 'ajustes' && (
          <div>
            <div className="mb-6">
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: `${texto}60` }}>PIN para dar sello</p>
              <input type="number" value={nuevoPin} onChange={(e) => setNuevoPin(e.target.value)} className="w-full bg-transparent rounded-xl px-4 py-4 focus:outline-none" style={{ border: `1px solid ${texto}30`, color: texto }} />
            </div>
            <div className="mb-6">
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: `${texto}60` }}>Premio al completar</p>
              <input type="text" value={nuevaRecompensa} onChange={(e) => setNuevaRecompensa(e.target.value)} className="w-full bg-transparent rounded-xl px-4 py-4 focus:outline-none" style={{ border: `1px solid ${texto}30`, color: texto }} />
            </div>
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: `${texto}60` }}>Colores</p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[{ label: 'Fondo', key: 'color_fondo' }, { label: 'Texto', key: 'color_texto' }, { label: 'Primario', key: 'color_primario' }, { label: 'Botón', key: 'color_boton' }, { label: 'Texto botón', key: 'color_boton_texto' }].map(({ label, key }) => (
                <div key={key} className="rounded-xl p-3" style={{ border: `1px solid ${texto}20` }}>
                  <p className="text-xs tracking-widest uppercase mb-2" style={{ color: `${texto}50` }}>{label}</p>
                  <div className="flex items-center gap-2">
                    <input type="color" value={colores[key] || '#000000'} onChange={(e) => setColores({ ...colores, [key]: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                    <span className="text-xs font-mono" style={{ color: `${texto}40` }}>{colores[key]}</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={guardarCambios} disabled={guardando} className="w-full font-semibold rounded-xl py-4 disabled:opacity-30 mb-4" style={{ background: boton, color: botonTexto }}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {mensaje && <p className="text-sm text-center mb-4" style={{ color: primario }}>{mensaje}</p>}
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/dashboard/login'))} className="w-full mt-2 text-xs tracking-widest uppercase" style={{ color: `${texto}30` }}>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </main>
  )
}