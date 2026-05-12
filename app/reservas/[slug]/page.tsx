'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const DIAS_CORTO = ['Lu','Ma','Mi','Ju','Vi','Sá','Do']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function Reservas() {
  const { slug } = useParams()
  const [restaurante, setRestaurante] = useState<any>(null)
  const [servicios, setServicios] = useState<any[]>([])
  const [horarios, setHorarios] = useState<any[]>([])
  const [reservas, setReservas] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [paso, setPaso] = useState(1)
  const [servicioSeleccionado, setServicioSeleccionado] = useState<any>(null)
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [mes, setMes] = useState(new Date())
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [notas, setNotas] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [confirmado, setConfirmado] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargar() {
      const { data: rest } = await supabase.from('restaurants').select('*').eq('slug', slug).single()
      if (!rest) { setCargando(false); return }
      setRestaurante(rest)
      const { data: svcs } = await supabase.from('services').select('*').eq('restaurant_id', rest.id).eq('activo', true).order('nombre')
      setServicios(svcs || [])
      const { data: hor } = await supabase.from('horarios').select('*').eq('restaurant_id', rest.id)
      setHorarios(hor || [])
      const { data: res } = await supabase.from('bookings').select('fecha, hora, servicio, estado').eq('restaurant_id', rest.id)
      setReservas(res || [])
      setCargando(false)
    }
    cargar()
  }, [slug])

  function getHorarioDia(diaSemana: number) {
    return horarios.filter(h => h.dia_semana === diaSemana && h.activo)
  }

  function generarHoras(diaSemana: number) {
    const hDia = horarios.filter(h => h.dia_semana === diaSemana && h.activo)
    if (hDia.length === 0) return []
    const horas: string[] = []
    hDia.forEach(franja => {
      if (!franja.hora_inicio || !franja.hora_fin) return
      const [hIni, mIni] = franja.hora_inicio.slice(0,5).split(':').map(Number)
      const [hFin, mFin] = franja.hora_fin.slice(0,5).split(':').map(Number)
      let mins = hIni * 60 + mIni
      const finMins = hFin * 60 + mFin
      while (mins < finMins) {
        horas.push(`${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`)
        mins += 30
      }
    })
    return horas
  }

  async function confirmar() {
    setEnviando(true)
    setError('')
    const { error: err } = await supabase.from('bookings').insert({
      restaurant_id: restaurante.id,
      customer_name: nombre,
      customer_email: email || null,
      servicio: servicioSeleccionado?.nombre || 'General',
      fecha,
      hora,
      notas: (telefono ? `Tel: ${telefono}${notas ? ' | ' + notas : ''}` : notas) || null,
      estado: 'pendiente'
    })
    if (err) { setError('Error al crear la reserva'); setEnviando(false); return }
    if (email) {
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: `Reserva recibida en ${restaurante.nombre}`,
          html: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;"><h2 style="color: #111;">Hemos recibido tu reserva</h2><p style="color: #555;">Hola ${nombre},</p><p style="color: #555;">Tu solicitud en <strong>${restaurante.nombre}</strong> ha sido recibida. Te confirmaremos en breve.</p><div style="background: #f5f5f5; border-radius: 12px; padding: 20px; margin: 24px 0;"><p style="margin: 0 0 8px; color: #111;"><strong>Servicio:</strong> ${servicioSeleccionado?.nombre || 'General'}</p><p style="margin: 0 0 8px; color: #111;"><strong>Fecha:</strong> ${fecha}</p><p style="margin: 0; color: #111;"><strong>Hora:</strong> ${hora}</p></div><p style="color: #555;">¡Hasta pronto!</p><p style="color: #999; font-size: 12px;">— ${restaurante.nombre}</p></div>`
        })
      })
    }
    setConfirmado(true)
    setEnviando(false)
  }

  if (cargando) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white text-sm tracking-widest uppercase">Cargando</p>
    </div>
  )

  if (!restaurante) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white text-sm">Negocio no encontrado</p>
    </div>
  )

  const fondo = restaurante.color_fondo || '#ffffff'
  const texto = restaurante.color_texto || '#000000'
  const primario = restaurante.color_primario || '#0EA5E9'
  const boton = restaurante.color_boton || primario
  const botonTexto = restaurante.color_boton_texto || '#ffffff'
  const fondoClaro = (() => {
    try {
      const r = parseInt(fondo.slice(1,3),16), g = parseInt(fondo.slice(3,5),16), b = parseInt(fondo.slice(5,7),16)
      return (r*299+g*587+b*114)/1000 > 128
    } catch { return true }
  })()
  const textoSec = fondoClaro ? '#64748b' : 'rgba(255,255,255,0.5)'
  const borde = fondoClaro ? '#e2e8f0' : 'rgba(255,255,255,0.15)'

  if (confirmado) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: fondo }}>
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: texto }}>Reserva enviada</h1>
        <p className="text-sm mb-6" style={{ color: textoSec }}>Hemos recibido tu solicitud. Te confirmaremos en breve.</p>
        <button onClick={() => { setConfirmado(false); setPaso(1); setFecha(''); setHora(''); setNombre(''); setEmail(''); setTelefono(''); setNotas(''); setServicioSeleccionado(null) }}
          className="text-xs tracking-widest uppercase px-6 py-3 rounded-xl font-semibold" style={{ background: boton, color: botonTexto }}>
          Nueva reserva
        </button>
      </div>
    </div>
  )

  const diaSeleccionado = fecha ? new Date(fecha + 'T00:00:00').getDay() : -1
  const diaSemanaSeleccionado = diaSeleccionado === 0 ? 6 : diaSeleccionado - 1
  const horasDisponibles = fecha ? generarHoras(diaSemanaSeleccionado) : []
  const capacidad = servicioSeleccionado?.capacidad || 1

  return (
    <div className="min-h-screen" style={{ background: fondo }}>
      <div className="max-w-md mx-auto p-6 pb-12">
        <div className="pt-8 pb-6 text-center">
          {restaurante.logo_url && <img src={restaurante.logo_url} alt={restaurante.nombre} className="h-12 object-contain mx-auto mb-4" />}
          <h1 className="text-2xl font-bold" style={{ color: texto }}>{restaurante.nombre}</h1>
          <p className="text-sm mt-1" style={{ color: textoSec }}>Reserva tu cita</p>
        </div>

        {/* Paso 1 — Servicio */}
        <div className="mb-6">
          <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Servicio</p>
          {servicios.length > 0 ? (
            <div className="grid gap-2">
              {servicios.map(s => (
                <button key={s.id} onClick={() => setServicioSeleccionado(s)}
                  className="w-full text-left p-4 rounded-xl transition-colors"
                  style={{ border: `1px solid ${servicioSeleccionado?.id === s.id ? primario : borde}`, background: servicioSeleccionado?.id === s.id ? `${primario}10` : 'transparent' }}>
                  <p className="font-medium text-sm" style={{ color: texto }}>{s.nombre}</p>
                  <p className="text-xs mt-0.5" style={{ color: textoSec }}>
                    {s.duracion_minutos ? `${s.duracion_minutos} min` : ''}
                    {s.duracion_minutos && s.precio ? ' · ' : ''}
                    {s.precio ? `${s.precio}€` : ''}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: textoSec }}>Sin servicios configurados</p>
          )}
        </div>

        {/* Paso 2 — Fecha */}
        <div className="mb-6">
          <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Fecha</p>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth()-1, 1))} className="text-xl px-2" style={{ color: textoSec }}>‹</button>
            <p className="text-sm font-medium" style={{ color: texto }}>{MESES[mes.getMonth()]} {mes.getFullYear()}</p>
            <button onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth()+1, 1))} className="text-xl px-2" style={{ color: textoSec }}>›</button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {DIAS_CORTO.map(d => <div key={d} className="text-center text-xs py-1" style={{ color: textoSec }}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {Array.from({ length: (() => { const p = new Date(mes.getFullYear(), mes.getMonth(), 1).getDay(); return p === 0 ? 6 : p - 1 })() }).map((_, i) => <div key={i} />)}
            {Array.from({ length: new Date(mes.getFullYear(), mes.getMonth()+1, 0).getDate() }).map((_, i) => {
              const dia = i + 1
              const hoy = new Date(); hoy.setHours(0,0,0,0)
              const diaDate = new Date(mes.getFullYear(), mes.getMonth(), dia)
              const pasado = diaDate < hoy
              const ds = diaDate.getDay() === 0 ? 6 : diaDate.getDay() - 1
              const cerrado = getHorarioDia(ds).length === 0 && horarios.length > 0
              const strDia = `${mes.getFullYear()}-${String(mes.getMonth()+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
              const seleccionado = fecha === strDia
              return (
                <button key={dia} onClick={() => { if (!pasado && !cerrado) { setFecha(strDia); setHora('') } }} disabled={pasado || cerrado}
                  className="aspect-square rounded-full flex items-center justify-center text-xs"
                  style={{ background: seleccionado ? primario : 'transparent', color: pasado || cerrado ? `${texto}20` : seleccionado ? botonTexto : texto, cursor: pasado || cerrado ? 'not-allowed' : 'pointer' }}>
                  {dia}
                </button>
              )
            })}
          </div>
        </div>

        {/* Paso 3 — Hora */}
        {fecha && horasDisponibles.length > 0 && (
          <div className="mb-6">
            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Hora</p>
            <div className="grid grid-cols-4 gap-2">
              {horasDisponibles.map(h => {
                const reservasEnHora = reservas.filter(r => r.fecha === fecha && r.hora?.slice(0,5) === h && r.estado !== 'cancelada').length
                const ocupada = reservasEnHora >= capacidad
                const libres = capacidad - reservasEnHora
                return (
                  <button key={h} onClick={() => !ocupada && setHora(h)} disabled={ocupada}
                    className="py-2 rounded-lg text-xs font-medium"
                    style={{ background: hora === h ? primario : ocupada ? `${texto}10` : 'transparent', color: ocupada ? `${texto}30` : hora === h ? botonTexto : texto, border: `1px solid ${hora === h ? primario : ocupada ? `${texto}10` : `${texto}20`}`, cursor: ocupada ? 'not-allowed' : 'pointer' }}>
                    {h}{ocupada ? ' ✗' : capacidad > 1 && libres < capacidad ? ` (${libres})` : ''}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Paso 4 — Datos */}
        {fecha && hora && (
          <div className="mb-6">
            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: textoSec }}>Tus datos</p>
            {[
              { label: 'Nombre *', key: 'nombre', value: nombre, set: setNombre, type: 'text' },
          { label: 'Email *', key: 'email', value: email, set: setEmail, type: 'email' },
          { label: 'Teléfono *', key: 'telefono', value: telefono, set: setTelefono, type: 'tel' },
            ].map(({ label, key, value, set, type }) => (
              <div key={key} className="mb-3">
                <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>{label}</p>
                <input type={type} value={value} onChange={(e) => set(e.target.value)}
                  className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm"
                  style={{ border: `1px solid ${borde}`, color: texto }} />
              </div>
            ))}
            <div className="mb-4">
              <p className="text-xs tracking-widest uppercase mb-1" style={{ color: textoSec }}>Notas (opcional)</p>
              <textarea value={notas} onChange={(e) => setNotas(e.target.value)}
                className="w-full bg-transparent rounded-xl px-3 py-2 focus:outline-none text-sm resize-none h-16"
                style={{ border: `1px solid ${borde}`, color: texto }} />
            </div>
            {error && <p className="text-xs mb-3" style={{ color: '#ef4444' }}>{error}</p>}
            <button onClick={confirmar} disabled={!nombre || !email || !telefono || enviando}
              className="w-full font-semibold rounded-xl py-4 disabled:opacity-30"
              style={{ background: boton, color: botonTexto }}>
              {enviando ? 'Enviando...' : 'Confirmar reserva'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}