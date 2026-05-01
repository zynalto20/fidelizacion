'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const router = useRouter()

  async function handleReset() {
    setCargando(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Error: ' + error.message)
    } else {
      setMensaje('Contraseña cambiada correctamente')
      setTimeout(() => router.push('/dashboard/login'), 2000)
    }

    setCargando(false)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-12">
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">Panel de gestión</p>
          <h1 className="text-white text-4xl font-bold leading-tight">Nueva contraseña</h1>
        </div>

        <div className="mb-8">
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-3">Nueva contraseña</p>
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
          onClick={handleReset}
          disabled={!password || cargando}
          className="w-full bg-white text-black font-semibold rounded-xl py-4 disabled:opacity-30 transition-opacity"
        >
          {cargando ? 'Guardando...' : 'Cambiar contraseña'}
        </button>

        {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
        {mensaje && <p className="text-green-400 text-sm text-center mt-4">{mensaje}</p>}
      </div>
    </div>
  )
}