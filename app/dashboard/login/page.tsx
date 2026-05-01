'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const router = useRouter()

  async function handleLogin() {
    setCargando(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos')
      setCargando(false)
      return
    }

    const { data: restaurante } = await supabase
      .from('restaurants')
      .select('slug')
      .eq('owner_id', data.user.id)
      .single()

    if (restaurante) {
      router.push(`/dashboard/${restaurante.slug}`)
    } else {
      setError('No tienes ningún restaurante asociado')
      setCargando(false)
    }
  }

  async function olvidéContraseña() {
    if (!email) {
      setError('Introduce tu email primero')
      return
    }
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://fidelizacion-eta.vercel.app/dashboard/reset'
    })
    setError('')
    setMensaje('Te hemos enviado un email para restablecer tu contraseña')
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-12">
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">Panel de gestión</p>
          <h1 className="text-white text-4xl font-bold leading-tight">Accede a tu negocio</h1>
        </div>

        <div className="mb-4">
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-3">Email</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hola@tunegocio.com"
            className="w-full bg-transparent border border-zinc-700 rounded-xl px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
          />
        </div>

        <div className="mb-8">
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-3">Contraseña</p>
          <div className="relative">
            <input
              type={mostrarPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent border border-zinc-700 rounded-xl px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors pr-12"
            />
            <button
              type="button"
              onClick={() => setMostrarPassword(!mostrarPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs tracking-widest uppercase"
            >
              {mostrarPassword ? 'Ocultar' : 'Ver'}
            </button>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={!email || !password || cargando}
          className="w-full bg-white text-black font-semibold rounded-xl py-4 disabled:opacity-30 transition-opacity"
        >
          {cargando ? 'Entrando...' : 'Entrar'}
        </button>

        <button
          type="button"
          onClick={olvidéContraseña}
          className="w-full mt-4 text-zinc-500 text-xs tracking-widest uppercase"
        >
          Olvidé mi contraseña
        </button>

        {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
        {mensaje && <p className="text-green-400 text-sm text-center mt-4">{mensaje}</p>}
      </div>
    </div>
  )
}