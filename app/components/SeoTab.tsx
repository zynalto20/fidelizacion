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

// ── Main export ───────────────────────────────────────────────────────────────
export default function SeoTab({ restaurante, fondo, texto, borde, primario, boton, botonTexto, textoSec, fondoClaro }: Props) {
  const [seccion, setSeccion] = useState<'articulos' | 'ficha' | 'palabras'>('articulos')

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
