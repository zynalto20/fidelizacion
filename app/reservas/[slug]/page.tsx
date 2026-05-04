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
                    {s.duracion_minutos && <p className="text-zinc-500