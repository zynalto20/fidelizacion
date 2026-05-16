'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Types ─────────────────────────────────────────────────────────────────────
interface Props {
  restaurante: any
  fondo: string
  texto: string
  borde: string
  primario: string
  boton: string
  botonTexto: string
  textoSec: string
  fondoClaro: boolean
}

interface Tema {
  tema: string
  emoji: string
  tipo: string
}

interface PostData {
  tema: string
  emoji: string
  caption: string
  hashtags: string
  color: string
}

type Template = 'gradient' | 'minimal' | 'bold'
type Paso = 'elegir' | 'generando' | 'preview'

// ── Topics data ───────────────────────────────────────────────────────────────
const CATEGORIAS: { cat: string; emoji: string; temas: Tema[] }[] = [
  {
    cat: 'Servicios', emoji: '🔧',
    temas: [
      { tema: 'Cambio de aceite: cuándo y por qué es vital', emoji: '🛢️', tipo: 'educativo' },
      { tema: 'Revisión de frenos: señales que no debes ignorar', emoji: '🛑', tipo: 'educativo' },
      { tema: 'Pre-ITV: te ayudamos a aprobarla a la primera', emoji: '📋', tipo: 'servicio' },
      { tema: 'Diagnosis electrónica: detectamos cualquier avería', emoji: '💻', tipo: 'servicio' },
      { tema: 'Cambio de neumáticos con montaje y equilibrado', emoji: '🔵', tipo: 'servicio' },
    ],
  },
  {
    cat: 'Tips', emoji: '💡',
    temas: [
      { tema: '5 señales de que tu coche necesita revisión urgente', emoji: '⚠️', tipo: 'educativo' },
      { tema: 'Cómo ahorrar en el mantenimiento de tu vehículo', emoji: '💰', tipo: 'educativo' },
      { tema: 'Checklist antes de un viaje largo en coche', emoji: '✅', tipo: 'educativo' },
      { tema: 'El mantenimiento que más se olvida: el líquido de frenos', emoji: '🔴', tipo: 'educativo' },
    ],
  },
  {
    cat: 'Temporada', emoji: '🌡️',
    temas: [
      { tema: 'Prepara tu coche para el verano en 5 pasos', emoji: '☀️', tipo: 'temporada' },
      { tema: 'Checklist esencial antes de las vacaciones', emoji: '🏖️', tipo: 'temporada' },
      { tema: 'Llegan las lluvias: así proteges tu coche', emoji: '🌧️', tipo: 'temporada' },
      { tema: 'Neumáticos de invierno: cuándo y cómo', emoji: '❄️', tipo: 'temporada' },
    ],
  },
  {
    cat: 'Ofertas', emoji: '🏷️',
    temas: [
      { tema: 'Oferta especial en cambio de aceite este mes', emoji: '🛢️', tipo: 'promocion' },
      { tema: 'Primera revisión gratuita para nuevos clientes', emoji: '🎁', tipo: 'promocion' },
      { tema: 'Pack mantenimiento completo a precio especial', emoji: '⭐', tipo: 'promocion' },
      { tema: 'Esta semana: descuento en equilibrado y alineación', emoji: '💥', tipo: 'promocion' },
    ],
  },
  {
    cat: 'Nuestro taller', emoji: '🏢',
    temas: [
      { tema: 'Nuestro equipo: mecánicos certificados a tu servicio', emoji: '👨‍🔧', tipo: 'branding' },
      { tema: 'Nuestro taller por dentro: tecnología de vanguardia', emoji: '🔧', tipo: 'branding' },
      { tema: 'Años de experiencia cuidando tu vehículo', emoji: '🏆', tipo: 'branding' },
      { tema: 'Garantía total en todos nuestros trabajos', emoji: '✅', tipo: 'branding' },
    ],
  },
]

// ── Canvas drawing helpers ─────────────────────────────────────────────────────
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return null
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

function darkenColor(hex: string, amount: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const r = Math.max(0, Math.round(rgb.r * (1 - amount)))
  const g = Math.max(0, Math.round(rgb.g * (1 - amount)))
  const b = Math.max(0, Math.round(rgb.b * (1 - amount)))
  return `rgb(${r},${g},${b})`
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
  align: CanvasTextAlign = 'center'
): number {
  ctx.textAlign = align
  const words = text.split(' ')
  let line = ''
  let linesDrawn = 0
  let currentY = y

  for (let i = 0; i < words.length; i++) {
    const testLine = line + (line ? ' ' : '') + words[i]
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && line !== '') {
      if (linesDrawn < maxLines) {
        if (linesDrawn === maxLines - 1 && i < words.length - 1) {
          // last allowed line — truncate with ellipsis
          let truncated = line
          while (ctx.measureText(truncated + '…').width > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1)
          }
          ctx.fillText(truncated + '…', x, currentY)
        } else {
          ctx.fillText(line, x, currentY)
        }
        currentY += lineHeight
        linesDrawn++
      }
      line = words[i]
    } else {
      line = testLine
    }
  }

  if (line && linesDrawn < maxLines) {
    ctx.fillText(line, x, currentY)
    currentY += lineHeight
  }

  return currentY
}

function drawCanvas(
  canvas: HTMLCanvasElement,
  opts: {
    tema: string
    emoji: string
    caption: string
    color: string
    nombre: string
    ciudad: string
    telefono: string
    template: Template
  }
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const SIZE = 1080
  canvas.width = SIZE
  canvas.height = SIZE

  const { tema, emoji, color, nombre, ciudad, telefono, template } = opts

  // Headline font size based on length
  const headlineSize = tema.length < 25 ? 88 : tema.length < 40 ? 72 : 58

  if (template === 'gradient') {
    // ── GRADIENT TEMPLATE ──────────────────────────────────────────────────────
    const dark = darkenColor(color, 0.35)
    const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE)
    grad.addColorStop(0, color)
    grad.addColorStop(1, dark)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, SIZE, SIZE)

    // Decorative circles
    ctx.save()
    ctx.globalAlpha = 0.12
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(SIZE - 60, 80, 280, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(SIZE - 160, -20, 180, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(80, SIZE - 60, 240, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(-20, SIZE - 160, 160, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.restore()

    // Business name at top
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = `600 36px -apple-system, "Helvetica Neue", Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(nombre.toUpperCase(), SIZE / 2, 80)

    // Top divider line
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fillRect(SIZE / 2 - 120, 92, 240, 2)

    // Big emoji
    ctx.font = '200px serif'
    ctx.textAlign = 'center'
    ctx.fillText(emoji, SIZE / 2, 420)

    // Headline text (bold white)
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${headlineSize}px -apple-system, "Helvetica Neue", Arial, sans-serif`
    ctx.shadowColor = 'rgba(0,0,0,0.25)'
    ctx.shadowBlur = 12
    const afterHeadline = wrapText(ctx, tema, SIZE / 2, 520, SIZE - 120, headlineSize * 1.25, 3, 'center')
    ctx.shadowBlur = 0

    // Ciudad subtitle
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.font = `500 38px -apple-system, "Helvetica Neue", Arial, sans-serif`
    ctx.textAlign = 'center'
    const subtitleY = Math.max(afterHeadline + 20, SIZE - 200)
    ctx.fillText(ciudad, SIZE / 2, subtitleY)

    // Dark footer strip
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(0, SIZE - 110, SIZE, 110)

    // Footer text
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold 34px -apple-system, "Helvetica Neue", Arial, sans-serif`
    ctx.textAlign = 'left'
    ctx.fillText(nombre, 60, SIZE - 68)

    if (telefono) {
      ctx.fillStyle = 'rgba(255,255,255,0.65)'
      ctx.font = `500 28px -apple-system, "Helvetica Neue", Arial, sans-serif`
      ctx.textAlign = 'right'
      ctx.fillText(telefono, SIZE - 60, SIZE - 68)
    }

    // Instagram camera icon decoration
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '36px serif'
    ctx.textAlign = 'right'
    ctx.fillText('📸', SIZE - 60, SIZE - 28)

  } else if (template === 'minimal') {
    // ── MINIMAL TEMPLATE ───────────────────────────────────────────────────────
    // White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, SIZE, SIZE)

    // Left vertical stripe
    const stripeW = 80
    ctx.fillStyle = color
    ctx.fillRect(0, 0, stripeW, SIZE)

    // Subtle grid dots pattern
    ctx.fillStyle = 'rgba(0,0,0,0.03)'
    for (let ix = stripeW + 40; ix < SIZE - 40; ix += 60) {
      for (let iy = 40; iy < SIZE - 40; iy += 60) {
        ctx.beginPath()
        ctx.arc(ix, iy, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Top area: business name rotated on stripe
    ctx.save()
    ctx.translate(40, SIZE / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.font = `bold 28px -apple-system, "Helvetica Neue", Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(nombre.toUpperCase(), 0, 10)
    ctx.restore()

    // Large emoji top-center (of the white area)
    const whiteCenter = stripeW + (SIZE - stripeW) / 2
    ctx.font = '180px serif'
    ctx.textAlign = 'center'
    ctx.fillText(emoji, whiteCenter, 320)

    // Thin colored line under emoji
    ctx.fillStyle = color
    ctx.fillRect(stripeW + 60, 360, SIZE - stripeW - 120, 4)

    // Dark headline
    ctx.fillStyle = '#1a1a2e'
    ctx.font = `bold ${headlineSize}px -apple-system, "Helvetica Neue", Arial, sans-serif`
    const afterHead = wrapText(ctx, tema, whiteCenter, 440, SIZE - stripeW - 120, headlineSize * 1.25, 3, 'center')

    // Colored subtext
    ctx.fillStyle = color
    ctx.font = `600 36px -apple-system, "Helvetica Neue", Arial, sans-serif`
    ctx.textAlign = 'center'
    const subtY = Math.max(afterHead + 20, SIZE - 200)
    ctx.fillText(ciudad, whiteCenter, subtY)

    // Bottom colored bar
    ctx.fillStyle = color
    ctx.fillRect(0, SIZE - 100, SIZE, 100)

    // Business name in white on bottom bar
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold 38px -apple-system, "Helvetica Neue", Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(nombre, SIZE / 2, SIZE - 52)

    if (telefono) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.font = `500 26px -apple-system, "Helvetica Neue", Arial, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(telefono, SIZE / 2, SIZE - 22)
    }

  } else {
    // ── BOLD TEMPLATE ─────────────────────────────────────────────────────────
    // Solid brand color background
    ctx.fillStyle = color
    ctx.fillRect(0, 0, SIZE, SIZE)

    // Watermark: repeated business name rotated -30deg
    ctx.save()
    ctx.globalAlpha = 0.06
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold 48px -apple-system, "Helvetica Neue", Arial, sans-serif`
    ctx.translate(SIZE / 2, SIZE / 2)
    ctx.rotate(-Math.PI / 6)
    const wmText = nombre.toUpperCase() + '  •  '
    const wmWidth = ctx.measureText(wmText).width
    for (let iy = -SIZE; iy < SIZE * 1.5; iy += 90) {
      for (let ix = -SIZE; ix < SIZE * 1.5; ix += wmWidth) {
        ctx.fillText(wmText, ix, iy)
      }
    }
    ctx.restore()
    ctx.globalAlpha = 1

    // Big centered emoji
    ctx.font = '200px serif'
    ctx.textAlign = 'center'
    ctx.fillText(emoji, SIZE / 2, 400)

    // Very large headline in white
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${headlineSize}px -apple-system, "Helvetica Neue", Arial, sans-serif`
    ctx.shadowColor = 'rgba(0,0,0,0.2)'
    ctx.shadowBlur = 8
    const afterBoldHead = wrapText(ctx, tema, SIZE / 2, 490, SIZE - 100, headlineSize * 1.25, 3, 'center')
    ctx.shadowBlur = 0

    // Bottom stripe (dark)
    const stripeH = 130
    ctx.fillStyle = 'rgba(0,0,0,0.65)'
    ctx.fillRect(0, SIZE - stripeH, SIZE, stripeH)

    // City + phone in bottom stripe
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold 40px -apple-system, "Helvetica Neue", Arial, sans-serif`
    ctx.textAlign = 'left'
    ctx.fillText(nombre, 60, SIZE - stripeH + 52)

    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = `500 30px -apple-system, "Helvetica Neue", Arial, sans-serif`
    ctx.fillText(ciudad + (telefono ? `  ·  ${telefono}` : ''), 60, SIZE - stripeH + 90)

    // Accent top stripe
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fillRect(0, 0, SIZE, 14)
  }
}

// ── Small helper components ────────────────────────────────────────────────────
function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    publicado: { label: 'Publicado', bg: '#dbeafe', color: '#1e40af' },
    pendiente: { label: 'Pendiente', bg: '#fef9c3', color: '#854d0e' },
    error: { label: 'Error', bg: '#fee2e2', color: '#991b1b' },
  }
  const s = map[estado] || { label: estado, bg: '#f1f5f9', color: '#64748b' }
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function SocialTab({ restaurante, fondo, texto, borde, primario, boton, botonTexto, textoSec, fondoClaro }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Step state
  const [paso, setPaso] = useState<Paso>('elegir')
  const [categoriaActiva, setCategoriaActiva] = useState<string>('Servicios')
  const [temaSeleccionado, setTemaSeleccionado] = useState<Tema | null>(null)
  const [postData, setPostData] = useState<PostData | null>(null)
  const [template, setTemplate] = useState<Template>('gradient')

  // Editing
  const [editandoCaption, setEditandoCaption] = useState(false)
  const [captionEdit, setCaptionEdit] = useState('')

  // Publishing
  const [publicando, setPublicando] = useState(false)
  const [resultadoPublicacion, setResultadoPublicacion] = useState<any>(null)

  // Settings
  const [showSettings, setShowSettings] = useState(false)
  const [igToken, setIgToken] = useState(restaurante?.ig_access_token || '')
  const [igAccountId, setIgAccountId] = useState(restaurante?.ig_account_id || '')
  const [guardandoCredenciales, setGuardandoCredenciales] = useState(false)
  const [msgCredenciales, setMsgCredenciales] = useState('')

  // History
  const [historial, setHistorial] = useState<any[]>([])
  const [cargandoHistorial, setCargandoHistorial] = useState(true)

  // Copied state
  const [copiado, setCopiado] = useState(false)

  const bg = fondoClaro ? '#ffffff' : 'rgba(255,255,255,0.04)'
  const bgSec = fondoClaro ? '#f8fafc' : 'rgba(255,255,255,0.02)'

  const nombre = restaurante?.nombre || 'Mi Taller'
  const ciudad = restaurante?.ciudad_fiscal || restaurante?.provincia || 'España'
  const telefono = restaurante?.telefono || ''

  // Load history on mount
  useEffect(() => {
    supabase
      .from('social_posts')
      .select('*')
      .eq('restaurant_id', restaurante.id)
      .order('creado_en', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setHistorial(data || [])
        setCargandoHistorial(false)
      })
  }, [restaurante.id])

  // Redraw canvas when postData or template changes
  useEffect(() => {
    if (!postData || !canvasRef.current) return
    drawCanvas(canvasRef.current, {
      tema: postData.tema,
      emoji: postData.emoji,
      caption: postData.caption,
      color: postData.color,
      nombre,
      ciudad,
      telefono,
      template,
    })
  }, [postData, template, nombre, ciudad, telefono])

  // ── Actions ───────────────────────────────────────────────────────────────
  async function generarPost() {
    if (!temaSeleccionado) return
    setPaso('generando')
    setResultadoPublicacion(null)

    try {
      const res = await fetch('/api/social/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tema: temaSeleccionado.tema,
          emoji: temaSeleccionado.emoji,
          tipo: temaSeleccionado.tipo,
          restaurante,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al generar')

      const newPost: PostData = {
        tema: temaSeleccionado.tema,
        emoji: temaSeleccionado.emoji,
        caption: json.caption,
        hashtags: json.hashtags,
        color: primario,
      }
      setPostData(newPost)
      setCaptionEdit(json.caption)
      setPaso('preview')
    } catch (e: any) {
      console.error(e)
      // Fallback to mock on client-side error
      const mock: PostData = {
        tema: temaSeleccionado.tema,
        emoji: temaSeleccionado.emoji,
        caption: `En ${nombre} sabemos lo importante que es para ti mantener tu vehículo en perfecto estado. ${temaSeleccionado.tema}. Nuestro equipo de profesionales está listo para ayudarte. ¡Pide cita ahora sin compromiso! 🚗✨`,
        hashtags: '#taller #mecanico #coches #mantenimiento #automocion #taller' + ciudad.toLowerCase().replace(/\s/g, '') + ' #revision #neumáticos #frenos #aceite #ITV #vehiculos #motoristas #autocare #workshop',
        color: primario,
      }
      setPostData(mock)
      setCaptionEdit(mock.caption)
      setPaso('preview')
    }
  }

  function descargarImagen() {
    if (!canvasRef.current) return
    const url = canvasRef.current.toDataURL('image/jpeg', 0.95)
    const a = document.createElement('a')
    a.href = url
    a.download = `instagram-post-${Date.now()}.jpg`
    a.click()
  }

  function copiarCaption() {
    if (!postData) return
    const textToCopy = (editandoCaption ? captionEdit : postData.caption) + '\n\n' + postData.hashtags
    navigator.clipboard.writeText(textToCopy)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function publicarInstagram() {
    if (!canvasRef.current || !postData) return
    setPublicando(true)
    setResultadoPublicacion(null)

    canvasRef.current.toBlob(async (blob) => {
      if (!blob) {
        setPublicando(false)
        setResultadoPublicacion({ error: 'No se pudo generar la imagen' })
        return
      }
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1]
        try {
          const caption = (editandoCaption ? captionEdit : postData.caption) + '\n\n' + postData.hashtags
          const res = await fetch('/api/social/instagram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              restaurant_id: restaurante.id,
              image_base64: base64,
              caption,
              tema: postData.tema,
            }),
          })
          const json = await res.json()
          setResultadoPublicacion(json)
          if (json.success) {
            // Refresh history
            const { data } = await supabase
              .from('social_posts')
              .select('*')
              .eq('restaurant_id', restaurante.id)
              .order('creado_en', { ascending: false })
              .limit(10)
            setHistorial(data || [])
          }
        } catch (e: any) {
          setResultadoPublicacion({ error: e.message })
        } finally {
          setPublicando(false)
        }
      }
      reader.readAsDataURL(blob)
    }, 'image/jpeg', 0.95)
  }

  async function guardarCredenciales() {
    setGuardandoCredenciales(true)
    setMsgCredenciales('')
    const { error } = await supabase
      .from('restaurants')
      .update({ ig_access_token: igToken, ig_account_id: igAccountId })
      .eq('id', restaurante.id)
    if (error) {
      setMsgCredenciales('Error al guardar: ' + error.message)
    } else {
      setMsgCredenciales('Credenciales guardadas correctamente')
      setTimeout(() => setMsgCredenciales(''), 3000)
    }
    setGuardandoCredenciales(false)
  }

  function resetearPaso() {
    setPaso('elegir')
    setTemaSeleccionado(null)
    setPostData(null)
    setEditandoCaption(false)
    setResultadoPublicacion(null)
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-sm" style={{ color: textoSec }}>
            Crea posts profesionales para Instagram con IA. Descarga la imagen o publícala directamente.
          </p>
        </div>
        <button
          onClick={() => setShowSettings(s => !s)}
          className="flex-shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ border: `1px solid ${borde}`, color: textoSec, background: bg }}>
          ⚙️ {showSettings ? 'Ocultar' : 'Configurar'} Instagram
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 rounded-2xl p-5" style={{ border: `1px solid ${primario}40`, background: primario + '08' }}>
          <p className="text-sm font-semibold mb-4" style={{ color: texto }}>Configuración de Instagram Business</p>

          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: textoSec }}>
                Instagram Access Token
              </label>
              <input
                type="password"
                value={igToken}
                onChange={e => setIgToken(e.target.value)}
                placeholder="EAAxxxxxx..."
                className="w-full bg-transparent rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                style={{ border: `1px solid ${borde}`, color: texto }}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: textoSec }}>
                Instagram Account ID (IGSID)
              </label>
              <input
                type="text"
                value={igAccountId}
                onChange={e => setIgAccountId(e.target.value)}
                placeholder="17841400000000000"
                className="w-full bg-transparent rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                style={{ border: `1px solid ${borde}`, color: texto }}
              />
            </div>
          </div>

          {msgCredenciales && (
            <p className="text-xs mb-3" style={{ color: msgCredenciales.startsWith('Error') ? '#ef4444' : '#10b981' }}>
              {msgCredenciales}
            </p>
          )}

          <button
            onClick={guardarCredenciales}
            disabled={guardandoCredenciales}
            className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 mb-5"
            style={{ background: boton, color: botonTexto }}>
            {guardandoCredenciales ? 'Guardando…' : 'Guardar credenciales'}
          </button>

          <div className="pt-4" style={{ borderTop: `1px solid ${borde}` }}>
            <p className="text-xs font-semibold mb-2" style={{ color: textoSec }}>Cómo obtener tus credenciales:</p>
            <ol className="text-xs space-y-1.5 list-decimal list-inside" style={{ color: textoSec }}>
              <li>Ve a <strong style={{ color: texto }}>developers.facebook.com</strong> y crea una app de tipo &quot;Business&quot;</li>
              <li>Añade el producto <strong style={{ color: texto }}>Instagram Graph API</strong></li>
              <li>Conecta tu <strong style={{ color: texto }}>cuenta de Instagram Business</strong> (no personal)</li>
              <li>Genera un <strong style={{ color: texto }}>Long-Lived Token</strong> (válido 60 días, renovable)</li>
              <li>El <strong style={{ color: texto }}>Account ID</strong> lo encuentras en la respuesta al llamar <code>/me/accounts</code></li>
            </ol>
          </div>
        </div>
      )}

      {/* ══ PASO: ELEGIR TEMA ══════════════════════════════════════════════════ */}
      {paso === 'elegir' && (
        <div>
          {/* Category pills */}
          <p className="text-xs tracking-widest uppercase font-semibold mb-3" style={{ color: textoSec }}>Categoría</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORIAS.map(cat => (
              <button
                key={cat.cat}
                onClick={() => { setCategoriaActiva(cat.cat); setTemaSeleccionado(null) }}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: categoriaActiva === cat.cat ? primario : bg,
                  color: categoriaActiva === cat.cat ? botonTexto : texto,
                  border: `1px solid ${categoriaActiva === cat.cat ? primario : borde}`,
                }}>
                {cat.emoji} {cat.cat}
              </button>
            ))}
          </div>

          {/* Topic suggestions */}
          {CATEGORIAS.filter(c => c.cat === categoriaActiva).map(cat => (
            <div key={cat.cat}>
              <p className="text-xs tracking-widest uppercase font-semibold mb-3" style={{ color: textoSec }}>
                Selecciona un tema
              </p>
              <div className="space-y-2 mb-6">
                {cat.temas.map(t => (
                  <button
                    key={t.tema}
                    onClick={() => setTemaSeleccionado(temaSeleccionado?.tema === t.tema ? null : t)}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-all"
                    style={{
                      background: temaSeleccionado?.tema === t.tema ? primario + '15' : bg,
                      border: `1.5px solid ${temaSeleccionado?.tema === t.tema ? primario : borde}`,
                    }}>
                    <span className="text-2xl flex-shrink-0">{t.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug" style={{ color: texto }}>{t.tema}</p>
                      <p className="text-xs mt-0.5" style={{ color: textoSec }}>
                        Tipo: {t.tipo}
                      </p>
                    </div>
                    {temaSeleccionado?.tema === t.tema && (
                      <span className="text-sm font-bold flex-shrink-0" style={{ color: primario }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Generate button */}
          <button
            onClick={generarPost}
            disabled={!temaSeleccionado}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all"
            style={{ background: boton, color: botonTexto }}>
            ✨ Generar post con IA
          </button>
        </div>
      )}

      {/* ══ PASO: GENERANDO ════════════════════════════════════════════════════ */}
      {paso === 'generando' && (
        <div className="flex flex-col items-center justify-center py-20 gap-5">
          <svg className="animate-spin w-10 h-10" viewBox="0 0 24 24" fill="none" style={{ color: primario }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div className="text-center">
            <p className="font-semibold mb-1" style={{ color: texto }}>Generando tu post con IA…</p>
            <p className="text-sm" style={{ color: textoSec }}>Creando caption y hashtags perfectos para {nombre}</p>
          </div>
        </div>
      )}

      {/* ══ PASO: PREVIEW ══════════════════════════════════════════════════════ */}
      {paso === 'preview' && postData && (
        <div>
          {/* Back button */}
          <button
            onClick={resetearPaso}
            className="flex items-center gap-2 text-sm mb-5 transition-colors"
            style={{ color: textoSec }}>
            ← Crear otro post
          </button>

          {/* Template selector */}
          <p className="text-xs tracking-widest uppercase font-semibold mb-3" style={{ color: textoSec }}>Diseño</p>
          <div className="flex gap-2 mb-5">
            {([
              { key: 'gradient', label: '🌈 Gradiente' },
              { key: 'minimal', label: '⬜ Minimal' },
              { key: 'bold', label: '💪 Bold' },
            ] as { key: Template; label: string }[]).map(t => (
              <button
                key={t.key}
                onClick={() => setTemplate(t.key)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: template === t.key ? primario : bg,
                  color: template === t.key ? botonTexto : texto,
                  border: `1px solid ${template === t.key ? primario : borde}`,
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Canvas preview */}
          <div className="mb-5 flex justify-center">
            <div className="rounded-2xl overflow-hidden shadow-lg" style={{ width: 400, height: 400 }}>
              <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            </div>
          </div>

          {/* Caption */}
          <div className="rounded-2xl p-4 mb-4" style={{ border: `1px solid ${borde}`, background: bg }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs tracking-widest uppercase font-semibold" style={{ color: textoSec }}>Caption</p>
              <button
                onClick={() => {
                  setEditandoCaption(e => !e)
                  setCaptionEdit(postData.caption)
                }}
                className="text-xs px-3 py-1 rounded-lg"
                style={{ border: `1px solid ${borde}`, color: textoSec }}>
                {editandoCaption ? 'Cancelar edición' : '✏️ Editar'}
              </button>
            </div>

            {editandoCaption ? (
              <textarea
                value={captionEdit}
                onChange={e => setCaptionEdit(e.target.value)}
                rows={6}
                className="w-full bg-transparent text-sm rounded-xl px-3 py-2.5 focus:outline-none resize-none"
                style={{ border: `1px solid ${borde}`, color: texto }}
              />
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: texto }}>
                {postData.caption}
              </p>
            )}
          </div>

          {/* Hashtags */}
          <div className="rounded-2xl p-4 mb-5" style={{ border: `1px solid ${borde}`, background: bg }}>
            <p className="text-xs tracking-widest uppercase font-semibold mb-2" style={{ color: textoSec }}>Hashtags</p>
            <p className="text-sm leading-relaxed" style={{ color: textoSec }}>
              {postData.hashtags}
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <button
              onClick={descargarImagen}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ border: `1.5px solid ${borde}`, color: texto, background: bg }}>
              📥 Descargar imagen
            </button>

            <button
              onClick={copiarCaption}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                border: `1.5px solid ${copiado ? '#10b981' : borde}`,
                color: copiado ? '#10b981' : texto,
                background: copiado ? '#f0fdf4' : bg,
              }}>
              {copiado ? '✓ Copiado' : '📋 Copiar caption + hashtags'}
            </button>

            <button
              onClick={publicarInstagram}
              disabled={publicando || (!restaurante?.ig_access_token && !igToken)}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all"
              style={{ background: boton, color: botonTexto }}>
              {publicando ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Publicando…
                </>
              ) : '📲 Publicar en Instagram'}
            </button>
          </div>

          {!restaurante?.ig_access_token && !igToken && (
            <p className="text-xs text-center mb-5" style={{ color: textoSec }}>
              Para publicar directamente en Instagram, configura tus credenciales en ⚙️ Configurar Instagram
            </p>
          )}

          {/* Publication result */}
          {resultadoPublicacion && (
            <div
              className="rounded-xl p-4 mb-5"
              style={{
                background: resultadoPublicacion.success ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${resultadoPublicacion.success ? '#bbf7d0' : '#fecaca'}`,
              }}>
              {resultadoPublicacion.success ? (
                <div>
                  <p className="text-sm font-semibold text-green-700 mb-1">Post publicado en Instagram</p>
                  <p className="text-xs text-green-600">ID del post: {resultadoPublicacion.post_id}</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-red-700 mb-1">Error al publicar</p>
                  <p className="text-xs text-red-600">{resultadoPublicacion.error}</p>
                  {resultadoPublicacion.setup && (
                    <p className="text-xs text-red-500 mt-1">Configura tus credenciales de Instagram en el panel de ajustes.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ HISTORIAL ══════════════════════════════════════════════════════════ */}
      {(paso === 'elegir' || paso === 'preview') && (
        <div className="mt-8">
          <p className="text-xs tracking-widest uppercase font-semibold mb-3" style={{ color: textoSec }}>
            Historial de posts ({historial.length})
          </p>

          {cargandoHistorial ? (
            <p className="text-sm" style={{ color: textoSec }}>Cargando…</p>
          ) : historial.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ border: `1px dashed ${borde}` }}>
              <p className="text-2xl mb-2">📸</p>
              <p className="text-sm font-medium mb-1" style={{ color: texto }}>Sin posts publicados aún</p>
              <p className="text-xs" style={{ color: textoSec }}>Los posts que publiques en Instagram aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historial.map((post: any) => (
                <div
                  key={post.id}
                  className="rounded-xl px-4 py-3 flex items-center gap-4"
                  style={{ border: `1px solid ${borde}`, background: bg }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: texto }}>{post.tema}</p>
                    <p className="text-xs mt-0.5" style={{ color: textoSec }}>
                      {new Date(post.creado_en).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <EstadoBadge estado={post.estado || 'publicado'} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
