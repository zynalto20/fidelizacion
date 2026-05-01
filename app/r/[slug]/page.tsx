'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { QRCodeSVG as QRCode } from 'qrcode.react'
import { supabase } from '../../lib/supabase'
import Login from './login'

export default function TarjetaRestaurante() {
  const { slug } = useParams()
  const [restaurante, setRestaurante] = useState<any>(null)
  const [sesion, setSesion] = useState<any>(null)
  const [sellos, setSellos] = useState(0)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      setSesion(session)

      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single()
      setRestaurante(data)
      setCargando(false)

      if (session && data) {
        const { data: card } = await supabase
          .from('loyalty_cards')
          .select('*')
          .eq('restaurant_id', data.id)
          .eq('customer_id', session.user.id)
          .single()

        if (card) {
          setSellos(card.sellos_actuales)
        } else {
          await supabase.from('loyalty_cards').insert({
            restaurant_id: data.id,
            customer_id: session.user.id,
            sellos_actuales: 0
          })
        }
      }
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSesion(session)
      if (session) init()
    })

    return () => subscription.unsubscribe()
  }, [slug])

  if (cargando) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white text-sm tracking-widest uppercase">Cargando</p>
    </div>
  )

  if (!sesion) return <Login slug={slug as string} />

  if (!restaurante) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white text-sm tracking-widest uppercase">Restaurante no encontrado</p>
    </div>
  )

  const sellosNecesarios = restaurante.sellos_necesarios
  const completa = sellos >= sellosNecesarios

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">

        <div className="mb-12">
          {restaurante.logo_url && (
            <img src={restaurante.logo_url} alt={restaurante.nombre} className="h-16 object-contain mb-6" />
          )}
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">Tarjeta de fidelización</p>
          <h1 className="text-white text-4xl font-bold leading-tight">{restaurante.nombre}</h1>
        </div>

        <div className="grid grid-cols-5 gap-2 mb-10">
          {Array.from({ length: sellosNecesarios }).map((_, i) => (
            <div key={i} className={`aspect-square rounded-full border flex items-center justify-center transition-all ${i < sellos ? 'bg-white border-white' : 'bg-transparent border-zinc-700'}`}>
              {i < sellos && <div className="w-2 h-2 rounded-full bg-black" />}
            </div>
          ))}
        </div>

        <div className="flex items-end justify-between mb-10 border-t border-zinc-800 pt-6">
          <div>
            <p className="text-zinc-500 text-xs tracking-widest uppercase mb-1">Sellos</p>
            <p className="text-white text-5xl font-bold">{sellos}<span className="text-zinc-600 text-2xl">/{sellosNecesarios}</span></p>
          </div>
          <div className="text-right">
            <p className="text-zinc-500 text-xs tracking-widest uppercase mb-1">Premio</p>
            <p className="text-white text-lg font-medium">{restaurante.recompensa}</p>
          </div>
        </div>

        <div className="flex flex-col items-center mb-10">
  <p className="text-zinc-500 text-xs tracking-widest uppercase mb-4">Tu QR personal</p>
  <div className="bg-white p-4 rounded-2xl">
    <QRCode
      value={`https://app.zynalto.com/admin/${slug}?cliente=${sesion.user.id}`}
      size={160}
      bgColor="#ffffff"
      fgColor="#000000"
    />
  </div>
  <p className="text-zinc-600 text-xs mt-3">Muéstraselo al camarero</p>
</div>

        {completa && (
          <div className="border border-white rounded-2xl p-5 text-center">
            <p className="text-white text-lg font-semibold mb-1">Tarjeta completa</p>
            <p className="text-zinc-400 text-sm">Muéstrasela al camarero para canjear tu premio</p>
          </div>
        )}

        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full mt-8 text-zinc-600 text-xs tracking-widest uppercase"
        >
          Cerrar sesión
        </button>

      </div>
    </main>
  )
}