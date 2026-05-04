'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Login({ slug }: { slug: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [modo, setModo] = useState<'login' | 'registro' | 'reset'>('login')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [restaurante, setRestaurante] = useState<any>(null)

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single()
      setRestaurante(data)
    }
    cargar()
  }, [slug])

  const fondo = restaurante?.color_fondo || '#000000'
  const texto = restaurante?.color_texto || '#ffffff'
  const boton = restaurante?.color_boton || '#ffffff'
  const botonTexto = restaurante?.color_boton_texto || '#000000'
  const primario = restaurante?.color_primario || '#ffffff'

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
      options: { emailRedirectTo: `https://app.zynalto.com/r/${slug}` }
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: fondo }}>
      <div className="w-full max-w-sm">
        <div className="mb-12">
          {restaurante?.logo_url && <img src={restaurante.logo_url} alt={restaurante.nombre} className="h-12 object-contain mb-6" />}
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: `${texto}60` }}>Tarjeta de fidelización</p>
          <h1 className="text-4xl font-bold leading-tight" style={{ color: texto }}>Recuperar contraseña</h1>
        </div>
        <div className="mb-6">
          <p className="text-xs tracking-widest uppercase mb-3" style={{ color: `${texto}60` }}>Tu email</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hola@ejemplo.com"
            className="w-full bg-transparent rounded-xl px-4 py-4 focus:outline-none transition-colors"
            style={{ border: `1px solid ${texto}30`, color: texto }}
          />
        </div>
        <button
          onClick={handleReset}
          disabled={!email || cargando}
          className="w-full font-semibold rounded-xl py-4 disabled:opacity-30"
          style={{ background: boton, color: botonTexto }}
        >
          {cargando ? 'Enviando...' : 'Enviar email'}
        </button>
        <button onClick={() => setModo('login')} className="w-full mt-4 text-xs tracking-widest uppercase" style={{ color: `${texto}40` }}>
          Volver
        </button>
        {mensaje && <p className="text-sm text-center mt-4" style={{ color: primario }}>{mensaje}</p>}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: fondo }}>
      <div className="w-full max-w-sm">
        <div className="mb-12">
          {restaurante?.logo_url && <img src={restaurante.logo_url} alt={restaurante.nombre} className="h-12 object-contain mb-6" />}
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: `${texto}60` }}>Tarjeta de fidelización</p>
          <h1 className="text-4xl font-bold leading-tight" style={{ color: texto }}>
            {modo === 'login' ? 'Accede a tu tarjeta' : 'Crear cuenta'}
          </h1>
        </div>

        <div className="mb-4">
          <p className="text-xs tracking-widest uppercase mb-3" style={{ color: `${texto}60` }}>Email</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hola@ejemplo.com"
            className="w-full bg-transparent rounded-xl px-4 py-4 focus:outline-none transition-colors"
            style={{ border: `1px solid ${texto}30`, color: texto }}
          />
        </div>

        <div className="mb-8">
          <p className="text-xs tracking-widest uppercase mb-3" style={{ color: `${texto}60` }}>Contraseña</p>
          <div className="relative">
            <input
              type={mostrarPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent rounded-xl px-4 py-4 pr-12 focus:outline-none transition-colors"
              style={{ border: `1px solid ${texto}30`, color: texto }}
            />
            <button
              type="button"
              onClick={() => setMostrarPassword(!mostrarPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs tracking-widest uppercase"
              style={{ color: `${texto}40` }}
            >
              {mostrarPassword ? 'Ocultar' : 'Ver'}
            </button>
          </div>
        </div>

        <button
          onClick={modo === 'login' ? handleLogin : handleRegistro}
          disabled={!email || !password || cargando}
          className="w-full font-semibold rounded-xl py-4 disabled:opacity-30"
          style={{ background: boton, color: botonTexto }}
        >
          {cargando ? '...' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>

        {modo === 'login' && (
          <>
            <button onClick={() => setModo('registro')} className="w-full mt-4 text-xs tracking-widest uppercase" style={{ color: `${texto}40` }}>
              ¿No tienes cuenta? Regístrate
            </button>
            <button onClick={() => setModo('reset')} className="w-full mt-2 text-xs tracking-widest uppercase" style={{ color: `${texto}40` }}>
              Olvidé mi contraseña
            </button>
          </>
        )}

        {modo === 'registro' && (
          <button onClick={() => setModo('login')} className="w-full mt-4 text-xs tracking-widest uppercase" style={{ color: `${texto}40` }}>
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        )}

        {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
        {mensaje && <p className="text-sm text-center mt-4" style={{ color: primario }}>{mensaje}</p>}
      </div>
    </div>
  )
}