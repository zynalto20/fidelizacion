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

  if (confirmado) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <p className="text-white text-5xl mb-6">✓</p>
        <h1 className="text-white text-3xl font-bold mb-4">Reserva confirmada</h1>
        <div className="border border-zinc-800 rounded-xl p-5 mt-8 text-left">
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-3">Detalle</p>
          <p className="text-white font-medium">{restaurante.nombre}</p>
          <p className="text-zinc-400 text-sm mt-1">{servicioSeleccionado?.nombre || 'General'}</p>
          <p className="text-zinc-400 text-sm mt-1">{formatearFecha(fecha)} · {hora}</p>
        </div>
      </div>
    </div>
  )

  const { diasEnMes, offset, year, month } = getDiasDelMes()
  const hoy = new Date()
  hoy.setHours(0,0,0,0)

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">

        <div className="mb-10">
          {restaurante.logo_url && (
            <img src={restaurante.logo_url} alt={restaurante.nombre} className="h-12 object-contain mb-6" />
          )}
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">Reservas</p>
          <h1 className="text-white text-4xl font-bold leading-tight">{restaurante.nombre}</h1>
        </div>

        {/* Paso 1: Servicio */}
        {paso === 1 && (
          <div>
            <p className="text-zinc-500 text-xs tracking-widest uppercase mb-4">Elige el servicio</p>
            {servicios.length === 0 ? (
              <button
                onClick={() => { setServicioSeleccionado(null); setPaso(2) }}
                className="w-full border border-zinc-700 rounded-xl p-4 text-left mb-3 hover:border-white transition-colors"
              >
                <p className="text-white font-medium">Reserva general</p>
              </button>
            ) : (
              servicios.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setServicioSeleccionado(s); setPaso(2) }}
                  className="w-full border border-zinc-700 rounded-xl p-4 text-left mb-3 hover:border-white transition-colors"
                >
                  <p className="text-white font-medium">{s.nombre}</p>
                  <div className="flex gap-4 mt-1">
                    {s.duracion_minutos && <p className="text-zinc-500 text-sm">{s.duracion_minutos} min</p>}
                    {s.precio && <p className="text-zinc-500 text-sm">{s.precio}€</p>}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Paso 2: Calendario */}
        {paso === 2 && (
          <div>
            <p className="text-zinc-500 text-xs tracking-widest uppercase mb-4">Elige una fecha</p>

            {/* Cabecera mes */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth()-1, 1))}
                className="text-zinc-400 text-xl px-2"
              >‹</button>
              <p className="text-white font-medium">{MESES[mesActual.getMonth()]} {mesActual.getFullYear()}</p>
              <button
                onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth()+1, 1))}
                className="text-zinc-400 text-xl px-2"
              >›</button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 mb-2">
              {DIAS.map(d => (
                <div key={d} className="text-center text-zinc-600 text-xs py-1">{d}</div>
              ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-1 mb-6">
              {Array.from({ length: offset }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
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
                    className={`aspect-square rounded-full flex items-center justify-center text-sm transition-colors
                      ${seleccionado ? 'bg-white text-black font-bold' :
                        pasado ? 'text-zinc-700 cursor-not-allowed' :
                        'text-white hover:bg-zinc-800'}`}
                  >
                    {dia}
                  </button>
                )
              })}
            </div>

            {/* Horas */}
            {fecha && (
              <div>
                <p className="text-zinc-500 text-xs tracking-widest uppercase mb-3">Elige una hora</p>
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {HORAS_DISPONIBLES.map(h => (
                    <button
                      key={h}
                      onClick={() => setHora(h)}
                      className={`py-3 rounded-xl text-sm font-medium transition-colors
                        ${hora === h ? 'bg-white text-black' : 'border border-zinc-700 text-white hover:border-white'}`}
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
              className="w-full bg-white text-black font-semibold rounded-xl py-4 disabled:opacity-30"
            >
              Continuar
            </button>
            <button onClick={() => setPaso(1)} className="w-full mt-4 text-zinc-500 text-xs tracking-widest uppercase">
              Volver
            </button>
          </div>
        )}

        {/* Paso 3: Datos */}
        {paso === 3 && (
          <div>
            <div className="border border-zinc-800 rounded-xl p-4 mb-6">
              <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">Tu reserva</p>
              <p className="text-white font-medium">{servicioSeleccionado?.nombre || 'General'}</p>
              <p className="text-zinc-400 text-sm mt-1">{formatearFecha(fecha)} · {hora}</p>
            </div>

            <div className="mb-4">
              <p className="text-zinc-500 text-xs tracking-widest uppercase mb-3">Nombre</p>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="w-full bg-transparent border border-zinc-700 rounded-xl px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
              />
            </div>
            <div className="mb-4">
              <p className="text-zinc-500 text-xs tracking-widest uppercase mb-3">Email</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-transparent border border-zinc-700 rounded-xl px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
              />
            </div>
            <div className="mb-8">
              <p className="text-zinc-500 text-xs tracking-widest uppercase mb-3">Notas (opcional)</p>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Alguna petición especial..."
                className="w-full bg-transparent border border-zinc-700 rounded-xl px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors resize-none h-24"
              />
            </div>

            <button
              onClick={confirmarReserva}
              disabled={!nombre || !email || enviando}
              className="w-full bg-white text-black font-semibold rounded-xl py-4 disabled:opacity-30"
            >
              {enviando ? 'Confirmando...' : 'Confirmar reserva'}
            </button>
            <button onClick={() => setPaso(2)} className="w-full mt-4 text-zinc-500 text-xs tracking-widest uppercase">
              Volver
            </button>
            {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
          </div>
        )}

      </div>
    </main>
  )
}