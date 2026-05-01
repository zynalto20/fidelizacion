'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Reservas() {
  const { slug } = useParams()
  const [restaurante, setRestaurante] = useState<any>(null)
  const [servicios, setServicios] = useState<any[]>([])
  const [paso, setPaso] = useState(1)
  const [servicioSeleccionado, setServicioSeleccionado] = useState<any>(null)
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [notas, setNotas] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [confirmado, setConfirmado] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargar() {
      const { data: rest } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single()
      setRestaurante(rest)

      const { data: svcs } = await supabase
        .from('services')
        .select('*')
        .eq('restaurant_id', rest?.id)
        .eq('activo', true)
      setServicios(svcs || [])
    }
    cargar()
  }, [slug])

  async function confirmarReserva() {
    setEnviando(true)
    setError('')

    const { error } = await supabase.from('bookings').insert({
      restaurant_id: restaurante.id,
      customer_name: nombre,
      customer_email: email,
      servicio: servicioSeleccionado?.nombre || 'General',
      fecha,
      hora,
      notas,
      estado: 'pendiente'
    })

    if (error) {
      setError('Error al crear la reserva')
    } else {
      setConfirmado(true)
    }
    setEnviando(false)
  }

  if (!restaurante) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white text-sm tracking-widest uppercase">Cargando</p>
    </div>
  )

  if (confirmado) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <p className="text-white text-5xl mb-6">✓</p>
        <h1 className="text-white text-3xl font-bold mb-4">Reserva confirmada</h1>
        <p className="text-zinc-400 text-sm mb-2">Te hemos enviado un recordatorio a <span className="text-white">{email}</span></p>
        <div className="border border-zinc-800 rounded-xl p-5 mt-8 text-left">
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-3">Detalle</p>
          <p className="text-white font-medium">{restaurante.nombre}</p>
          <p className="text-zinc-400 text-sm mt-1">{servicioSeleccionado?.nombre || 'General'}</p>
          <p className="text-zinc-400 text-sm mt-1">{fecha} a las {hora}</p>
        </div>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">

        <div className="mb-10">
          {restaurante.logo_url && (
            <img src={restaurante.logo_url} alt={restaurante.nombre} className="h-12 object-contain mb-6" />
          )}
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">Reservas</p>
          <h1 className="text-white text-4xl font-bold leading-tight">{restaurante.nombre}</h1>
        </div>

        {/* Paso 1: Servicio */}
        {paso === 1 && (
          <div>
            <p className="text-zinc-500 text-xs tracking-widest uppercase mb-4">Elige el servicio</p>
            {servicios.length === 0 ? (
              <button
                onClick={() => { setServicioSeleccionado(null); setPaso(2) }}
                className="w-full border border-zinc-700 rounded-xl p-4 text-left mb-3 hover:border-white transition-colors"
              >
                <p className="text-white font-medium">Reserva general</p>
              </button>
            ) : (
              servicios.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setServicioSeleccionado(s); setPaso(2) }}
                  className="w-full border border-zinc-700 rounded-xl p-4 text-left mb-3 hover:border-white transition-colors"
                >
                  <p className="text-white font-medium">{s.nombre}</p>
                  <div className="flex gap-4 mt-1">
                    {s.duracion_minutos && <p className="text-zinc-500 text-sm">{s.duracion_minutos} min</p>}
                    {s.precio && <p className="text-zinc-500 text-sm">{s.precio}€</p>}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Paso 2: Fecha y hora */}
        {paso === 2 && (
          <div>
            <p className="text-zinc-500 text-xs tracking-widest uppercase mb-4">Fecha y hora</p>
            <div className="mb-4">
              <p className="text-zinc-500 text-xs tracking-widest uppercase mb-3">Fecha</p>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-transparent border border-zinc-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-white transition-colors"
              />
            </div>
            <div className="mb-8">
              <p className="text-zinc-500 text-xs tracking-widest uppercase mb-3">Hora</p>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full bg-transparent border border-zinc-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-white transition-colors"
              />
            </div>
            <button
              onClick={() => setPaso(3)}
              disabled={!fecha || !hora}
              className="w-full bg-white text-black font-semibold rounded-xl py-4 disabled:opacity-30"
            >
              Continuar
            </button>
            <button onClick={() => setPaso(1)} className="w-full mt-4 text-zinc-500 text-xs tracking-widest uppercase">
              Volver
            </button>
          </div>
        )}

        {/* Paso 3: Datos personales */}
        {paso === 3 && (
          <div>
            <p className="text-zinc-500 text-xs tracking-widest uppercase mb-4">Tus datos</p>
            <div className="mb-4">
              <p className="text-zinc-500 text-xs tracking-widest uppercase mb-3">Nombre</p>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="w-full bg-transparent border border-zinc-700 rounded-xl px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
              />
            </div>
            <div className="mb-4">
              <p className="text-zinc-500 text-xs tracking-widest uppercase mb-3">Email</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-transparent border border-zinc-700 rounded-xl px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
              />
            </div>
            <div className="mb-8">
              <p className="text-zinc-500 text-xs tracking-widest uppercase mb-3">Notas (opcional)</p>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Alguna petición especial..."
                className="w-full bg-transparent border border-zinc-700 rounded-xl px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors resize-none h-24"
              />
            </div>
            <button
              onClick={confirmarReserva}
              disabled={!nombre || !email || enviando}
              className="w-full bg-white text-black font-semibold rounded-xl py-4 disabled:opacity-30"
            >
              {enviando ? 'Confirmando...' : 'Confirmar reserva'}
            </button>
            <button onClick={() => setPaso(2)} className="w-full mt-4 text-zinc-500 text-xs tracking-widest uppercase">
              Volver
            </button>
            {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
          </div>
        )}

      </div>
    </main>
  )
}