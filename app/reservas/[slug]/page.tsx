'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS = ['Lu','Ma','Mi','Ju','Vi','Sá','Do']

const HORAS_DISPONIBLES = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','16:00','16:30',
  '17:00','17:30','18:00','18:30','19:00','19:30'
]

export default function Reservas() {
  const { slug } = useParams()
  const [restaurante, setRestaurante] = useState<any>(null)
  const [servicios, setServicios] = useState<any[]>([])
  const [paso, setPaso] = useState(1)
  const [servicioSeleccionado, setServicioSeleccionado] = useState<any>(null)
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [notas, setNotas] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [confirmado, setConfirmado] = useState(false)
  const [error, setError] = useState('')
  const [mesActual, setMesActual] = useState(new Date())

  useEffect(() => {
    async function cargar() {
      const { data: rest } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single()
      setRestaurante(rest)

      const { data: svcs } = await supabase
        .from('services')
        .select('*')
        .eq('restaurant_id', rest?.id)
        .eq('activo', true)
      setServicios(svcs || [])
    }
    cargar()
  }, [slug])

  function getDiasDelMes() {
    const year = mesActual.getFullYear()
    const month = mesActual.getMonth()
    const primerDia = new Date(year, month, 1).getDay()
    const diasEnMes = new Date(year, month + 1, 0).getDate()
    const offset = primerDia === 0 ? 6 : primerDia - 1
    return { diasEnMes, offset, year, month }
  }

  function seleccionarFecha(dia: number) {
    const { year, month } = getDiasDelMes()
    const d = new Date(year, month, dia)
    const hoy = new Date()
    hoy.setHours(0,0,0,0)
    if (d < hoy) return
    const str = `${year}-${String(month+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
    setFecha(str)
    setHora('')
  }

  function formatearFecha(f: string) {
    if (!f) return ''
    const [y, m, d] = f.split('-')
    return `${d} de ${MESES[parseInt(m)-1]} de ${y}`
  }

  async function confirmarReserva() {
    setEnviando(true)
    setError('')

    const { error } = await supabase.from('bookings').insert({
      restaurant_id: restaurante.id,
      customer_name: nombre,
      customer_email: email,
      servicio: servicioSeleccionado?.nombre || 'General',
      fecha,
      hora,
      notas,
      estado: 'pendiente'
    })

    if (error) {
      setError('Error al crear la reserva')
    } else {
      setConfirmado(true)
    }
    setEnviando(false)
  }

  if (!restaurante) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white text-sm tracking-widest uppercase">Cargando</p>
    </div>
  )

  const fondo = restaurante.color_fondo || '#000000'
  const texto = restaurante.color_texto || '#ffffff'
  const boton = restaurante.color_boton || '#ffffff'
  const botonTexto = restaurante.color_boton_texto || '#000000'
  const primario = restaurante.color_primario || '#ffffff'

  if (confirmado) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: fondo }}>
      <div className="w-full max-w-sm text-center">
        <p className="text-5xl mb-6" style={{ color: primario }}>✓</p>
        <h1 className="text-3xl font-bold mb-4" style={{ color: texto }}>Reserva confirmada</h1>
        <div className="rounded-xl p-5 mt-8 text-left" style={{ border: `1px solid ${texto}20` }}>
          <p className="text-xs tracking-widest uppercase mb-3" style={{ color: `${texto}50` }}>Detalle</p>
          <p className="font-medium" style={{ color: texto }}>{restaurante.nombre}</p>
          <p className="text-sm mt-1" style={{ color: `${texto}60` }}>{servicioSeleccionado?.nombre || 'General'}</p>
          <p className="text-sm mt-1" style={{ color: `${texto}60` }}>{formatearFecha(fecha)} · {hora}</p>
        </div>
      </div>
    </div>
  )

  const { diasEnMes, offset, year, month } = getDiasDelMes()
  const hoy = new Date()
  hoy.setHours(0,0,0,0)

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: fondo }}>
      <div className="w-full max-w-sm">

        <div className="mb-10">
          {restaurante.logo_url && (
            <img src={restaurante.logo_url} alt={restaurante.nombre} className="h-12 object-contain mb-6" />
          )}
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: `${texto}60` }}>Reservas</p>
          <h1 className="text-4xl font-bold leading-tight" style={{ color: texto }}>{restaurante.nombre}</h1>
        </div>

        {/* Paso 1: Servicio */}
        {paso === 1 && (
          <div>
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: `${texto}60` }}>Elige el servicio</p>
            {servicios.length === 0 ? (
              <button
                onClick={() => { setServicioSeleccionado(null); setPaso(2) }}
                className="w-full rounded-xl p-4 text-left mb-3 transition-colors"
                style={{ border: `1px solid ${texto}30`, color: texto }}
              >
                <p className="font-medium">Reserva general</p>
              </button>
            ) : (
              servicios.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setServicioSeleccionado(s); setPaso(2) }}
                  className="w-full rounded-xl p-4 text-left mb-3 transition-colors"
                  style={{ border: `1px solid ${texto}30`, color: texto }}
                >
                  <p className="font-medium">{s.nombre}</p>
                  <div className="flex gap-4 mt-1">
                    {s.duracion_minutos && <p className="text-sm" style={{ color: `${texto}50` }}>{s.duracion_minutos} min</p>}
                    {s.precio && <p className="text-sm" style={{ color: `${texto}50` }}>{s.precio}€</p>}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Paso 2: Calendario */}
        {paso === 2 && (
          <div>
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: `${texto}60` }}>Elige una fecha</p>

            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth()-1, 1))} className="text-xl px-2" style={{ color: `${texto}60` }}>‹</button>
              <p className="font-medium" style={{ color: texto }}>{MESES[mesActual.getMonth()]} {mesActual.getFullYear()}</p>
              <button onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth()+1, 1))} className="text-xl px-2" style={{ color: `${texto}60` }}>›</button>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {DIAS.map(d => (
                <div key={d} className="text-center text-xs py-1" style={{ color: `${texto}40` }}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 mb-6">
              {Array.from({ length: offset }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: diasEnMes }).map((_, i) => {
                const dia = i + 1
                const diaDate = new Date(year, month, dia)
                const pasado = diaDate < hoy
                const strDia = `${year}-${String(month+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
                const seleccionado = fecha === strDia
                return (
                  <button
                    key={dia}
                    onClick={() => seleccionarFecha(dia)}
                    disabled={pasado}
                    className="aspect-square rounded-full flex items-center justify-center text-sm transition-colors"
                    style={{
                      background: seleccionado ? primario : 'transparent',
                      color: pasado ? `${texto}20` : seleccionado ? botonTexto : texto,
                      cursor: pasado ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {dia}
                  </button>
                )
              })}
            </div>

            {fecha && (
              <div>
                <p className="text-xs tracking-widest uppercase mb-3" style={{ color: `${texto}60` }}>Elige una hora</p>
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {HORAS_DISPONIBLES.map(h => (
                    <button
                      key={h}
                      onClick={() => setHora(h)}
                      className="py-3 rounded-xl text-sm font-medium transition-colors"
                      style={{
                        background: hora === h ? primario : 'transparent',
                        color: hora === h ? botonTexto : texto,
                        border: `1px solid ${hora === h ? primario : `${texto}30`}`
                      }}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setPaso(3)}
              disabled={!fecha || !hora}
              className="w-full font-semibold rounded-xl py-4 transition-opacity disabled:opacity-30"
              style={{ background: boton, color: botonTexto }}
            >
              Continuar
            </button>
            <button onClick={() => setPaso(1)} className="w-full mt-4 text-xs tracking-widest uppercase" style={{ color: `${texto}40` }}>
              Volver
            </button>
          </div>
        )}

        {/* Paso 3: Datos */}
        {paso === 3 && (
          <div>
            <div className="rounded-xl p-4 mb-6" style={{ border: `1px solid ${texto}20` }}>
              <p className="text-xs tracking-widest uppercase mb-2" style={{ color: `${texto}50` }}>Tu reserva</p>
              <p className="font-medium" style={{ color: texto }}>{servicioSeleccionado?.nombre || 'General'}</p>
              <p className="text-sm mt-1" style={{ color: `${texto}60` }}>{formatearFecha(fecha)} · {hora}</p>
            </div>

            <div className="mb-4">
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: `${texto}60` }}>Nombre</p>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="w-full bg-transparent rounded-xl px-4 py-4 focus:outline-none transition-colors"
                style={{ border: `1px solid ${texto}30`, color: texto }}
              />
            </div>
            <div className="mb-4">
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: `${texto}60` }}>Email</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-transparent rounded-xl px-4 py-4 focus:outline-none transition-colors"
                style={{ border: `1px solid ${texto}30`, color: texto }}
              />
            </div>
            <div className="mb-8">
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: `${texto}60` }}>Notas (opcional)</p>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Alguna petición especial..."
                className="w-full bg-transparent rounded-xl px-4 py-4 focus:outline-none transition-colors resize-none h-24"
                style={{ border: `1px solid ${texto}30`, color: texto }}
              />
            </div>

            <button
              onClick={confirmarReserva}
              disabled={!nombre || !email || enviando}
              className="w-full font-semibold rounded-xl py-4 disabled:opacity-30"
              style={{ background: boton, color: botonTexto }}
            >
              {enviando ? 'Confirmando...' : 'Confirmar reserva'}
            </button>
            <button onClick={() => setPaso(2)} className="w-full mt-4 text-xs tracking-widest uppercase" style={{ color: `${texto}40` }}>
              Volver
            </button>
            {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
          </div>
        )}

      </div>
    </main>
  )
}