'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function Dashboard() {
  const { slug } = useParams()
  const router = useRouter()
  const [restaurante, setRestaurante] = useState<any>(null)
  const [stats, setStats] = useState({ clientes: 0, sellos: 0, canjes: 0 })
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [nuevoPin, setNuevoPin] = useState('')
  const [nuevaRecompensa, setNuevaRecompensa] = useState('')

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

      setStats({
        clientes: clientes || 0,
        sellos: sellos || 0,
        canjes: canjes || 0
      })

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

  if (cargando) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white text-sm tracking-widest uppercase">Cargando</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-black p-6">
      <div className="max-w-sm mx-auto">

        <div className="mb-12 pt-6">
          {restaurante.logo_url && (
            <img src={restaurante.logo_url} alt={restaurante.nombre} className="h-12 object-contain mb-6" />
          )}
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">Dashboard</p>
          <h1 className="text-white text-4xl font-bold leading-tight">{restaurante.nombre}</h1>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-12">
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

        <div className="mb-6">
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-3">PIN del camarero</p>
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

        {mensaje && <p className="text-green-400 text-sm text-center">{mensaje}</p>}

        <button
          onClick={() => supabase.auth.signOut().then(() => router.push('/dashboard/login'))}
          className="w-full mt-6 text-zinc-600 text-xs tracking-widest uppercase"
        >
          Cerrar sesión
        </button>

      </div>
    </main>
  )
}