'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const Scanner = dynamic(() => import('./scanner'), { ssr: false })

export default function AdminPanel() {
  const { slug } = useParams()

  const [pin, setPin] = useState('')
  const [pinVerificado, setPinVerificado] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)
  const [restaurante, setRestaurante] = useState<any>(null)
  const [cliente, setCliente] = useState<any>(null)
  const [card, setCard] = useState<any>(null)
  const [escaneando, setEscaneando] = useState(false)

  useEffect(() => {
    async function cargarRestaurante() {
      const { data: rest } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single()
      setRestaurante(rest)
    }
    cargarRestaurante()
  }, [slug])

  function verificarPin() {
    if (restaurante && pin === restaurante.pin) {
      setPinVerificado(true)
    } else {
      setMensaje('PIN incorrecto')
    }
  }

  async function handleScan(url: string) {
    if (cargando) return
    setEscaneando(false)
    setCargando(true)
    setMensaje('')
    setCliente(null)
    setCard(null)

    try {
      const urlObj = new URL(url)
      const clienteId = urlObj.searchParams.get('cliente')

      if (!clienteId) {
        setMensaje('QR no válido')
        setCargando(false)
        return
      }

      const { data: c } = await supabase
        .from('customers')
        .select('*')
        .eq('id', clienteId)
        .single()

      const { data: lc } = await supabase
        .from('loyalty_cards')
        .select('*')
        .eq('restaurant_id', restaurante.id)
        .eq('customer_id', clienteId)
        .single()

      setCliente(c)
      setCard(lc)
    } catch {
      setMensaje('QR no válido')
    }

    setCargando(false)
  }

  async function darSello() {
    if (!card || !restaurante) return
    setCargando(true)
    setMensaje('')

    const nuevosSellos = card.sellos_actuales + 1
    const completa = nuevosSellos >= restaurante.sellos_necesarios

    await supabase
      .from('loyalty_cards')
      .update({ sellos_actuales: completa ? 0 : nuevosSellos })
      .eq('id', card.id)

    await supabase.from('stamp_events').insert({ card_id: card.id, tipo: 'sello' })

    if (completa) {
      await supabase.from('stamp_events').insert({ card_id: card.id, tipo: 'canje' })
      setMensaje('🎉 Tarjeta completa — premio canjeado')
      setCard({ ...card, sellos_actuales: 0 })
    } else {
      setMensaje(`✓ Sello dado — ahora tiene ${nuevosSellos} de ${restaurante.sellos_necesarios}`)
      setCard({ ...card, sellos_actuales: nuevosSellos })
    }

    setCargando(false)
  }

  async function quitarSello() {
    if (!card || !restaurante) return
    setCargando(true)
    setMensaje('')

    const nuevosSellos = Math.max(0, card.sellos_actuales - 1)

    await supabase
      .from('loyalty_cards')
      .update({ sellos_actuales: nuevosSellos })
      .eq('id', card.id)

    setMensaje(`− Sello quitado — ahora tiene ${nuevosSellos} de ${restaurante.sellos_necesarios}`)
    setCard({ ...card, sellos_actuales: nuevosSellos })
    setCargando(false)
  }

  if (!restaurante) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white text-sm tracking-widest uppercase">Cargando</p>
    </div>
  )

  if (!pinVerificado) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-12">
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">Panel</p>
          <h1 className="text-white text-4xl font-bold leading-tight">PIN para dar sellos</h1>
        </div>
        <input
          type="number"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="****"
          className="w-full bg-transparent border border-zinc-700 rounded-xl px-4 py-4 text-white text-center text-2xl tracking-widest placeholder-zinc-600 focus:outline-none focus:border-white transition-colors mb-6"
        />
        <button
          onClick={verificarPin}
          disabled={!pin}
          className="w-full bg-white text-black font-semibold rounded-xl py-4 disabled:opacity-30"
        >
          Entrar
        </button>
        {mensaje && <p className="text-red-400 text-sm text-center mt-4">{mensaje}</p>}
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">Panel</p>
          <h1 className="text-white text-4xl font-bold leading-tight">{restaurante.nombre}</h1>
        </div>

        {!escaneando && !cliente && (
          <button
            onClick={() => { setEscaneando(true); setMensaje('') }}
            className="w-full bg-white text-black font-semibold rounded-xl py-4 mb-4"
          >
            Escanear QR del cliente
          </button>
        )}

        {escaneando && (
          <div className="mb-6">
            <Scanner onScan={handleScan} />
            <button
              onClick={() => setEscaneando(false)}
              className="w-full mt-4 text-zinc-500 text-xs tracking-widest uppercase"
            >
              Cancelar
            </button>
          </div>
        )}

        {cliente && card && (
          <>
            <div className="border border-zinc-800 rounded-xl p-5 mb-6">
              <p className="text-zinc-500 text-xs tracking-widest uppercase mb-1">Cliente</p>
              <p className="text-white text-lg font-medium">{cliente.email}</p>
              <p className="text-zinc-400 text-sm mt-1">{card.sellos_actuales} de {restaurante.sellos_necesarios} sellos</p>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={darSello}
                disabled={cargando}
                className="flex-1 bg-white text-black font-semibold rounded-xl py-4 disabled:opacity-30"
              >
                {cargando ? '...' : '+ Sello'}
              </button>
              <button
                onClick={quitarSello}
                disabled={cargando || card.sellos_actuales === 0}
                className="flex-1 bg-transparent border border-zinc-700 text-white font-semibold rounded-xl py-4 disabled:opacity-30"
              >
                {cargando ? '...' : '− Sello'}
              </button>
            </div>

            <button
              onClick={() => { setCliente(null); setCard(null); setMensaje('') }}
              className="w-full text-zinc-500 text-xs tracking-widest uppercase"
            >
              Escanear otro cliente
            </button>
          </>
        )}

        {mensaje && (
          <div className="mt-6 border border-zinc-700 rounded-xl p-4">
            <p className="text-white text-sm">{mensaje}</p>
          </div>
        )}
      </div>
    </main>
  )
}