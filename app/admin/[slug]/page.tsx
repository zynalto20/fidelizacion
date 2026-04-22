'use client'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams } from 'next/navigation'

export default function AdminPanel() {
  const { slug } = useParams()
  const [email, setEmail] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  async function darSello() {
    setCargando(true)
    setMensaje('')

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single()

    if (customerError || !customer) {
      setMensaje('Cliente no encontrado')
      setCargando(false)
      return
    }

    const { data: restaurante } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!restaurante) {
      setMensaje('Restaurante no encontrado')
      setCargando(false)
      return
    }

    const { data: card } = await supabase
      .from('loyalty_cards')
      .select('*')
      .eq('restaurant_id', restaurante.id)
      .eq('customer_id', customer.id)
      .single()

    if (!card) {
      setMensaje('El cliente no tiene tarjeta en este restaurante')
      setCargando(false)
      return
    }

    const nuevosSellos = card.sellos_actuales + 1
    const completa = nuevosSellos >= restaurante.sellos_necesarios

    await supabase
      .from('loyalty_cards')
      .update({ sellos_actuales: completa ? 0 : nuevosSellos })
      .eq('id', card.id)

    await supabase.from('stamp_events').insert({
      card_id: card.id,
      tipo: 'sello'
    })

    if (completa) {
      await supabase.from('stamp_events').insert({
        card_id: card.id,
        tipo: 'canje'
      })
      setMensaje('🎉 Tarjeta completa — premio canjeado y tarjeta reiniciada')
    } else {
      setMensaje(`✓ Sello dado — ahora tiene ${nuevosSellos} de ${restaurante.sellos_necesarios}`)
    }

    setCargando(false)
    setEmail('')
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-12">
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">Panel</p>
          <h1 className="text-white text-4xl font-bold leading-tight">Dar sello</h1>
        </div>

        <div className="mb-6">
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-3">Email del cliente</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@ejemplo.com"
            className="w-full bg-transparent border border-zinc-700 rounded-xl px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
          />
        </div>

        <button
          onClick={darSello}
          disabled={!email || cargando}
          className="w-full bg-white text-black font-semibold rounded-xl py-4 disabled:opacity-30 transition-opacity"
        >
          {cargando ? 'Procesando...' : 'Dar sello'}
        </button>

        {mensaje && (
          <div className="mt-6 border border-zinc-700 rounded-xl p-4">
            <p className="text-white text-sm">{mensaje}</p>
          </div>
        )}
      </div>
    </main>
  )
}