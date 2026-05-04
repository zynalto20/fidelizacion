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
  const [perfil, setPerfil] = useState<any>(null)
  const [editandoPerfil, setEditandoPerfil] = useState(false)
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)
  const [form, setForm] = useState({ nombre: '', apellidos: '', telefono_nuevo: '', dni: '', direccion: '' })

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      setSesion(session)

      const { data } = await supabase.from('restaurants').select('*').eq('slug', slug).single()
      setRestaurante(data)
      setCargando(false)

      if (session && data) {
        const { data: card } = await supabase.from('loyalty_cards').select('*').eq('restaurant_id', data.id).eq('customer_id', session.user.id).single()
        if (card) {
          setSellos(card.sellos_actuales)
        } else {
          await supabase.from('loyalty_cards').insert({ restaurant_id: data.id, customer_id: session.user.id, sellos_actuales: 0 })
        }

        const { data: customerData } = await supabase.from('customers').select('*').eq('id', session.user.id).single()
        if (customerData) {
          setPerfil(customerData)
          setForm({
            nombre: customerData.nombre || '',
            apellidos: customerData.apellidos || '',
            telefono_nuevo: customerData.telefono_nuevo || '',
            dni: customerData.dni || '',
            direccion: customerData.direccion || ''
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

  async function guardarPerfil() {
    if (!sesion) return
    setGuardandoPerfil(true)
    await supabase.from('customers').update(form).eq('id', sesion.user.id)
    setPerfil({ ...perfil, ...form })
    setEditandoPerfil(false)
    setGuardandoPerfil(false)
  }

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
      <p className="text-white text-sm tracking-widest uppercase">Cargando</p>
    </div>
  )

  if (!sesion) return <Login slug={slug as string} />

  if (!restaurante) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
      <p className="text-white text-sm tracking-widest uppercase">Restaurante no encontrado</p>
    </div>
  )

  const fondo = restaurante.color_fondo || '#000000'
  const texto = restaurante.color_texto || '#ffffff'
  const boton = restaurante.color_boton || '#ffffff'
  const botonTexto = restaurante.color_boton_texto || '#000000'
  const primario = restaurante.color_primario || '#ffffff'
  const sellosNecesarios = restaurante.sellos_necesarios
  const completa = sellos >= sellosNecesarios

  const fondoClaro = (() => {
    try {
      const r = parseInt(fondo.slice(1, 3), 16)
      const g = parseInt(fondo.slice(3, 5), 16)
      const b = parseInt(fondo.slice(5, 7), 16)
      return (r * 299 + g * 587 + b * 114) / 1000 > 128
    } catch { return false }
  })()
  const textoSec = fondoClaro ? '#64748b' : 'rgba(255,255,255,0.5)'
  const borde = fondoClaro ? '#e2e8f0' : 'rgba(255,255,255,0.15)'

  if (editandoPerfil) return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: fondo }}>
      <div className="w-full max-w-sm">
        <button onClick={() => setEditandoPerfil(false)} className="mb-6 text-xs tracking-widest uppercase" style={{ color: textoSec }}>← Volver</button>
        <div className="mb-8">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: textoSec }}>Mi perfil</p>
          <h1 className="text-3xl font-bold" style={{ color: texto }}>Mis datos</h1>
        </div>

        {[
          { label: 'Nombre', key: 'nombre', type: 'text', placeholder: 'Tu nombre' },
          { label: 'Apellidos', key: 'apellidos', type: 'text', placeholder: 'Tus apellidos' },
          { label: 'Teléfono', key: 'telefono_nuevo', type: 'tel', placeholder: '600 000 000' },
          { label: 'DNI', key: 'dni', type: 'text', placeholder: '12345678A' },
          { label: 'Dirección', key: 'direccion', type: 'text', placeholder: 'Tu dirección' },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key} className="mb-4">
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: textoSec }}>{label}</p>
            <input
              type={type}
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full bg-transparent rounded-xl px-4 py-4 focus:outline-none text-sm"
              style={{ border: `1px solid ${borde}`, color: texto }}
            />
          </div>
        ))}

        <button
          onClick={guardarPerfil}
          disabled={guardandoPerfil}
          className="w-full font-semibold rounded-xl py-4 mt-4 disabled:opacity-30"
          style={{ background: boton, color: botonTexto }}
        >
          {guardandoPerfil ? 'Guardando...' : 'Guardar datos'}
        </button>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: fondo }}>
      <div className="w-full max-w-sm">

        <div className="mb-12">
          {restaurante.logo_url && <img src={restaurante.logo_url} alt={restaurante.nombre} className="h-16 object-contain mb-6" />}
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: primario, opacity: 0.7 }}>Tarjeta de fidelización</p>
          <h1 className="text-4xl font-bold leading-tight" style={{ color: texto }}>{restaurante.nombre}</h1>
        </div>

        <div className="grid grid-cols-5 gap-2 mb-10">
          {Array.from({ length: sellosNecesarios }).map((_, i) => (
            <div key={i} className="aspect-square rounded-full border-2 flex items-center justify-center transition-all" style={{ background: i < sellos ? primario : 'transparent', borderColor: i < sellos ? primario : `${texto}30` }}>
              {i < sellos && <div className="w-2 h-2 rounded-full" style={{ background: fondo }} />}
            </div>
          ))}
        </div>

        <div className="flex items-end justify-between mb-10 pt-6" style={{ borderTop: `1px solid ${texto}20` }}>
          <div>
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Sellos</p>
            <p className="text-5xl font-bold" style={{ color: texto }}>{sellos}<span className="text-2xl" style={{ color: textoSec }}>/{sellosNecesarios}</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Premio</p>
            <p className="text-lg font-medium" style={{ color: texto }}>{restaurante.recompensa}</p>
          </div>
        </div>

        <div className="flex flex-col items-center mb-10">
          <p className="text-xs tracking-widest uppercase mb-4" style={{ color: textoSec }}>Tu QR personal</p>
          <div className="p-4 rounded-2xl" style={{ background: '#ffffff' }}>
            <QRCode value={`https://app.zynalto.com/admin/${slug}?cliente=${sesion.user.id}`} size={160} bgColor="#ffffff" fgColor="#000000" />
          </div>
          <p className="text-xs mt-3" style={{ color: textoSec }}>Muéstraselo al empleado</p>
        </div>

        {completa && (
          <div className="rounded-2xl p-5 text-center mb-6" style={{ border: `2px solid ${primario}` }}>
            <p className="text-lg font-semibold mb-1" style={{ color: texto }}>Tarjeta completa</p>
            <p className="text-sm" style={{ color: textoSec }}>Muéstrasela al empleado para canjear tu premio</p>
          </div>
        )}

        <button onClick={() => setEditandoPerfil(true)} className="w-full py-3 rounded-xl text-xs tracking-widest uppercase mb-3" style={{ border: `1px solid ${borde}`, color: textoSec }}>
          {perfil?.nombre ? `${perfil.nombre} · Editar perfil` : 'Completar mi perfil'}
        </button>

        <button onClick={() => supabase.auth.signOut()} className="w-full mt-2 text-xs tracking-widest uppercase" style={{ color: textoSec }}>
          Cerrar sesión
        </button>

      </div>
    </main>
  )
}