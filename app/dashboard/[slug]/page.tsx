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
  const [vista, setVista] = useState<'inicio' | 'reservas' | 'ajustes'>('inicio')

  useEffect(() => {
    async function cargarDatos() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/dashboard/login'); return }

      const { data: rest } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .eq('owner_id', session.user.id)
        .single()

      if (!rest) { router.push('/dashboard/login'); return }

      setRestaurante(rest)
      setNuevoPin(rest.pin)
      setNuevaRecompensa(rest.recompensa)

      const { count: clientes } = await supabase
        .from('loyalty_cards')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', rest.id)

      const { count: sellos } = await supabase
        .from('stamp_events')
        .select('*', { count: 'exact', head: true })
        .eq('tipo', 'sello')

      const { count: canjes } = await supabase
        .from('stamp_events')
        .select('*', { count: 'exact', head: true })
        .eq('tipo', 'canje')

      setStats({ clientes: clientes || 0, sellos: sellos || 0, canjes: canjes || 0 })

      const { data: res } = await supabase
        .from('bookings')
        .select('*')
        .eq('restaurant_id', rest.id)
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true })

      setReservas(res || [])
      setCargando(false)
    }
    cargarDatos()
  }, [slug])

  async function guardarCambios() {
    setGuardando(true)
    setMensaje('')
    await supabase
      .from('restaurants')
      .update({ pin: nuevoPin, recompensa: nuevaRecompensa })
      .eq('id', restaurante.id)
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

  return (
    <main className="min-h-screen bg-black p-6 pb-24">
      <div className="max-w-sm mx-auto">

        <div className="mb-8 pt-6">
          {restaurante.logo_url && (
            <img src={restaurante.logo_url} alt={restaurante.nombre} className="h-12 object-contain mb-6" />
          )}
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">Dashboard</p>
          <h1 className="text-white text-4xl font-bold leading-tight">{restaurante.nombre}</h1>
        </div>

        {/* Navegación */}
        <div className="flex gap-2 mb-8">
          {['inicio', 'reservas', 'ajustes'].map(v => (
            <button
              key={v}
              onClick={() => setVista(v as any)}
              className={`flex-1 py-2 rounded-xl text-xs tracking-widest uppercase transition-colors ${vista === v ? 'bg-white text-black' : 'border border-zinc-700 text-zinc-400'}`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Vista inicio */}
        {vista === 'inicio' && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="border border-zinc-800 rounded-xl p-4 text-center">
                <p className="text-white text-3xl font-bold">{stats.clientes}</p>
                <p className="text-zinc-500 text-xs tracking-widest uppercase mt-1">Clientes</p>
              </div>
              <div className="border border-zinc-800 rounded-xl p-4 text-center">
                <p className="text-white text-3xl font-bold">{stats.sellos}</p>
                <p className="text-zinc-500 text-xs tracking-widest uppercase mt-1">Sellos</p>
              </div>
              <div className="border border-zinc-800 rounded-xl p-4 text-center">
                <p className="text-white text-3xl font-bold">{stats.canjes}</p>
                <p className="text-zinc-500 text-xs tracking-widest uppercase mt-1">Canjes</p>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-xl p-5 mb-4">
              <p className="text-zinc-500 text-xs tracking-widest uppercase mb-3">Próximas reservas</p>
              {reservas.filter(r => r.estado !== 'cancelada').slice(0, 3).length === 0 ? (
                <p className="text-zinc-600 text-sm">No hay reservas próximas</p>
              ) : (
                reservas.filter(r => r.estado !== 'cancelada').slice(0, 3).map(r => (
                  <div key={r.id} className="border-b border-zinc-800 py-3 last:border-0">
                    <p className="text-white font-medium">{r.customer_name}</p>
                    <p className="text-zinc-400 text-sm">{r.fecha} · {r.hora} · {r.servicio}</p>
                  </div>
                ))
              )}
              <button onClick={() => setVista('reservas')} className="w-full mt-3 text-zinc-500 text-xs tracking-widest uppercase">
                Ver todas →
              </button>
            </div>
          </>
        )}

        {/* Vista reservas */}
        {vista === 'reservas' && (
          <div>
            <p className="text-zinc-500 text-xs tracking-widest uppercase mb-4">Todas las reservas</p>
            {reservas.length === 0 ? (
              <p className="text-zinc-600 text-sm">No hay reservas todavía</p>
            ) : (
              reservas.map(r => (
                <div key={r.id} className="border border-zinc-800 rounded-xl p-4 mb-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-white font-medium">{r.customer_name}</p>
                      <p className="text-zinc-400 text-sm">{r.customer_email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      r.estado === 'confirmada' ? 'bg-green-900 text-green-400' :
                      r.estado === 'cancelada' ? 'bg-red-900 text-red-400' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {r.estado}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-sm mb-3">{r.fecha} · {r.hora} · {r.servicio}</p>
                  {r.notas && <p className="text-zinc-600 text-xs mb-3">"{r.notas}"</p>}
                  <div className="flex gap-2">
                    {r.estado !== 'confirmada' && (
                      <button
                        onClick={() => cambiarEstadoReserva(r.id, 'confirmada')}
                        className="flex-1 bg-white text-black text-xs font-semibold rounded-lg py-2"
                      >
                        Confirmar
                      </button>
                    )}
                    {r.estado !== 'cancelada' && (
                      <button
                        onClick={() => cambiarEstadoReserva(r.id, 'cancelada')}
                        className="flex-1 border border-zinc-700 text-zinc-400 text-xs font-semibold rounded-lg py-2"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Vista ajustes */}
        {vista === 'ajustes' && (
          <div>
            <div className="mb-6">
              <p className="text-zinc-500 text-xs tracking-widest uppercase mb-3">PIN para dar sello</p>
              <input
                type="number"
                value={nuevoPin}
                onChange={(e) => setNuevoPin(e.target.value)}
                className="w-full bg-transparent border border-zinc-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-white transition-colors"
              />
            </div>

            <div className="mb-8">
              <p className="text-zinc-500 text-xs tracking-widest uppercase mb-3">Premio al completar</p>
              <input
                type="text"
                value={nuevaRecompensa}
                onChange={(e) => setNuevaRecompensa(e.target.value)}
                className="w-full bg-transparent border border-zinc-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-white transition-colors"
              />
            </div>

            <button
              onClick={guardarCambios}
              disabled={guardando}
              className="w-full bg-white text-black font-semibold rounded-xl py-4 disabled:opacity-30 mb-4"
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>

            {mensaje && <p className="text-green-400 text-sm text-center mb-4">{mensaje}</p>}

            <button
              onClick={() => supabase.auth.signOut().then(() => router.push('/dashboard/login'))}
              className="w-full mt-2 text-zinc-600 text-xs tracking-widest uppercase"
            >
              Cerrar sesión
            </button>
          </div>
        )}

      </div>
    </main>
  )
}