'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Login({ slug }: { slug: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [modo, setModo] = useState<'login' | 'registro' | 'reset'>('login')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleLogin() {
    setCargando(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email o contraseña incorrectos')
    setCargando(false)
  }

  async function handleRegistro() {
    setCargando(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `https://app.zynalto.com/r/${slug}`
      }
    })
    if (error) {
      setError(error.message)
    } else {
      setMensaje('Cuenta creada. Ya puedes iniciar sesión.')
      setModo('login')
    }
    setCargando(false)
  }

  async function handleReset() {
    setCargando(true)
    setError('')
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://app.zynalto.com/r/${slug}`
    })
    setMensaje('Te hemos enviado un email para restablecer tu contraseña')
    setCargando(false)
  }

  if (modo === 'reset') return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-12">
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">Tarjeta de fidelización</p>
          <h1 className="text-white text-4xl font-bold leading-tight">Recuperar contraseña</h1>
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
          onClick={handleReset}
          disabled={!email || cargando}
          className="w-full bg-white text-black font-semibold rounded-xl py-4 disabled:opacity-30"
        >
          {cargando ? 'Enviando...' : 'Enviar email'}
        </button>
        <button onClick={() => setModo('login')} className="w-full mt-4 text-zinc-500 text-xs tracking-widest uppercase">
          Volver
        </button>
        {mensaje && <p className="text-green-400 text-sm text-center mt-4">{mensaje}</p>}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-12">
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">Tarjeta de fidelización</p>
          <h1 className="text-white text-4xl font-bold leading-tight">
            {modo === 'login' ? 'Accede a tu tarjeta' : 'Crear cuenta'}
          </h1>
        </div>

        <div className="mb-4">
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-3">Email</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hola@ejemplo.com"
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
          onClick={modo === 'login' ? handleLogin : handleRegistro}
          disabled={!email || !password || cargando}
          className="w-full bg-white text-black font-semibold rounded-xl py-4 disabled:opacity-30"
        >
          {cargando ? '...' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>

        {modo === 'login' && (
          <>
            <button onClick={() => setModo('registro')} className="w-full mt-4 text-zinc-500 text-xs tracking-widest uppercase">
              ¿No tienes cuenta? Regístrate
            </button>
            <button onClick={() => setModo('reset')} className="w-full mt-2 text-zinc-500 text-xs tracking-widest uppercase">
              Olvidé mi contraseña
            </button>
          </>
        )}

        {modo === 'registro' && (
          <button onClick={() => setModo('login')} className="w-full mt-4 text-zinc-500 text-xs tracking-widest uppercase">
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        )}

        {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
        {mensaje && <p className="text-green-400 text-sm text-center mt-4">{mensaje}</p>}
      </div>
    </div>
  )
}