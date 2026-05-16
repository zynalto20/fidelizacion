'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Types ─────────────────────────────────────────────────────────────────────
interface Article {
  id: string
  tema: string
  slug: string
  contenido: string
  estado: 'borrador' | 'aprobado' | 'publicado'
  creado_en: string
  actualizado_en?: string
}

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

// ── Temas sugeridos por categoría ─────────────────────────────────────────────
const TEMAS: { cat: string; emoji: string; items: string[] }[] = [
  {
    cat: 'Mantenimiento básico', emoji: '🔧',
    items: [
      'Cambio de aceite: cuándo y por qué es crucial',
      'Filtros del coche: cuándo cambiarlos y por qué importa',
      'Líquido de frenos: el mantenimiento más olvidado',
      'Batería del coche: vida útil y cómo evitar quedarte sin arranque',
    ]
  },
  {
    cat: 'Frenos y seguridad', emoji: '🛑',
    items: [
      'Pastillas de freno: señales de desgaste que no debes ignorar',
      'Amortiguadores: síntomas de que están fallando',
      'Luces del coche: normativa y mantenimiento en España',
      'Neumáticos: cuándo cambiarlos y cómo elegirlos',
    ]
  },
  {
    cat: 'ITV y revisiones', emoji: '📋',
    items: [
      'Cómo pasar la ITV sin sorpresas',
      'Revisión de los 10.000 km: qué se comprueba',
      'Revisión de los 30.000 km: qué incluye y cuánto cuesta',
      'Preparación del coche para la ITV: guía paso a paso',
    ]
  },
  {
    cat: 'Motor y mecánica', emoji: '⚙️',
    items: [
      'Correa de distribución: cuándo cambiarla para evitar una avería grave',
      'Cómo leer los códigos de error OBD del coche',
      'Síntomas de que tu motor necesita revisión urgente',
      'Neumáticos de verano vs invierno: guía completa para España',
    ]
  },
  {
    cat: 'Estacionalidad', emoji: '🌡️',
    items: [
      'Preparación del coche para el invierno: lista completa',
      'Preparación del coche para el verano y la playa',
      'Cómo proteger tu coche del calor extremo',
      'Puesta a punto del coche tras el verano',
    ]
  },
]

// ── GBP Checklist ─────────────────────────────────────────────────────────────
const GBP_ITEMS = [
  { id: 'nombre', label: 'Nombre exacto y consistente', tip: 'Mismo nombre en web, RRSS y Google Business.' },
  { id: 'direccion', label: 'Dirección verificada en Google Maps', tip: 'Comprueba que el pin cae exactamente en tu taller.' },
  { id: 'telefono', label: 'Teléfono actualizado (número local)', tip: 'Evita 900 o móviles exclusivos para soporte.' },
  { id: 'horario', label: 'Horario completo con festivos', tip: 'Incluye horario de verano/invierno y días especiales.' },
  { id: 'categoria', label: 'Categoría: "Taller de reparación de automóviles"', tip: 'Añade categorías secundarias: mecánico, electricista del automóvil...' },
  { id: 'descripcion', label: 'Descripción del negocio (máx. 750 caracteres)', tip: 'Incluye servicios, ciudad y propuesta de valor diferencial.' },
  { id: 'fotos', label: 'Mínimo 10 fotos: taller, equipo, trabajos', tip: 'Sube fotos nuevas cada semana. Google prioriza fichas activas.' },
  { id: 'servicios', label: 'Lista de servicios con precios orientativos', tip: 'Añade cada servicio individualmente en la sección "Servicios".' },
  { id: 'atributos', label: 'Atributos activados (reserva online, parking…)', tip: 'Los atributos mejoran la conversión desde la ficha de Google.' },
  { id: 'preguntas', label: 'FAQs respondidas en la sección de preguntas', tip: 'Sé tú quien añada las preguntas más frecuentes antes que otros.' },
  { id: 'resenas', label: 'Respuesta a todas las reseñas', tip: 'Responder reseñas (positivas y negativas) es una señal de confianza.' },
  { id: 'posts', label: 'Publicaciones en Google semanalmente', tip: 'Las "Novedades" y "Ofertas" mejoran la visibilidad en Maps.' },
]

// ── Servicios para keywords ───────────────────────────────────────────────────
const SERVICIOS_KEYWORDS = [
  'taller mecánico', 'mecánico de confianza', 'cambio de aceite',
  'cambio de frenos', 'revisión ITV', 'cambio de neumáticos',
  'reparación de motor', 'diagnosis coche', 'electricista del automóvil',
  'cambio de correa de distribución', 'mantenimiento vehículo',
  'taller oficial', 'revisión pre-ITV',
]

// ── Sub-components ─────────────────────────────────────────────────────────────
function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    borrador:  { label: 'Borrador',   bg: '#f1f5f9', color: '#64748b' },
    aprobado:  { label: 'Aprobado',   bg: '#dcfce7', color: '#166534' },
    publicado: { label: 'Publicado',  bg: '#dbeafe', color: '#1e40af' },
  }
  const s = map[estado] || map.borrador
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
      style={{ borderColor: '#e2e8f0', color: copied ? '#10b981' : '#64748b', background: copied ? '#f0fdf4' : 'transparent' }}>
      {copied ? '✓ Copiado' : label}
    </button>
  )
}

// ── Heatmap signals ───────────────────────────────────────────────────────────
const HEATMAP_SIGNALS = [
  { key: 'https',              label: 'HTTPS / SSL',          cat: 'seo', seoW: 15, geoW: 0  },
  { key: 'metaTitulo',         label: 'Meta título',          cat: 'seo', seoW: 15, geoW: 0  },
  { key: 'metaDesc',           label: 'Meta descripción',     cat: 'seo', seoW: 15, geoW: 0  },
  { key: 'h1',                 label: 'H1 en página',         cat: 'seo', seoW: 15, geoW: 0  },
  { key: 'openGraph',          label: 'Open Graph tags',      cat: 'seo', seoW: 10, geoW: 0  },
  { key: 'viewport',           label: 'Responsive (mobile)',  cat: 'seo', seoW: 10, geoW: 0  },
  { key: 'canonical',          label: 'URL Canonical',        cat: 'seo', seoW: 5,  geoW: 0  },
  { key: 'schemaLocalBusiness',label: 'Schema LocalBusiness', cat: 'geo', seoW: 15, geoW: 30 },
  { key: 'schemaFAQ',          label: 'Schema FAQPage',       cat: 'geo', seoW: 0,  geoW: 25 },
  { key: 'faqSection',         label: 'Sección FAQ visible',  cat: 'geo', seoW: 0,  geoW: 10 },
  { key: 'phoneVisible',       label: 'Teléfono en web',      cat: 'geo', seoW: 0,  geoW: 10 },
  { key: 'addressVisible',     label: 'Dirección en web',     cat: 'geo', seoW: 0,  geoW: 10 },
  { key: 'googleMaps',         label: 'Embed Google Maps',    cat: 'geo', seoW: 0,  geoW: 10 },
  { key: 'reviews',            label: 'Reseñas visibles',     cat: 'geo', seoW: 0,  geoW: 5  },
]

const ACCIONES_PLANTILLA: Record<string, { title: string; desc: string; effort: string; impact: string }> = {
  https:               { title: 'Instala certificado SSL (HTTPS)',      impact: 'Crítico',   effort: '1h',  desc: 'Google penaliza las webs sin HTTPS. Actívalo en tu hosting (Let\'s Encrypt es gratuito). Ningún competidor con HTTPS podrá superarte en este punto.' },
  metaTitulo:          { title: 'Añade un meta título optimizado',       impact: 'Alto',      effort: '30m', desc: 'Entre 50-60 caracteres: "[Servicio] en [Ciudad] · [Nombre taller]". Es el texto azul que aparece en Google. Sin él, Google improvisa y pierde clics.' },
  metaDesc:            { title: 'Escribe una meta descripción de 155 ch',impact: 'Alto',      effort: '30m', desc: 'Incluye tu servicio principal, ciudad y una llamada a la acción ("Llama ahora", "Pide cita"). Aumenta el CTR hasta un 35% según estudios de Moz.' },
  h1:                  { title: 'Añade un H1 claro en tu página',        impact: 'Alto',      effort: '15m', desc: 'Un solo H1 por página con tu keyword principal: "Taller mecánico en [Ciudad]". Es la señal de relevancia más directa para Google.' },
  schemaLocalBusiness: { title: 'Implementa Schema AutoRepair JSON-LD',  impact: 'Crítico',   effort: '2h',  desc: 'Vale +15 SEO y +30 GEO. Cópialo desde la pestaña "Ficha Google" y pégalo en el <head> de tu web. Dice a Google y a la IA qué eres, dónde estás y cómo contactarte.' },
  schemaFAQ:           { title: 'Añade FAQPage Schema en tu web',        impact: 'Alto',      effort: '1h',  desc: 'Vale +25 GEO. Genera tus FAQs en la pestaña "Palabras clave" y añádelas con Schema FAQPage. Te posiciona en ChatGPT, Perplexity y los rich results de Google.' },
  openGraph:           { title: 'Configura las Open Graph tags',         impact: 'Medio',     effort: '30m', desc: 'Añade og:title, og:description, og:image. Controla cómo se ve tu web cuando alguien la comparte en WhatsApp, Facebook o LinkedIn. Mejoran el CTR social.' },
  viewport:            { title: 'Haz tu web responsive (mobile-first)',  impact: 'Crítico',   effort: '4h',  desc: 'Google indexa principalmente la versión móvil. Una web no responsive puede perder hasta el 60% de su visibilidad en buscadores.' },
  canonical:           { title: 'Añade la etiqueta canonical',           impact: 'Bajo',      effort: '15m', desc: '<link rel="canonical" href="URL-principal"> en el head. Evita que Google penalice contenido duplicado si tienes múltiples versiones de tu URL (www, http, etc.).' },
  faqSection:          { title: 'Añade una sección FAQ visible',         impact: 'Alto',      effort: '1h',  desc: 'Una sección "Preguntas frecuentes" con 5-8 preguntas locales mejora el GEO +10 puntos y es el tipo de contenido que los LLMs citan directamente.' },
  phoneVisible:        { title: 'Muestra el teléfono en formato texto',  impact: 'Medio',     effort: '15m', desc: 'El teléfono debe aparecer en texto plano (no solo como imagen) para que Google y la IA puedan leerlo y mostrarlo en resultados locales.' },
  addressVisible:      { title: 'Muestra la dirección completa en texto',impact: 'Medio',     effort: '15m', desc: 'Calle, número, ciudad y CP en texto plano. Google cruza esta información con tu Ficha de Empresa para verificar la consistencia NAP.' },
  googleMaps:          { title: 'Incrusta Google Maps en tu web',        impact: 'Medio',     effort: '15m', desc: 'Un embed del mapa refuerza la señal de geolocalización. Ve a Google Maps, busca tu taller, comparte → Insertar mapa y pega el iframe.' },
  reviews:             { title: 'Muestra reseñas reales en tu web',      impact: 'Medio',     effort: '2h',  desc: 'Incrusta tus reseñas de Google o añade testimonios con Schema Review. La prueba social reduce el porcentaje de rebote y mejora la confianza ante la IA.' },
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function SeoTab({ restaurante, fondo, texto, borde, primario, boton, botonTexto, textoSec, fondoClaro }: Props) {
  const [seccion, setSeccion] = useState<'posicion' | 'articulos' | 'ficha' | 'palabras'>('posicion')

  // Articles state
  const [articles, setArticles] = useState<Article[]>([])
  const [cargandoArticles, setCargandoArticles] = useState(true)
  const [catAbierta, setCatAbierta] = useState<string | null>('Mantenimiento básico')
  const [temaSeleccionado, setTemaSeleccionado] = useState('')
  const [temaPersonalizado, setTemaPersonalizado] = useState('')
  const [generando, setGenerando] = useState(false)
  const [articuloActual, setArticuloActual] = useState<Article | null>(null)
  const [contenidoEditado, setContenidoEditado] = useState('')
  const [vistaPrevia, setVistaPrevia] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [msgArticle, setMsgArticle] = useState('')

  // GBP state
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})

  // Keywords state
  const [ciudad, setCiudad] = useState(restaurante?.ciudad_fiscal || restaurante?.provincia || '')
  const [faqs, setFaqs] = useState<{ q: string; a: string }[]>([])

  // Posicionamiento state
  const [miUrl, setMiUrl] = useState(restaurante?.web || '')
  const [posCompetidores, setPosCompetidores] = useState<{ nombre: string; url: string }[]>([
    { nombre: 'Competidor 1', url: '' },
    { nombre: 'Competidor 2', url: '' },
    { nombre: 'Competidor 3', url: '' },
  ])
  const [posResultados, setPosResultados] = useState<any[]>([])
  const [posAnalizando, setPosAnalizando] = useState(false)
  const [posProgreso, setPosProgreso] = useState(0)
  const [posTotal, setPosTotal] = useState(0)

  const bg = fondoClaro ? '#ffffff' : 'rgba(255,255,255,0.04)'
  const bgSec = fondoClaro ? '#f8fafc' : 'rgba(255,255,255,0.02)'

  // Load articles
  useEffect(() => {
    supabase
      .from('seo_articles')
      .select('*')
      .eq('restaurant_id', restaurante.id)
      .order('creado_en', { ascending: false })
      .then(({ data }) => { setArticles(data || []); setCargandoArticles(false) })
  }, [restaurante.id])

  // Load GBP checklist from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`gbp_${restaurante.id}`)
    if (saved) setChecklist(JSON.parse(saved))
  }, [restaurante.id])

  function toggleCheck(id: string) {
    const next = { ...checklist, [id]: !checklist[id] }
    setChecklist(next)
    localStorage.setItem(`gbp_${restaurante.id}`, JSON.stringify(next))
  }

  // Generate article
  async function generarArticulo() {
    const tema = temaPersonalizado.trim() || temaSeleccionado
    if (!tema) return
    setGenerando(true)
    setMsgArticle('')
    try {
      const res = await fetch('/api/seo/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_id: restaurante.id, tema, restaurante }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al generar')
      setArticuloActual(json.article)
      setContenidoEditado(json.article.contenido)
      setVistaPrevia(true)
      setArticles(prev => [json.article, ...prev])
      setTemaSeleccionado('')
      setTemaPersonalizado('')
    } catch (e: any) {
      setMsgArticle('❌ ' + e.message)
    } finally {
      setGenerando(false)
    }
  }

  // Approve article
  async function aprobarArticulo() {
    if (!articuloActual) return
    setGuardando(true)
    const { data, error } = await supabase
      .from('seo_articles')
      .update({ estado: 'aprobado', contenido: contenidoEditado, actualizado_en: new Date().toISOString() })
      .eq('id', articuloActual.id)
      .select()
      .single()
    if (!error && data) {
      setArticuloActual(data)
      setArticles(prev => prev.map(a => a.id === data.id ? data : a))
      setMsgArticle('✓ Artículo aprobado')
      setTimeout(() => setMsgArticle(''), 3000)
    }
    setGuardando(false)
  }

  async function marcarPublicado(id: string) {
    const { data } = await supabase
      .from('seo_articles')
      .update({ estado: 'publicado' })
      .eq('id', id)
      .select()
      .single()
    if (data) setArticles(prev => prev.map(a => a.id === id ? data : a))
  }

  async function eliminarArticulo(id: string) {
    if (!confirm('¿Eliminar este artículo?')) return
    await supabase.from('seo_articles').delete().eq('id', id)
    setArticles(prev => prev.filter(a => a.id !== id))
    if (articuloActual?.id === id) setArticuloActual(null)
  }

  // Schema markup
  function generarSchema(): string {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'AutoRepair',
      name: restaurante?.nombre || '',
      telephone: restaurante?.telefono || '',
      url: restaurante?.web || '',
      address: {
        '@type': 'PostalAddress',
        streetAddress: restaurante?.direccion || '',
        addressLocality: restaurante?.ciudad_fiscal || restaurante?.provincia || '',
        postalCode: restaurante?.codigo_postal_fiscal || '',
        addressCountry: 'ES',
      },
      priceRange: '€€',
      currenciesAccepted: 'EUR',
      paymentAccepted: 'Cash, Credit Card',
      areaServed: restaurante?.ciudad_fiscal || restaurante?.provincia || '',
      openingHoursSpecification: [
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '09:00', closes: '19:00' },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '09:00', closes: '14:00' },
      ],
    }, null, 2)
  }

  // FAQ generator
  function generarFaqs() {
    const c = ciudad || 'tu ciudad'
    const n = restaurante?.nombre || 'nuestro taller'
    const dir = restaurante?.direccion || c
    setFaqs([
      { q: `¿Dónde hay un taller mecánico de confianza en ${c}?`, a: `${n} está ubicado en ${dir} y ofrece mecánica general, cambio de aceite, frenos, neumáticos, ITV y mucho más. Llevamos años siendo el taller de referencia en ${c}.` },
      { q: `¿Cuánto cuesta un cambio de aceite en ${c}?`, a: `En ${n} realizamos el cambio de aceite desde 39€ con aceite mineral y desde 59€ con aceite sintético. El precio varía según el tipo de aceite y el motor de tu vehículo. Consulta sin compromiso.` },
      { q: `¿Cómo preparo el coche para superar la ITV en ${c}?`, a: `Para pasar la ITV sin suspenso en ${c} verifica: luces, frenos, neumáticos, niveles de fluidos y ausencia de humos. En ${n} hacemos una pre-ITV gratuita para detectar cualquier problema antes de la inspección.` },
      { q: `¿Cada cuánto debo cambiar el aceite del coche?`, a: `Se recomienda cada 10.000-15.000 km o una vez al año con aceite convencional. Con aceite sintético de alta gama puede extenderse hasta 20.000 km. En ${n} revisamos el manual de tu vehículo para darte la recomendación exacta.` },
      { q: `¿Cómo sé si mis pastillas de freno necesitan cambio?`, a: `Las señales más habituales son: ruido metálico o chirrido al frenar, vibración en el pedal, mayor distancia de frenado o el testigo de alerta encendido. Si notas alguno de estos síntomas, visita ${n} en ${c} para una revisión gratuita del sistema de frenado.` },
    ])
  }

  function faqSchema(): string {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    }, null, 2)
  }

  function wpFormat(html: string): string {
    return `<!-- wp:html -->\n${html}\n<!-- /wp:html -->`
  }

  const keywords = SERVICIOS_KEYWORDS.map(s => ciudad ? `${s} en ${ciudad}` : `${s} en [tu ciudad]`)
  const checkProgress = GBP_ITEMS.filter(i => checklist[i.id]).length
  const checkPct = Math.round((checkProgress / GBP_ITEMS.length) * 100)

  return (
    <div>
      {/* Sub-nav */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {([
          { key: 'posicion', label: '🗺️ Posicionamiento', desc: 'Mapa vs competidores' },
          { key: 'articulos', label: '✍️ Artículos', desc: 'IA semanal' },
          { key: 'ficha', label: '📍 Ficha Google', desc: 'Checklist GBP' },
          { key: 'palabras', label: '🔍 Palabras clave', desc: 'SEO + GEO' },
        ] as const).map(s => (
          <button key={s.key} onClick={() => setSeccion(s.key)}
            className="flex flex-col items-start px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all"
            style={{
              background: seccion === s.key ? primario : bg,
              color: seccion === s.key ? botonTexto : texto,
              border: `1px solid ${seccion === s.key ? primario : borde}`,
            }}>
            <span className="font-semibold">{s.label}</span>
            <span className="text-xs opacity-70">{s.desc}</span>
          </button>
        ))}
      </div>

      {/* ══ POSICIONAMIENTO ═══════════════════════════════════════════════════ */}
      {seccion === 'posicion' && (() => {
        // ── helpers ──
        async function analizarTodo() {
          const urls = [
            { nombre: 'Tu taller', url: miUrl, esPropio: true },
            ...posCompetidores.filter(c => c.url.trim()),
          ]
          if (!urls[0].url.trim()) return
          setPosAnalizando(true)
          setPosResultados([])
          setPosProgreso(0)
          setPosTotal(urls.length)
          const resultados: any[] = []
          for (let i = 0; i < urls.length; i++) {
            const item = urls[i]
            try {
              const r = await fetch('/api/analisis/competidor', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: item.url.trim() }),
              })
              const data = await r.json()
              resultados.push({ ...item, ...data, error: data.error || null })
            } catch {
              resultados.push({ ...item, seoScore: 0, geoScore: 0, error: 'Error de red' })
            }
            setPosProgreso(i + 1)
          }
          // Sort by overall score desc
          resultados.sort((a, b) => ((b.seoScore + b.geoScore) / 2) - ((a.seoScore + a.geoScore) / 2))
          setPosResultados(resultados)
          setPosAnalizando(false)
        }

        const yo = posResultados.find(r => r.esPropio)
        const ranked = [...posResultados].sort((a, b) => ((b.seoScore + b.geoScore) / 2) - ((a.seoScore + a.geoScore) / 2))
        const miRank = ranked.findIndex(r => r.esPropio) + 1
        const lider = ranked[0]

        // generate action plan
        const acciones: { key: string; pts: number; title: string; desc: string; effort: string; impact: string }[] = []
        if (yo) {
          for (const sig of HEATMAP_SIGNALS) {
            if (!yo[sig.key]) {
              const plantilla = ACCIONES_PLANTILLA[sig.key]
              if (plantilla) {
                acciones.push({ key: sig.key, pts: sig.seoW + sig.geoW, ...plantilla })
              }
            }
          }
          acciones.sort((a, b) => b.pts - a.pts)
        }

        // cell color for heatmap
        function cellBg(val: boolean, esPropio: boolean): string {
          if (val) return esPropio ? '#16a34a' : '#4ade80'
          return esPropio ? '#dc2626' : '#fca5a5'
        }
        function cellColor(val: boolean): string { return val ? '#fff' : '#fff' }

        const impactColor: Record<string, string> = { Crítico: '#ef4444', Alto: '#f59e0b', Medio: '#3b82f6', Bajo: '#64748b' }
        const impactBg: Record<string, string> = { Crítico: fondoClaro ? '#fef2f2' : 'rgba(239,68,68,0.12)', Alto: fondoClaro ? '#fffbeb' : 'rgba(245,158,11,0.12)', Medio: fondoClaro ? '#eff6ff' : 'rgba(59,130,246,0.12)', Bajo: fondoClaro ? '#f8fafc' : 'rgba(148,163,184,0.1)' }

        const hasResults = posResultados.length > 0

        return (
          <div>
            {/* ── Config ── */}
            {!hasResults && (
              <div>
                <p className="text-sm mb-5" style={{ color: textoSec }}>
                  Introduce tu URL y las de tus competidores directos. Analizaremos todas las señales SEO y GEO para mostrarte un mapa de calor, tu posición real y el plan de acción exacto para llegar al #1.
                </p>

                {/* Mi URL */}
                <div className="rounded-xl p-4 mb-3" style={{ border: `2px solid ${primario}`, background: bg }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ background: primario, color: botonTexto }}>Tú</span>
                    <p className="text-sm font-semibold" style={{ color: texto }}>Tu taller</p>
                  </div>
                  <input value={miUrl} onChange={e => setMiUrl(e.target.value)}
                    placeholder="https://tu-taller.es"
                    className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
                    style={{ border: `1px solid ${borde}`, background: 'transparent', color: texto }} />
                </div>

                {/* Competidores */}
                {posCompetidores.map((c, i) => (
                  <div key={i} className="rounded-xl p-4 mb-3" style={{ border: `1px solid ${borde}`, background: bg }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 text-white"
                        style={{ background: ['#6366f1','#f59e0b','#10b981','#ec4899','#06b6d4'][i] || '#64748b' }}>{i + 1}</span>
                      <input value={c.nombre} onChange={e => { const n = [...posCompetidores]; n[i] = { ...n[i], nombre: e.target.value }; setPosCompetidores(n) }}
                        className="text-sm font-semibold bg-transparent focus:outline-none flex-1"
                        style={{ color: texto }} placeholder={`Competidor ${i + 1}`} />
                      <button onClick={() => setPosCompetidores(posCompetidores.filter((_, j) => j !== i))}
                        className="text-xs px-2 py-1 rounded" style={{ color: '#ef4444', border: '1px solid #fecaca' }}>✕</button>
                    </div>
                    <div className="flex gap-2">
                      <input value={c.url} onChange={e => { const n = [...posCompetidores]; n[i] = { ...n[i], url: e.target.value }; setPosCompetidores(n) }}
                        placeholder="https://competidor.es"
                        className="flex-1 text-sm rounded-lg px-3 py-2 focus:outline-none"
                        style={{ border: `1px solid ${borde}`, background: 'transparent', color: texto }} />
                      {c.nombre && (
                        <a href={`https://www.google.com/search?q=${encodeURIComponent(c.nombre + ' taller ' + (ciudad || ''))}`} target="_blank" rel="noreferrer"
                          className="text-xs px-3 py-2 rounded-lg flex-shrink-0 flex items-center"
                          style={{ border: `1px solid ${borde}`, color: textoSec }}>🔍</a>
                      )}
                    </div>
                  </div>
                ))}

                {posCompetidores.length < 7 && (
                  <button onClick={() => setPosCompetidores([...posCompetidores, { nombre: `Competidor ${posCompetidores.length + 1}`, url: '' }])}
                    className="w-full py-2.5 rounded-xl text-sm mb-4"
                    style={{ border: `1px dashed ${borde}`, color: textoSec }}>
                    + Añadir competidor
                  </button>
                )}

                <button onClick={analizarTodo}
                  disabled={posAnalizando || !miUrl.trim()}
                  className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ background: boton, color: botonTexto }}>
                  {posAnalizando ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                      Analizando… {posProgreso}/{posTotal}
                    </>
                  ) : '🗺️ Analizar posicionamiento'}
                </button>

                {/* Progress bar mientras analiza */}
                {posAnalizando && posTotal > 0 && (
                  <div className="mt-4">
                    <div className="h-2 rounded-full" style={{ background: borde }}>
                      <div className="h-2 rounded-full transition-all" style={{ width: `${(posProgreso / posTotal) * 100}%`, background: primario }} />
                    </div>
                    <p className="text-xs text-center mt-1" style={{ color: textoSec }}>Analizando web {posProgreso} de {posTotal}…</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Results ── */}
            {hasResults && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <p className="text-xs tracking-widest uppercase font-semibold" style={{ color: textoSec }}>Resultados del análisis</p>
                  <button onClick={() => { setPosResultados([]); setPosProgreso(0) }}
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{ border: `1px solid ${borde}`, color: textoSec }}>
                    ↺ Volver a configurar
                  </button>
                </div>

                {/* ── Ranking numérico ── */}
                <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: `repeat(${Math.min(ranked.length, 4)}, 1fr)` }}>
                  {ranked.map((r, i) => {
                    const overall = Math.round((r.seoScore + r.geoScore) / 2)
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`
                    const isMe = r.esPropio
                    return (
                      <div key={i} className="rounded-2xl p-4 text-center relative"
                        style={{ border: `2px solid ${isMe ? primario : borde}`, background: isMe ? primario + '14' : bg }}>
                        {isMe && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 rounded-full font-bold text-white" style={{ background: primario }}>TÚ</span>}
                        <div className="text-2xl mb-1">{medal}</div>
                        <p className="text-xs font-medium truncate mb-2" style={{ color: texto }}>{r.nombre}</p>
                        {/* Score ring SVG */}
                        <div className="flex justify-center mb-2">
                          <svg width="64" height="64" viewBox="0 0 64 64">
                            <circle cx="32" cy="32" r="27" fill="none" stroke={borde} strokeWidth="7"/>
                            <circle cx="32" cy="32" r="27" fill="none"
                              stroke={overall >= 70 ? '#22c55e' : overall >= 45 ? '#f59e0b' : '#ef4444'}
                              strokeWidth="7" strokeLinecap="round"
                              strokeDasharray={`${(overall / 100) * 169.6} 169.6`}
                              transform="rotate(-90 32 32)"/>
                            <text x="32" y="37" textAnchor="middle" fontSize="16" fontWeight="bold" fill={texto}>{overall}</text>
                          </svg>
                        </div>
                        <div className="flex justify-center gap-2 text-xs">
                          <span style={{ color: '#3b82f6' }}>SEO {r.seoScore}</span>
                          <span style={{ color: textoSec }}>·</span>
                          <span style={{ color: '#10b981' }}>GEO {r.geoScore}</span>
                        </div>
                        {r.error && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>⚠️ {r.error.slice(0, 30)}</p>}
                      </div>
                    )
                  })}
                </div>

                {/* ── Mi posición destacada ── */}
                {yo && (
                  <div className="rounded-2xl p-5 mb-6 flex items-center gap-5"
                    style={{ background: `linear-gradient(135deg, ${primario}22, ${primario}08)`, border: `1px solid ${primario}50` }}>
                    <div className="text-center flex-shrink-0">
                      <p className="text-5xl font-black" style={{ color: primario }}>#{miRank}</p>
                      <p className="text-xs font-semibold mt-1" style={{ color: textoSec }}>tu posición</p>
                    </div>
                    <div className="flex-1">
                      {miRank === 1 ? (
                        <p className="text-sm font-bold mb-1" style={{ color: texto }}>🏆 ¡Lideras el ranking!</p>
                      ) : (
                        <p className="text-sm font-bold mb-1" style={{ color: texto }}>
                          {miRank - 1} competidor{miRank > 2 ? 'es' : ''} por delante
                        </p>
                      )}
                      <div className="flex gap-4">
                        <div>
                          <p className="text-xs" style={{ color: textoSec }}>Tu SEO</p>
                          <p className="text-lg font-bold" style={{ color: '#3b82f6' }}>{yo.seoScore}<span className="text-xs font-normal">/100</span></p>
                        </div>
                        <div>
                          <p className="text-xs" style={{ color: textoSec }}>Tu GEO</p>
                          <p className="text-lg font-bold" style={{ color: '#10b981' }}>{yo.geoScore}<span className="text-xs font-normal">/100</span></p>
                        </div>
                        {lider && !lider.esPropio && (
                          <div>
                            <p className="text-xs" style={{ color: textoSec }}>Líder</p>
                            <p className="text-lg font-bold" style={{ color: texto }}>{Math.round((lider.seoScore + lider.geoScore) / 2)}<span className="text-xs font-normal">/100</span></p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Mapa de calor ── */}
                <div className="rounded-2xl overflow-hidden mb-6" style={{ border: `1px solid ${borde}` }}>
                  <div className="px-4 py-3" style={{ background: fondoClaro ? '#f8fafc' : 'rgba(255,255,255,0.04)', borderBottom: `1px solid ${borde}` }}>
                    <p className="text-xs tracking-widest uppercase font-semibold" style={{ color: textoSec }}>🗺️ Mapa de calor de señales</p>
                    <p className="text-xs mt-0.5" style={{ color: textoSec }}>Verde = activo · Rojo = ausente</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs" style={{ minWidth: 500 }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${borde}` }}>
                          <th className="text-left px-4 py-2.5 font-semibold w-40" style={{ color: textoSec }}>Señal</th>
                          {ranked.map((r, i) => (
                            <th key={i} className="px-2 py-2.5 text-center font-semibold" style={{ color: r.esPropio ? primario : textoSec, background: r.esPropio ? primario + '10' : 'transparent' }}>
                              {r.esPropio ? '⭐ Tú' : r.nombre.split(' ')[0]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* SEO signals group */}
                        <tr style={{ background: fondoClaro ? '#f1f5f9' : 'rgba(59,130,246,0.06)' }}>
                          <td colSpan={ranked.length + 1} className="px-4 py-1.5 font-bold text-xs tracking-widest uppercase" style={{ color: '#3b82f6' }}>
                            SEO
                          </td>
                        </tr>
                        {HEATMAP_SIGNALS.filter(s => s.cat === 'seo').map(sig => (
                          <tr key={sig.key} style={{ borderBottom: `1px solid ${borde}` }}>
                            <td className="px-4 py-2 font-medium" style={{ color: texto }}>{sig.label}</td>
                            {ranked.map((r, i) => {
                              const val = !!r[sig.key]
                              return (
                                <td key={i} className="px-2 py-2 text-center"
                                  style={{ background: r.esPropio ? primario + '10' : 'transparent' }}>
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-bold"
                                    style={{ background: cellBg(val, r.esPropio), color: '#fff' }}>
                                    {val ? '✓' : '✗'}
                                  </span>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                        {/* GEO signals group */}
                        <tr style={{ background: fondoClaro ? '#f0fdf4' : 'rgba(16,185,129,0.06)' }}>
                          <td colSpan={ranked.length + 1} className="px-4 py-1.5 font-bold text-xs tracking-widest uppercase" style={{ color: '#10b981' }}>
                            GEO
                          </td>
                        </tr>
                        {HEATMAP_SIGNALS.filter(s => s.cat === 'geo').map(sig => (
                          <tr key={sig.key} style={{ borderBottom: `1px solid ${borde}` }}>
                            <td className="px-4 py-2 font-medium" style={{ color: texto }}>{sig.label}</td>
                            {ranked.map((r, i) => {
                              const val = !!r[sig.key]
                              return (
                                <td key={i} className="px-2 py-2 text-center"
                                  style={{ background: r.esPropio ? primario + '10' : 'transparent' }}>
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-bold"
                                    style={{ background: cellBg(val, r.esPropio), color: '#fff' }}>
                                    {val ? '✓' : '✗'}
                                  </span>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                        {/* Score row */}
                        <tr style={{ background: fondoClaro ? '#f8fafc' : 'rgba(255,255,255,0.04)', borderTop: `2px solid ${borde}` }}>
                          <td className="px-4 py-3 font-bold text-xs" style={{ color: textoSec }}>TOTAL</td>
                          {ranked.map((r, i) => (
                            <td key={i} className="px-2 py-3 text-center" style={{ background: r.esPropio ? primario + '10' : 'transparent' }}>
                              <div>
                                <span className="font-black text-sm" style={{ color: r.esPropio ? primario : texto }}>
                                  {Math.round((r.seoScore + r.geoScore) / 2)}
                                </span>
                                <span className="text-xs" style={{ color: textoSec }}>/100</span>
                              </div>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── Plan de acción ── */}
                {yo && acciones.length > 0 && (
                  <div className="rounded-2xl overflow-hidden mb-5" style={{ border: `1px solid ${borde}` }}>
                    <div className="px-5 py-4 flex items-center gap-3" style={{ background: fondoClaro ? '#f8fafc' : 'rgba(255,255,255,0.04)', borderBottom: `1px solid ${borde}` }}>
                      <div>
                        <p className="text-sm font-bold" style={{ color: texto }}>🚀 Plan de acción para llegar al #1</p>
                        <p className="text-xs mt-0.5" style={{ color: textoSec }}>{acciones.length} acciones ordenadas por impacto · +{acciones.reduce((s, a) => s + a.pts, 0)} puntos potenciales</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      {acciones.map((acc, i) => (
                        <div key={acc.key} className="rounded-xl p-4" style={{ background: impactBg[acc.impact] || bgSec, border: `1px solid ${borde}` }}>
                          <div className="flex items-start gap-3">
                            <span className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black text-white"
                              style={{ background: impactColor[acc.impact] || '#64748b' }}>{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <p className="text-sm font-semibold" style={{ color: texto }}>{acc.title}</p>
                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white"
                                  style={{ background: impactColor[acc.impact] || '#64748b' }}>{acc.impact}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ background: borde, color: textoSec }}>⏱ {acc.effort}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                  style={{ background: fondoClaro ? '#eff6ff' : 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>+{acc.pts} pts</span>
                              </div>
                              <p className="text-xs leading-relaxed" style={{ color: textoSec }}>{acc.desc}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {miRank === 1 && (
                      <div className="px-5 pb-4">
                        <div className="rounded-xl p-4 text-center" style={{ background: fondoClaro ? '#f0fdf4' : 'rgba(34,197,94,0.1)', border: '1px solid #22c55e' }}>
                          <p className="text-2xl mb-1">🏆</p>
                          <p className="text-sm font-bold" style={{ color: '#22c55e' }}>¡Eres el #1 en tu análisis!</p>
                          <p className="text-xs mt-1" style={{ color: textoSec }}>Trabaja en las señales que aún faltan para consolidar tu ventaja y dificultar que te superen.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {yo && acciones.length === 0 && (
                  <div className="rounded-2xl p-6 text-center mb-5" style={{ border: '1px solid #22c55e', background: fondoClaro ? '#f0fdf4' : 'rgba(34,197,94,0.08)' }}>
                    <p className="text-3xl mb-2">🏆</p>
                    <p className="font-bold" style={{ color: '#22c55e' }}>Puntuación SEO/GEO perfecta</p>
                    <p className="text-xs mt-1" style={{ color: textoSec }}>Tienes todas las señales activas. Mantén la ficha Google actualizada y sigue generando reseñas para consolidar el #1.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {/* ══ ARTÍCULOS ══════════════════════════════════════════════════════════ */}
      {seccion === 'articulos' && (
        <div>
          <p className="text-sm mb-6" style={{ color: textoSec }}>
            Genera artículos de blog optimizados para SEO local con IA. Revísalos, edítalos y publícalos en tu web para mejorar tu posicionamiento en Google.
          </p>

          {/* Article editor */}
          {articuloActual ? (
            <div className="mb-6 rounded-2xl overflow-hidden" style={{ border: `2px solid ${primario}` }}>
              <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ background: primario + '12', borderBottom: `1px solid ${primario}30` }}>
                <div className="flex items-center gap-3 min-w-0">
                  <EstadoBadge estado={articuloActual.estado} />
                  <p className="text-sm font-semibold truncate" style={{ color: texto }}>{articuloActual.tema}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setVistaPrevia(v => !v)} className="text-xs px-3 py-1.5 rounded-lg" style={{ border: `1px solid ${borde}`, color: textoSec }}>
                    {vistaPrevia ? 'Editar HTML' : 'Vista previa'}
                  </button>
                  <button onClick={() => setArticuloActual(null)} className="text-xs px-2.5 py-1.5 rounded-lg" style={{ border: `1px solid ${borde}`, color: textoSec }}>✕</button>
                </div>
              </div>

              <div className="p-5" style={{ background: bg }}>
                {vistaPrevia ? (
                  <div
                    className="rounded-xl p-5 text-sm leading-relaxed overflow-auto"
                    style={{ border: `1px solid ${borde}`, background: fondoClaro ? '#fff' : bgSec, color: texto, maxHeight: 400 }}
                    dangerouslySetInnerHTML={{ __html: contenidoEditado }}
                  />
                ) : (
                  <textarea
                    value={contenidoEditado}
                    onChange={e => setContenidoEditado(e.target.value)}
                    rows={16}
                    className="w-full text-xs font-mono rounded-xl px-4 py-3 focus:outline-none resize-none"
                    style={{ border: `1px solid ${borde}`, background: bgSec, color: texto }}
                    spellCheck={false}
                  />
                )}

                {msgArticle && (
                  <p className="text-sm mt-3" style={{ color: msgArticle.startsWith('✓') ? '#10b981' : '#ef4444' }}>{msgArticle}</p>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={aprobarArticulo}
                    disabled={guardando || articuloActual.estado === 'aprobado'}
                    className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                    style={{ background: boton, color: botonTexto }}>
                    {guardando ? 'Guardando…' : articuloActual.estado === 'aprobado' ? '✓ Aprobado' : '✅ Aprobar artículo'}
                  </button>
                  <CopyBtn text={contenidoEditado} label="Copiar HTML" />
                  <CopyBtn text={wpFormat(contenidoEditado)} label="📋 WordPress" />
                  {articuloActual.estado === 'aprobado' && (
                    <button onClick={() => marcarPublicado(articuloActual.id)}
                      className="px-3 py-2 rounded-xl text-sm font-semibold"
                      style={{ background: '#dbeafe', color: '#1e40af' }}>
                      🌐 Marcar publicado
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Topic selector */
            <div className="mb-6 rounded-2xl p-5" style={{ border: `1px solid ${borde}`, background: bg }}>
              <p className="text-xs tracking-widest uppercase mb-4 font-semibold" style={{ color: textoSec }}>Elige un tema</p>

              {TEMAS.map(cat => (
                <div key={cat.cat} className="mb-3">
                  <button
                    onClick={() => setCatAbierta(catAbierta === cat.cat ? null : cat.cat)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ background: bgSec, border: `1px solid ${borde}`, color: texto }}>
                    <span>{cat.emoji} {cat.cat}</span>
                    <span style={{ color: textoSec }}>{catAbierta === cat.cat ? '▲' : '▼'}</span>
                  </button>
                  {catAbierta === cat.cat && (
                    <div className="mt-2 pl-2 space-y-1.5">
                      {cat.items.map(tema => (
                        <button key={tema}
                          onClick={() => setTemaSeleccionado(temaSeleccionado === tema ? '' : tema)}
                          className="w-full text-left text-sm px-4 py-2.5 rounded-xl transition-all"
                          style={{
                            background: temaSeleccionado === tema ? primario : bgSec,
                            color: temaSeleccionado === tema ? botonTexto : texto,
                            border: `1px solid ${temaSeleccionado === tema ? primario : borde}`,
                          }}>
                          {temaSeleccionado === tema ? '✓ ' : ''}{tema}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${borde}` }}>
                <p className="text-xs tracking-widest uppercase mb-2 font-semibold" style={{ color: textoSec }}>O escribe tu propio tema</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={temaPersonalizado}
                    onChange={e => setTemaPersonalizado(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && generarArticulo()}
                    placeholder="Ej: Cómo elegir neumáticos para lluvia"
                    className="flex-1 bg-transparent rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                    style={{ border: `1px solid ${borde}`, color: texto }}
                  />
                </div>
              </div>

              {msgArticle && <p className="text-sm mt-3" style={{ color: '#ef4444' }}>{msgArticle}</p>}

              <button
                onClick={generarArticulo}
                disabled={generando || (!temaSeleccionado && !temaPersonalizado.trim())}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all"
                style={{ background: boton, color: botonTexto }}>
                {generando ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Generando artículo con IA…
                  </>
                ) : '✍️ Generar artículo con IA'}
              </button>
            </div>
          )}

          {/* Articles list */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs tracking-widest uppercase font-semibold" style={{ color: textoSec }}>
              Artículos generados ({articles.length})
            </p>
            <p className="text-xs" style={{ color: textoSec }}>
              {articles.filter(a => a.estado === 'publicado').length} publicados · {articles.filter(a => a.estado === 'aprobado').length} aprobados
            </p>
          </div>

          {cargandoArticles ? (
            <p className="text-sm" style={{ color: textoSec }}>Cargando…</p>
          ) : articles.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ border: `1px dashed ${borde}` }}>
              <p className="text-2xl mb-2">✍️</p>
              <p className="text-sm font-medium mb-1" style={{ color: texto }}>Aún no hay artículos</p>
              <p className="text-xs" style={{ color: textoSec }}>Selecciona un tema y pulsa "Generar artículo con IA"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map(a => (
                <div key={a.id} className="rounded-xl p-4" style={{ border: `1px solid ${borde}`, background: bg }}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mb-1 truncate" style={{ color: texto }}>{a.tema}</p>
                      <div className="flex items-center gap-2">
                        <EstadoBadge estado={a.estado} />
                        <p className="text-xs" style={{ color: textoSec }}>
                          {new Date(a.creado_en).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                      <button
                        onClick={() => { setArticuloActual(a); setContenidoEditado(a.contenido); setVistaPrevia(true); setMsgArticle('') }}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium"
                        style={{ border: `1px solid ${primario}`, color: primario }}>
                        Abrir
                      </button>
                      <CopyBtn text={a.contenido} label="HTML" />
                      <CopyBtn text={wpFormat(a.contenido)} label="WP" />
                      {a.estado === 'aprobado' && (
                        <button onClick={() => marcarPublicado(a.id)}
                          className="text-xs px-3 py-1.5 rounded-lg"
                          style={{ background: '#dbeafe', color: '#1e40af' }}>
                          Publicado
                        </button>
                      )}
                      <button onClick={() => eliminarArticulo(a.id)}
                        className="text-xs px-2.5 py-1.5 rounded-lg"
                        style={{ color: '#ef4444', border: '1px solid #fecaca' }}>
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ FICHA GOOGLE ══════════════════════════════════════════════════════ */}
      {seccion === 'ficha' && (
        <div>
          <p className="text-sm mb-6" style={{ color: textoSec }}>
            Optimiza tu Ficha de Empresa en Google Business Profile para aparecer en el paquete local de Maps y en búsquedas &ldquo;cerca de mí&rdquo;.
          </p>

          {/* Progress */}
          <div className="rounded-2xl p-5 mb-6" style={{ border: `1px solid ${borde}`, background: bg }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs tracking-widest uppercase font-semibold" style={{ color: textoSec }}>Optimización GBP</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold" style={{ color: checkProgress === GBP_ITEMS.length ? '#10b981' : primario }}>{checkPct}%</span>
              </div>
            </div>
            <div className="h-3 rounded-full mb-6" style={{ background: borde }}>
              <div className="h-3 rounded-full transition-all" style={{ width: `${checkPct}%`, background: checkProgress === GBP_ITEMS.length ? '#10b981' : primario }} />
            </div>

            <div className="space-y-3">
              {GBP_ITEMS.map(item => (
                <div key={item.id} className="flex items-start gap-3">
                  <button
                    onClick={() => toggleCheck(item.id)}
                    className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center mt-0.5 transition-all"
                    style={{ background: checklist[item.id] ? primario : 'transparent', border: `2px solid ${checklist[item.id] ? primario : borde}` }}>
                    {checklist[item.id] && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug" style={{ color: checklist[item.id] ? textoSec : texto, textDecoration: checklist[item.id] ? 'line-through' : 'none' }}>
                      {item.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: textoSec }}>{item.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Schema markup */}
          <div className="rounded-2xl p-5 mb-6" style={{ border: `1px solid ${borde}`, background: bg }}>
            <p className="text-xs tracking-widest uppercase mb-1 font-semibold" style={{ color: textoSec }}>Schema Markup JSON-LD</p>
            <p className="text-xs mb-4 leading-relaxed" style={{ color: textoSec }}>
              Copia este código en el <code className="px-1 rounded" style={{ background: bgSec }}>&lt;head&gt;</code> de tu web. Le dice a Google y a los motores de IA exactamente qué tipo de negocio eres y dónde estás.
            </p>
            <pre className="text-xs rounded-xl p-4 mb-3 overflow-auto" style={{ background: bgSec, color: texto, border: `1px solid ${borde}`, maxHeight: 280, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {generarSchema()}
            </pre>
            <CopyBtn text={generarSchema()} label="Copiar JSON-LD" />
          </div>

          {/* NAP + tips */}
          <div className="rounded-2xl p-5" style={{ border: `1px solid ${borde}`, background: bg }}>
            <p className="text-xs tracking-widest uppercase mb-4 font-semibold" style={{ color: textoSec }}>Guía: cómo entrar en el Google Maps Pack</p>
            <div className="space-y-3">
              {[
                { n: '1', title: 'Consistencia NAP', desc: 'Nombre, Dirección y Teléfono idénticos en tu web, Google, Páginas Amarillas, Yelp, Foursquare y cualquier directorio. Una sola variación penaliza tu relevancia.' },
                { n: '2', title: 'Relevancia', desc: 'Tus categorías, descripción y servicios deben coincidir con lo que buscan los usuarios. Añade cada servicio individualmente en la sección "Servicios" de tu Ficha.' },
                { n: '3', title: 'Reseñas recientes', desc: '50+ reseñas con media ≥4.5 son el factor diferencial. Google premia la velocidad de obtención: conseguir 5 reseñas en un mes vale más que 20 en un año.' },
                { n: '4', title: 'Fotos activas', desc: 'Sube mínimo 3 fotos nuevas por semana. Google registra la actividad de tu ficha y favorece a los negocios que la actualizan regularmente.' },
                { n: '5', title: 'Publicaciones semanales', desc: 'Las publicaciones de "Novedades" y "Ofertas" en Google Business aumentan la visibilidad hasta un 30% más en búsquedas locales según estudios de Whitespark.' },
              ].map(tip => (
                <div key={tip.n} className="flex gap-3 rounded-xl p-3" style={{ background: bgSec, border: `1px solid ${borde}` }}>
                  <span className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ background: primario }}>{tip.n}</span>
                  <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: texto }}>{tip.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: textoSec }}>{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ PALABRAS CLAVE ════════════════════════════════════════════════════ */}
      {seccion === 'palabras' && (
        <div>
          <p className="text-sm mb-6" style={{ color: textoSec }}>
            Keywords locales para posicionarte en Google y en motores de IA generativa (ChatGPT, Perplexity, Gemini).
          </p>

          {/* City */}
          <div className="rounded-2xl p-5 mb-5" style={{ border: `1px solid ${borde}`, background: bg }}>
            <p className="text-xs tracking-widest uppercase mb-2 font-semibold" style={{ color: textoSec }}>Tu ciudad objetivo</p>
            <input type="text" value={ciudad} onChange={e => setCiudad(e.target.value)}
              placeholder="Ej: Zaragoza, Málaga, Bilbao…"
              className="w-full bg-transparent rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              style={{ border: `1px solid ${borde}`, color: texto }} />
          </div>

          {/* Keywords */}
          <div className="rounded-2xl p-5 mb-5" style={{ border: `1px solid ${borde}`, background: bg }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs tracking-widest uppercase font-semibold" style={{ color: textoSec }}>Keywords locales ({keywords.length})</p>
              <CopyBtn text={keywords.join('\n')} label="Copiar todas" />
            </div>
            <div className="space-y-1.5">
              {keywords.map((kw, i) => (
                <div key={i} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg" style={{ background: bgSec, border: `1px solid ${borde}` }}>
                  <p className="text-sm flex-1" style={{ color: texto }}>{kw}</p>
                  <CopyBtn text={kw} label="Copiar" />
                </div>
              ))}
            </div>
          </div>

          {/* GEO tips */}
          <div className="rounded-2xl p-5 mb-5" style={{ border: `1px solid ${borde}`, background: bg }}>
            <p className="text-xs tracking-widest uppercase mb-4 font-semibold" style={{ color: textoSec }}>GEO: Cómo aparecer en ChatGPT, Perplexity y Gemini</p>
            <div className="space-y-3">
              {[
                { e: '📝', t: 'Contenido de autoridad', d: 'Los LLMs citan fuentes que responden preguntas con detalle. Publica artículos que respondan "¿Cuánto cuesta X en [ciudad]?" con datos reales y específicos.' },
                { e: '🔗', t: 'Menciones en medios digitales', d: 'Aparece en blogs de automoción, directorios especializados y notas de prensa locales. Los modelos de IA aprenden de texto web; más menciones = mayor autoridad.' },
                { e: '❓', t: 'FAQs con respuestas largas y locales', d: 'Las preguntas con respuestas detalladas y localizadas tienen más posibilidades de ser citadas por la IA cuando alguien pregunta sobre talleres en tu ciudad.' },
                { e: '📊', t: 'Schema markup y datos estructurados', d: 'El JSON-LD de LocalBusiness/AutoRepair ayuda a que los modelos de IA comprendan tu negocio. Es el "idioma" que hablan los LLMs con la web.' },
                { e: '⭐', t: 'Reseñas numerosas y recientes', d: 'Perplexity y Google AI Overview priorizan negocios con alta calificación. Media 4.5+ con 100+ reseñas recientes te posiciona como referencia local en resultados de IA.' },
              ].map(tip => (
                <div key={tip.e} className="flex gap-3 rounded-xl p-4" style={{ background: bgSec, border: `1px solid ${borde}` }}>
                  <span className="text-xl flex-shrink-0">{tip.e}</span>
                  <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: texto }}>{tip.t}</p>
                    <p className="text-xs leading-relaxed" style={{ color: textoSec }}>{tip.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ generator */}
          <div className="rounded-2xl p-5" style={{ border: `1px solid ${borde}`, background: bg }}>
            <p className="text-xs tracking-widest uppercase mb-1 font-semibold" style={{ color: textoSec }}>Generador de FAQs</p>
            <p className="text-xs mb-4 leading-relaxed" style={{ color: textoSec }}>
              Genera preguntas frecuentes para {ciudad || 'tu ciudad'} e incrústalas en tu web con Schema FAQPage. Mejora la visibilidad en Google y en la IA.
            </p>
            <button
              onClick={generarFaqs}
              disabled={!ciudad}
              className="px-4 py-2 rounded-xl text-sm font-semibold mb-5 disabled:opacity-40"
              style={{ background: boton, color: botonTexto }}>
              {faqs.length > 0 ? 'Regenerar FAQs' : 'Generar FAQs'}
            </button>

            {faqs.length > 0 && (
              <>
                <div className="space-y-3 mb-4">
                  {faqs.map((faq, i) => (
                    <div key={i} className="rounded-xl p-4" style={{ background: bgSec, border: `1px solid ${borde}` }}>
                      <p className="text-sm font-semibold mb-1.5" style={{ color: texto }}>❓ {faq.q}</p>
                      <p className="text-xs leading-relaxed" style={{ color: textoSec }}>💬 {faq.a}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <CopyBtn text={faqSchema()} label="Copiar JSON-LD FAQPage" />
                  <CopyBtn text={faqs.map(f => `P: ${f.q}\nR: ${f.a}`).join('\n\n')} label="Copiar texto plano" />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
