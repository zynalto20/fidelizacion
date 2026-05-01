'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Login({ slug }: { slug: string }) {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [cargando, setCargando] = useState(false)

  async function handleLogin() {
    setCargando(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
            emailRedirectTo: `https://app.zynalto.com/r/${slug}`      }
    })
    if (!error) setEnviado(true)
    setCargando(false)
  }

  if (enviado) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <p className="text-white text-3xl font-bold mb-4">Revisa tu email</p>
        <p className="text-zinc-400 text-sm">Te hemos enviado un enlace a <span className="text-white">{email}</span>. Haz clic en él para ver tu tarjeta.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-12">
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">Bienvenido</p>
          <h1 className="text-white text-4xl font-bold leading-tight">Accede a tu tarjeta</h1>
        </div>

        <div className="mb-6">
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-3">Tu email</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hola@ejemplo.com"
            className="w-full bg-transparent border border-zinc-700 rounded-xl px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={!email || cargando}
          className="w-full bg-white text-black font-semibold rounded-xl py-4 disabled:opacity-30 transition-opacity"
        >
          {cargando ? 'Enviando...' : 'Continuar'}
        </button>

        <p className="text-zinc-600 text-xs text-center mt-6">Te enviaremos un enlace mágico. Sin contraseña.</p>
      </div>
    </div>
  )
}