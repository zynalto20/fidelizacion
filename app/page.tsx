'use client'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function Home() {
  const [restaurante, setRestaurante] = useState(null)
  const [sellos, setSellos] = useState(3)

  useEffect(() => {
    async function cargarRestaurante() {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', 'bar-el-ejemplo')
        .single()
      setRestaurante(data)
    }
    cargarRestaurante()
  }, [])

  if (!restaurante) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white text-sm tracking-widest uppercase">Cargando</p>
    </div>
  )

  const sellosNecesarios = restaurante.sellos_necesarios
  const completa = sellos >= sellosNecesarios

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Cabecera */}
<div className="mb-12">
  {restaurante.logo_url && (
    <img
      src={restaurante.logo_url}
      alt={restaurante.nombre}
      className="h-16 object-contain mb-6"
    />
  )}
  <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">Tarjeta de fidelización</p>
  <h1 className="text-white text-4xl font-bold leading-tight">{restaurante.nombre}</h1>
</div>
        {/* Sellos */}
        <div className="grid grid-cols-5 gap-2 mb-10">
          {Array.from({ length: sellosNecesarios }).map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-full border flex items-center justify-center transition-all
                ${i < sellos
                  ? 'bg-white border-white'
                  : 'bg-transparent border-zinc-700'
                }`}
            >
              {i < sellos && (
                <div className="w-2 h-2 rounded-full bg-black" />
              )}
            </div>
          ))}
        </div>

        {/* Contador */}
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

        {/* Banner de tarjeta completa */}
        {completa && (
          <div className="border border-white rounded-2xl p-5 text-center">
            <p className="text-white text-lg font-semibold mb-1">Tarjeta completa</p>
            <p className="text-zinc-400 text-sm">Muéstrasela al camarero para canjear tu premio</p>
          </div>
        )}

      </div>
    </main>
  )
}