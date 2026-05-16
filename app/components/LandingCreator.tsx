'use client'
import { useState, useMemo, useCallback } from 'react'

interface Servicio { nombre: string; desc: string; icon: string }
interface Faq { q: string; a: string }

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

// ── Servicios por defecto ─────────────────────────────────────────────────────
const SERVICIOS_DEFAULT: Servicio[] = [
  { icon: '🔧', nombre: 'Mecánica general', desc: 'Mantenimiento completo del vehículo con garantía de calidad en cada trabajo.' },
  { icon: '🛢️', nombre: 'Cambio de aceite', desc: 'Cambio de aceite y filtros con lubricantes homologados para tu motor.' },
  { icon: '🛑', nombre: 'Frenos', desc: 'Revisión y sustitución de pastillas, discos y líquido de frenos.' },
  { icon: '⚙️', nombre: 'Diagnosis', desc: 'Lectura de errores y diagnosis avanzada con equipos de última generación.' },
  { icon: '📋', nombre: 'Pre-ITV', desc: 'Revisión completa previa a la ITV para que la superes sin suspensos.' },
  { icon: '❄️', nombre: 'Aire acondicionado', desc: 'Recarga y reparación del sistema de climatización de tu vehículo.' },
]

const ICONOS = ['🔧', '⚙️', '🛢️', '🛑', '🔵', '📋', '❄️', '⚡', '🚗', '💻', '🔩', '🔑', '🪛', '🧰', '🛠️']

// ── Colores preset ────────────────────────────────────────────────────────────
const COLORES_PRESET = [
  { label: 'Azul profesional', value: '#1e40af' },
  { label: 'Rojo potencia', value: '#dc2626' },
  { label: 'Verde confianza', value: '#16a34a' },
  { label: 'Negro premium', value: '#18181b' },
  { label: 'Naranja energía', value: '#ea580c' },
  { label: 'Morado moderno', value: '#7c3aed' },
]

// ── Generador de HTML ─────────────────────────────────────────────────────────
function generarHTML(cfg: {
  nombre: string; ciudad: string; direccion: string; telefono: string
  email: string; web: string; horario: string; anos: string; eslogan: string
  color: string; servicios: Servicio[]; faqs: Faq[]
  metaTitulo: string; metaDesc: string; headline: string
}): string {
  const { nombre, ciudad, direccion, telefono, email, web, horario, anos, eslogan, color, servicios, faqs, metaTitulo, metaDesc, headline } = cfg
  const tel = telefono.replace(/\s/g, '')
  const h1 = headline || `Taller Mecánico en ${ciudad} — ${nombre}`
  const title = metaTitulo || `${nombre} | Taller Mecánico en ${ciudad}`
  const desc = metaDesc || `${nombre}, taller mecánico de confianza en ${ciudad}. Cambio de aceite, frenos, ITV y mecánica general. Más de ${anos} años de experiencia. ☎ ${telefono}`

  const schema = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'AutoRepair',
    name: nombre, telephone: telefono, email, url: web || '',
    address: { '@type': 'PostalAddress', streetAddress: direccion, addressLocality: ciudad, addressCountry: 'ES' },
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '09:00', closes: '19:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '09:00', closes: '14:00' },
    ],
    areaServed: ciudad, priceRange: '€€',
  }, null, 2)

  const faqSchema = faqs.length ? JSON.stringify({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }, null, 2) : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index, follow">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_ES">
${web ? `<link rel="canonical" href="${web}">` : ''}
<script type="application/ld+json">${schema}</script>
${faqSchema ? `<script type="application/ld+json">${faqSchema}</script>` : ''}
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--c:${color};--cdk:${color}dd;--bg:#fff;--bgsec:#f8fafc;--tx:#111827;--txs:#6b7280;--br:#e5e7eb}
html{scroll-behavior:smooth}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:var(--tx);line-height:1.65}
.wrap{max-width:1100px;margin:0 auto;padding:0 24px}
a{color:inherit;text-decoration:none}
img{max-width:100%}

/* NAV */
nav{background:#fff;border-bottom:1px solid var(--br);position:sticky;top:0;z-index:999;box-shadow:0 1px 8px rgba(0,0,0,.06)}
.nav-in{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;max-width:1100px;margin:0 auto;gap:16px}
.nav-logo{font-size:1.15rem;font-weight:900;color:var(--c)}
.nav-links{display:flex;gap:24px;font-size:.9rem;font-weight:600;color:var(--txs)}
.nav-links a:hover{color:var(--c)}
.nav-cta{background:var(--c);color:#fff;padding:10px 20px;border-radius:50px;font-weight:700;font-size:.9rem;white-space:nowrap}
.nav-cta:hover{opacity:.9}
@media(max-width:640px){.nav-links{display:none}}

/* HERO */
.hero{background:var(--c);color:#fff;padding:90px 24px 80px;text-align:center;position:relative;overflow:hidden}
.hero::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(0,0,0,0) 40%,rgba(0,0,0,.25) 100%);pointer-events:none}
.hero>*{position:relative;z-index:1}
.hero-sub{display:inline-block;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);padding:5px 16px;border-radius:50px;font-size:.85rem;font-weight:600;margin-bottom:20px;letter-spacing:.03em}
.hero h1{font-size:clamp(1.8rem,5vw,3.2rem);font-weight:900;line-height:1.15;max-width:800px;margin:0 auto 18px}
.hero-desc{font-size:1.1rem;opacity:.88;max-width:560px;margin:0 auto 36px}
.btn-hero{display:inline-flex;align-items:center;gap:10px;background:#fff;color:var(--c);padding:16px 36px;border-radius:50px;font-weight:800;font-size:1.05rem;box-shadow:0 6px 24px rgba(0,0,0,.18);transition:transform .15s,box-shadow .15s}
.btn-hero:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(0,0,0,.22)}
.hero-badges{display:flex;gap:12px;justify-content:center;margin-top:28px;flex-wrap:wrap}
.hero-badge{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);padding:7px 16px;border-radius:20px;font-size:.82rem;font-weight:600}

/* SECTIONS */
.sec{padding:80px 24px}
.sec-alt{background:var(--bgsec)}
.sec-h{text-align:center;font-size:clamp(1.5rem,3.5vw,2.2rem);font-weight:900;margin-bottom:12px}
.sec-sub{text-align:center;color:var(--txs);font-size:1rem;margin-bottom:52px;max-width:580px;margin-left:auto;margin-right:auto}
.kw{color:var(--c)}

/* SERVICES */
.srv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:22px}
.srv-card{background:#fff;border:1px solid var(--br);border-radius:18px;padding:28px;transition:box-shadow .2s,border-color .2s}
.srv-card:hover{box-shadow:0 8px 32px rgba(0,0,0,.08);border-color:var(--c)}
.srv-icon{font-size:2.2rem;margin-bottom:14px}
.srv-card h3{font-size:1.05rem;font-weight:800;margin-bottom:8px;color:var(--c)}
.srv-card p{color:var(--txs);font-size:.92rem;line-height:1.6}

/* STATS */
.stats-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:20px}
.stat{text-align:center;padding:32px 16px;background:#fff;border-radius:18px;border:1px solid var(--br)}
.stat-n{font-size:2.6rem;font-weight:900;color:var(--c);line-height:1}
.stat-l{font-size:.85rem;font-weight:600;color:var(--txs);margin-top:8px}

/* PROCESS */
.process{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:24px;counter-reset:step}
.process-item{text-align:center;padding:28px 20px;position:relative}
.process-num{width:52px;height:52px;border-radius:50%;background:var(--c);color:#fff;font-size:1.3rem;font-weight:900;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
.process-item h3{font-weight:700;margin-bottom:8px}
.process-item p{color:var(--txs);font-size:.9rem}

/* FAQ */
details{border:1px solid var(--br);border-radius:14px;margin-bottom:12px;overflow:hidden;background:#fff}
details summary{padding:18px 22px;cursor:pointer;font-weight:700;font-size:.98rem;display:flex;justify-content:space-between;align-items:center;list-style:none;user-select:none}
details summary::-webkit-details-marker{display:none}
details summary::after{content:'+';font-size:1.6rem;color:var(--c);font-weight:300;flex-shrink:0;transition:transform .2s}
details[open] summary{color:var(--c);border-bottom:1px solid var(--br)}
details[open] summary::after{content:'−'}
.faq-a{padding:18px 22px;color:var(--txs);line-height:1.75;font-size:.95rem}

/* CTA BAND */
.cta-band{background:var(--c);color:#fff;padding:64px 24px;text-align:center}
.cta-band h2{font-size:clamp(1.6rem,4vw,2.4rem);font-weight:900;margin-bottom:14px}
.cta-band p{opacity:.88;margin-bottom:32px;font-size:1rem}
.btn-white{display:inline-flex;align-items:center;gap:10px;background:#fff;color:var(--c);padding:16px 36px;border-radius:50px;font-weight:800;font-size:1rem;box-shadow:0 4px 20px rgba(0,0,0,.15)}
.btn-white:hover{opacity:.95}

/* CONTACT */
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:start}
@media(max-width:768px){.contact-grid{grid-template-columns:1fr}}
.contact-info h2{font-size:1.6rem;font-weight:900;margin-bottom:28px}
.c-item{display:flex;gap:14px;margin-bottom:18px;align-items:flex-start}
.c-icon{font-size:1.25rem;flex-shrink:0;margin-top:2px}
.c-item strong{display:block;font-weight:700;margin-bottom:2px}
.c-item span{color:var(--txs);font-size:.92rem}
.c-item a{color:var(--c);font-weight:700}
.btn-contact{display:inline-flex;align-items:center;gap:10px;background:var(--c);color:#fff;padding:14px 30px;border-radius:50px;font-weight:800;margin-top:24px;font-size:.95rem}
.map-box{background:var(--bgsec);border:1px solid var(--br);border-radius:18px;height:300px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}
.map-box-icon{font-size:3rem}
.map-box p{font-size:.9rem;color:var(--txs);text-align:center;padding:0 24px}
.map-box a{color:var(--c);font-weight:700;font-size:.9rem}

/* FOOTER */
footer{background:#111;color:#888;text-align:center;padding:36px 24px;font-size:.83rem}
footer strong{color:#aaa}
footer a{color:var(--c)}
.footer-links{display:flex;gap:20px;justify-content:center;margin-top:12px;flex-wrap:wrap}

@media(max-width:640px){
  .sec{padding:56px 20px}
  .srv-grid{grid-template-columns:1fr}
  .stats-grid{grid-template-columns:repeat(2,1fr)}
}
</style>
</head>
<body>

<!-- NAVEGACIÓN -->
<nav>
  <div class="nav-in">
    <span class="nav-logo">${nombre}</span>
    <div class="nav-links">
      <a href="#servicios">Servicios</a>
      <a href="#faq">FAQ</a>
      <a href="#contacto">Contacto</a>
    </div>
    <a href="tel:${tel}" class="nav-cta">📞 ${telefono || 'Llamar'}</a>
  </div>
</nav>

<!-- HERO -->
<section class="hero" aria-label="Presentación del taller">
  <div class="wrap">
    <p class="hero-sub">🏆 Taller de confianza en ${ciudad}</p>
    <h1>${h1}</h1>
    <p class="hero-desc">${eslogan || `Más de ${anos} años cuidando vehículos en ${ciudad}. Presupuesto gratuito y garantía en todos los trabajos.`}</p>
    <a href="tel:${tel}" class="btn-hero">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11.5 19.79 19.79 0 01.22 2.84 2 2 0 012.18 1h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l1.45-1.45a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>
      Pedir cita — ${telefono || 'Llámanos'}
    </a>
    <div class="hero-badges">
      <span class="hero-badge">✓ ${anos}+ años de experiencia</span>
      <span class="hero-badge">✓ Presupuesto gratuito</span>
      <span class="hero-badge">✓ Garantía en todos los trabajos</span>
      <span class="hero-badge">✓ Diagnóstico digital</span>
    </div>
  </div>
</section>

<!-- ESTADÍSTICAS -->
<section class="sec" aria-label="Números del taller">
  <div class="wrap">
    <div class="stats-grid">
      <div class="stat"><div class="stat-n">${anos}+</div><div class="stat-l">Años de experiencia</div></div>
      <div class="stat"><div class="stat-n">⭐ 5.0</div><div class="stat-l">Valoración media</div></div>
      <div class="stat"><div class="stat-n">0€</div><div class="stat-l">Presupuesto sin compromiso</div></div>
      <div class="stat"><div class="stat-n">100%</div><div class="stat-l">Trabajos con garantía</div></div>
    </div>
  </div>
</section>

<!-- SERVICIOS -->
<section class="sec sec-alt" id="servicios" aria-label="Servicios">
  <div class="wrap">
    <h2 class="sec-h">Nuestros Servicios en <span class="kw">${ciudad}</span></h2>
    <p class="sec-sub">Todo lo que necesita tu vehículo en un solo taller. Mecánicos certificados y herramientas de última generación.</p>
    <div class="srv-grid">
      ${servicios.map(s => `<article class="srv-card">
        <div class="srv-icon">${s.icon}</div>
        <h3>${s.nombre} en ${ciudad}</h3>
        <p>${s.desc}</p>
      </article>`).join('\n      ')}
    </div>
  </div>
</section>

<!-- PROCESO -->
<section class="sec" aria-label="Cómo trabajamos">
  <div class="wrap">
    <h2 class="sec-h">¿Cómo trabajamos?</h2>
    <p class="sec-sub">Un proceso transparente y sin sorpresas para que siempre sepas qué hacemos con tu vehículo</p>
    <div class="process">
      <div class="process-item">
        <div class="process-num">1</div>
        <h3>Pide cita</h3>
        <p>Llámanos o escríbenos. Te atendemos sin esperas y reservamos tu hora.</p>
      </div>
      <div class="process-item">
        <div class="process-num">2</div>
        <h3>Diagnóstico gratuito</h3>
        <p>Revisamos tu vehículo con equipos digitales y te explicamos qué necesita.</p>
      </div>
      <div class="process-item">
        <div class="process-num">3</div>
        <h3>Presupuesto claro</h3>
        <p>Te enviamos el presupuesto detallado antes de empezar. Sin sorpresas.</p>
      </div>
      <div class="process-item">
        <div class="process-num">4</div>
        <h3>Recoge tu coche</h3>
        <p>Trabajo terminado con garantía y toda la documentación de lo realizado.</p>
      </div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section class="sec sec-alt" id="faq" aria-label="Preguntas frecuentes">
  <div class="wrap">
    <h2 class="sec-h">Preguntas Frecuentes</h2>
    <p class="sec-sub">Todo lo que necesitas saber sobre el taller mecánico más valorado de <span class="kw">${ciudad}</span></p>
    <div style="max-width:780px;margin:0 auto">
      ${faqs.map(f => `<details>
        <summary>${f.q}</summary>
        <div class="faq-a">${f.a}</div>
      </details>`).join('\n      ')}
    </div>
  </div>
</section>

<!-- CTA BAND -->
<section class="cta-band" aria-label="Llamada a la acción">
  <div class="wrap">
    <h2>¿Tu coche necesita revisión?</h2>
    <p>Contacta ahora y te damos cita el mismo día. Primera revisión gratuita.</p>
    <a href="tel:${tel}" class="btn-white">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11.5 19.79 19.79 0 01.22 2.84 2 2 0 012.18 1h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l1.45-1.45a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>
      Llamar ahora — ${telefono || ciudad}
    </a>
  </div>
</section>

<!-- CONTACTO -->
<section class="sec" id="contacto" aria-label="Información de contacto">
  <div class="wrap">
    <div class="contact-grid">
      <div class="contact-info">
        <h2>Visítanos en ${ciudad}</h2>
        ${direccion ? `<div class="c-item"><span class="c-icon">📍</span><div><strong>Dirección</strong><span>${direccion}, ${ciudad}</span></div></div>` : ''}
        ${telefono ? `<div class="c-item"><span class="c-icon">📞</span><div><strong>Teléfono</strong><a href="tel:${tel}">${telefono}</a></div></div>` : ''}
        ${email ? `<div class="c-item"><span class="c-icon">✉️</span><div><strong>Email</strong><a href="mailto:${email}">${email}</a></div></div>` : ''}
        ${horario ? `<div class="c-item"><span class="c-icon">🕐</span><div><strong>Horario</strong><span>${horario}</span></div></div>` : ''}
        <a href="tel:${tel}" class="btn-contact">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11.5 19.79 19.79 0 01.22 2.84 2 2 0 012.18 1h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l1.45-1.45a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>
          Pedir cita ahora
        </a>
      </div>
      <div class="map-box">
        <div class="map-box-icon">🗺️</div>
        <p><strong>${nombre}</strong><br>${direccion}${ciudad ? ', ' + ciudad : ''}</p>
        ${ciudad ? `<a href="https://maps.google.com/?q=${encodeURIComponent((nombre+' '+ciudad+' '+direccion).trim())}" target="_blank" rel="noopener">Ver en Google Maps →</a>` : ''}
      </div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <p>&copy; ${new Date().getFullYear()} <strong>${nombre}</strong> · Taller mecánico en ${ciudad}${direccion ? ' · ' + direccion : ''}</p>
  <div class="footer-links">
    ${web ? `<a href="${web}">${web}</a>` : ''}
    ${telefono ? `<a href="tel:${tel}">${telefono}</a>` : ''}
    ${email ? `<a href="mailto:${email}">${email}</a>` : ''}
  </div>
</footer>

</body>
</html>`
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function CopyBtn({ text, label }: { text: string; label: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000) }}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
      style={{ borderColor: ok ? '#10b981' : '#e2e8f0', color: ok ? '#10b981' : '#374151', background: ok ? '#f0fdf4' : '#fff' }}>
      {ok ? '✓ Copiado' : label}
    </button>
  )
}

function downloadHTML(html: string, filename: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function LandingCreator({ restaurante, fondo, texto, borde, primario, boton, botonTexto, textoSec, fondoClaro }: Props) {
  const bg = fondoClaro ? '#fff' : 'rgba(255,255,255,0.04)'
  const bgSec = fondoClaro ? '#f8fafc' : 'rgba(255,255,255,0.02)'

  // Datos básicos
  const [nombre, setNombre] = useState(restaurante?.nombre || '')
  const [ciudad, setCiudad] = useState(restaurante?.ciudad_fiscal || restaurante?.provincia || '')
  const [direccion, setDireccion] = useState(restaurante?.direccion || '')
  const [telefono, setTelefono] = useState(restaurante?.telefono || '')
  const [email, setEmail] = useState(restaurante?.email || '')
  const [web, setWeb] = useState(restaurante?.web || '')
  const [horario, setHorario] = useState('Lun–Vie: 9:00–19:00 | Sáb: 9:00–14:00')
  const [anos, setAnos] = useState('10')

  // Contenido
  const [headline, setHeadline] = useState('')
  const [eslogan, setEslogan] = useState('')
  const [color, setColor] = useState('#1e40af')
  const [servicios, setServicios] = useState<Servicio[]>(SERVICIOS_DEFAULT)
  const [faqs, setFaqs] = useState<Faq[]>([
    { q: `¿Dónde está el taller?`, a: `Estamos en ${restaurante?.direccion || 'nuestra dirección'}, ${restaurante?.ciudad_fiscal || 'nuestra ciudad'}. Puedes llegar fácilmente en coche o transporte público.` },
    { q: '¿Necesito cita previa?', a: 'Recomendamos pedir cita para garantizarte atención inmediata, aunque también atendemos sin cita según disponibilidad del día.' },
    { q: '¿Hacéis presupuesto gratuito?', a: 'Sí. Antes de realizar cualquier trabajo te enviamos el presupuesto completo sin compromiso. No empezamos sin tu aprobación.' },
    { q: '¿Qué marcas de vehículos reparáis?', a: 'Trabajamos con todas las marcas: Seat, Volkswagen, Toyota, Ford, Renault, Peugeot, Opel, BMW, Mercedes y muchas más. Tanto gasolina, diésel como híbridos.' },
    { q: '¿Tenéis garantía en los trabajos?', a: 'Todos nuestros trabajos tienen garantía de mano de obra y las piezas cuentan con la garantía del fabricante. Te lo entregamos por escrito.' },
  ])

  // SEO
  const [metaTitulo, setMetaTitulo] = useState('')
  const [metaDesc, setMetaDesc] = useState('')

  // UI
  const [paso, setPaso] = useState<'datos' | 'contenido' | 'seo' | 'preview'>('datos')
  const [vistaPreviewMovil, setVistaPreviewMovil] = useState(false)

  // Modificar servicio
  function updateServicio(idx: number, campo: keyof Servicio, val: string) {
    setServicios(prev => prev.map((s, i) => i === idx ? { ...s, [campo]: val } : s))
  }
  function addServicio() {
    setServicios(prev => [...prev, { icon: '🔧', nombre: 'Nuevo servicio', desc: 'Descripción del servicio.' }])
  }
  function removeServicio(idx: number) {
    setServicios(prev => prev.filter((_, i) => i !== idx))
  }

  // Modificar FAQ
  function updateFaq(idx: number, campo: keyof Faq, val: string) {
    setFaqs(prev => prev.map((f, i) => i === idx ? { ...f, [campo]: val } : f))
  }
  function addFaq() {
    setFaqs(prev => [...prev, { q: '¿Nueva pregunta?', a: 'Respuesta aquí.' }])
  }
  function removeFaq(idx: number) {
    setFaqs(prev => prev.filter((_, i) => i !== idx))
  }

  // Generar HTML
  const html = useMemo(() => generarHTML({
    nombre, ciudad, direccion, telefono, email, web, horario, anos, eslogan, color, servicios, faqs, metaTitulo, metaDesc, headline,
  }), [nombre, ciudad, direccion, telefono, email, web, horario, anos, eslogan, color, servicios, faqs, metaTitulo, metaDesc, headline])

  const filename = `landing-${(nombre || 'taller').toLowerCase().replace(/\s+/g, '-')}.html`

  const pasos = [
    { key: 'datos', label: '1. Datos', icon: '📋' },
    { key: 'contenido', label: '2. Contenido', icon: '✍️' },
    { key: 'seo', label: '3. SEO', icon: '🔍' },
    { key: 'preview', label: '4. Previsualizar', icon: '👁️' },
  ] as const

  return (
    <div>
      <p className="text-sm mb-6" style={{ color: textoSec }}>
        Genera una landing page profesional y optimizada para SEO y GEO. Rellena los datos, previsualiza y descarga el HTML listo para publicar.
      </p>

      {/* Step nav */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {pasos.map(p => (
          <button key={p.key} onClick={() => setPaso(p.key)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all"
            style={{
              background: paso === p.key ? primario : bg,
              color: paso === p.key ? botonTexto : textoSec,
              border: `1px solid ${paso === p.key ? primario : borde}`,
            }}>
            <span>{p.icon}</span>{p.label}
          </button>
        ))}
      </div>

      {/* ── PASO 1: DATOS BÁSICOS ── */}
      {paso === 'datos' && (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{ border: `1px solid ${borde}`, background: bg }}>
            <p className="text-xs tracking-widest uppercase mb-4 font-semibold" style={{ color: textoSec }}>Información del taller</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Nombre del taller *', val: nombre, set: setNombre, ph: 'Taller García' },
                { label: 'Ciudad *', val: ciudad, set: setCiudad, ph: 'Zaragoza' },
                { label: 'Dirección', val: direccion, set: setDireccion, ph: 'Calle Mayor 12' },
                { label: 'Teléfono *', val: telefono, set: setTelefono, ph: '976 000 000' },
                { label: 'Email', val: email, set: setEmail, ph: 'info@taller.com' },
                { label: 'Web (para canonical)', val: web, set: setWeb, ph: 'https://tallergарcia.com' },
                { label: 'Años de experiencia', val: anos, set: setAnos, ph: '10' },
                { label: 'Horario', val: horario, set: setHorario, ph: 'Lun–Vie 9–19 | Sáb 9–14' },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: textoSec }}>{f.label}</p>
                  <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                    className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none bg-transparent"
                    style={{ border: `1px solid ${borde}`, color: texto }} />
                </div>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="rounded-2xl p-5" style={{ border: `1px solid ${borde}`, background: bg }}>
            <p className="text-xs tracking-widest uppercase mb-4 font-semibold" style={{ color: textoSec }}>Color principal</p>
            <div className="flex flex-wrap gap-3 mb-4">
              {COLORES_PRESET.map(c => (
                <button key={c.value} onClick={() => setColor(c.value)}
                  title={c.label}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: c.value, boxShadow: color === c.value ? `0 0 0 3px ${c.value}44, 0 0 0 5px ${c.value}` : 'none' }}>
                  {color === c.value && <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>
              ))}
              <div className="flex items-center gap-2">
                <input type="color" value={color} onChange={e => setColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0.5"
                  style={{ background: 'transparent' }} title="Color personalizado" />
                <span className="text-xs" style={{ color: textoSec }}>Personalizar</span>
              </div>
            </div>
            <div className="rounded-xl py-3 px-4 text-sm font-bold text-white text-center" style={{ background: color }}>
              Vista previa del color — {nombre || 'Tu taller'}
            </div>
          </div>

          <button onClick={() => setPaso('contenido')}
            className="w-full py-3 rounded-xl text-sm font-bold"
            style={{ background: boton, color: botonTexto }}>
            Siguiente: Contenido →
          </button>
        </div>
      )}

      {/* ── PASO 2: CONTENIDO ── */}
      {paso === 'contenido' && (
        <div className="space-y-4">
          {/* Headline */}
          <div className="rounded-2xl p-5" style={{ border: `1px solid ${borde}`, background: bg }}>
            <p className="text-xs tracking-widest uppercase mb-4 font-semibold" style={{ color: textoSec }}>Titular principal (H1)</p>
            <input value={headline} onChange={e => setHeadline(e.target.value)}
              placeholder={`Taller Mecánico en ${ciudad || 'tu ciudad'} — ${nombre || 'Tu taller'}`}
              className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none bg-transparent mb-2"
              style={{ border: `1px solid ${borde}`, color: texto }} />
            <p className="text-xs" style={{ color: textoSec }}>Si lo dejas vacío se genera automáticamente con ciudad + nombre</p>

            <p className="text-xs tracking-widest uppercase mt-4 mb-2 font-semibold" style={{ color: textoSec }}>Eslogan / subtítulo del hero</p>
            <input value={eslogan} onChange={e => setEslogan(e.target.value)}
              placeholder={`Más de ${anos} años cuidando vehículos en ${ciudad || 'tu ciudad'}. Presupuesto gratuito y garantía.`}
              className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none bg-transparent"
              style={{ border: `1px solid ${borde}`, color: texto }} />
          </div>

          {/* Servicios */}
          <div className="rounded-2xl p-5" style={{ border: `1px solid ${borde}`, background: bg }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs tracking-widest uppercase font-semibold" style={{ color: textoSec }}>Servicios ({servicios.length})</p>
              <button onClick={addServicio} className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                style={{ background: primario + '18', color: primario }}>+ Añadir</button>
            </div>
            <div className="space-y-3">
              {servicios.map((s, i) => (
                <div key={i} className="rounded-xl p-3 flex gap-2" style={{ border: `1px solid ${borde}`, background: bgSec }}>
                  {/* Icon picker */}
                  <div className="relative group flex-shrink-0">
                    <button className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: bg, border: `1px solid ${borde}` }}>
                      {s.icon}
                    </button>
                    <div className="absolute top-12 left-0 z-10 hidden group-focus-within:flex flex-wrap gap-1 p-2 rounded-xl shadow-xl w-48"
                      style={{ background: fondoClaro ? '#fff' : '#1e293b', border: `1px solid ${borde}` }}>
                      {ICONOS.map(ic => (
                        <button key={ic} onClick={() => updateServicio(i, 'icon', ic)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-base hover:scale-110 transition-transform"
                          style={{ background: s.icon === ic ? primario + '22' : 'transparent' }}>
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <input value={s.nombre} onChange={e => updateServicio(i, 'nombre', e.target.value)}
                      className="w-full text-sm font-semibold bg-transparent focus:outline-none rounded px-1"
                      style={{ color: texto, borderBottom: `1px solid ${borde}` }} />
                    <input value={s.desc} onChange={e => updateServicio(i, 'desc', e.target.value)}
                      className="w-full text-xs bg-transparent focus:outline-none rounded px-1"
                      style={{ color: textoSec, borderBottom: `1px solid ${borde}` }} />
                  </div>
                  <button onClick={() => removeServicio(i)} className="flex-shrink-0 text-xs px-2 rounded-lg self-start" style={{ color: '#ef4444' }}>✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* FAQs */}
          <div className="rounded-2xl p-5" style={{ border: `1px solid ${borde}`, background: bg }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs tracking-widest uppercase font-semibold" style={{ color: textoSec }}>Preguntas frecuentes ({faqs.length})</p>
              <button onClick={addFaq} className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                style={{ background: primario + '18', color: primario }}>+ Añadir</button>
            </div>
            <div className="space-y-3">
              {faqs.map((f, i) => (
                <div key={i} className="rounded-xl p-3" style={{ border: `1px solid ${borde}`, background: bgSec }}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-1.5">
                      <input value={f.q} onChange={e => updateFaq(i, 'q', e.target.value)}
                        className="w-full text-sm font-semibold bg-transparent focus:outline-none"
                        style={{ color: texto, borderBottom: `1px solid ${borde}` }} />
                      <textarea value={f.a} onChange={e => updateFaq(i, 'a', e.target.value)} rows={2}
                        className="w-full text-xs bg-transparent focus:outline-none resize-none"
                        style={{ color: textoSec, borderBottom: `1px solid ${borde}` }} />
                    </div>
                    <button onClick={() => removeFaq(i)} className="text-xs flex-shrink-0" style={{ color: '#ef4444' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setPaso('datos')} className="flex-1 py-3 rounded-xl text-sm font-bold"
              style={{ border: `1px solid ${borde}`, color: textoSec }}>← Atrás</button>
            <button onClick={() => setPaso('seo')} className="flex-1 py-3 rounded-xl text-sm font-bold"
              style={{ background: boton, color: botonTexto }}>Siguiente: SEO →</button>
          </div>
        </div>
      )}

      {/* ── PASO 3: SEO ── */}
      {paso === 'seo' && (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{ border: `1px solid ${borde}`, background: bg }}>
            <p className="text-xs tracking-widest uppercase mb-4 font-semibold" style={{ color: textoSec }}>Meta tags (Google)</p>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold" style={{ color: textoSec }}>Meta título</p>
                <span className="text-xs" style={{ color: (metaTitulo || `${nombre} | Taller Mecánico en ${ciudad}`).length > 60 ? '#ef4444' : textoSec }}>
                  {(metaTitulo || `${nombre} | Taller Mecánico en ${ciudad}`).length}/60
                </span>
              </div>
              <input value={metaTitulo} onChange={e => setMetaTitulo(e.target.value)}
                placeholder={`${nombre || 'Taller'} | Taller Mecánico en ${ciudad || 'Ciudad'}`}
                className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none bg-transparent"
                style={{ border: `1px solid ${borde}`, color: texto }} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold" style={{ color: textoSec }}>Meta descripción</p>
                <span className="text-xs" style={{ color: (metaDesc || '').length > 160 ? '#ef4444' : textoSec }}>
                  {(metaDesc || '').length}/160
                </span>
              </div>
              <textarea value={metaDesc} onChange={e => setMetaDesc(e.target.value)} rows={3}
                placeholder={`${nombre || 'Taller'}, taller mecánico de confianza en ${ciudad || 'tu ciudad'}. Cambio de aceite, frenos, ITV y más. Presupuesto gratuito. ☎ ${telefono || '000 000 000'}`}
                className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none bg-transparent resize-none"
                style={{ border: `1px solid ${borde}`, color: texto }} />
            </div>
          </div>

          {/* Google SERP preview */}
          <div className="rounded-2xl p-5" style={{ border: `1px solid ${borde}`, background: bg }}>
            <p className="text-xs tracking-widest uppercase mb-4 font-semibold" style={{ color: textoSec }}>Vista previa en Google</p>
            <div className="rounded-xl p-4" style={{ background: bgSec, border: `1px solid ${borde}` }}>
              <p className="text-xs mb-1" style={{ color: '#5f6368' }}>{web || `https://www.${(nombre || 'taller').toLowerCase().replace(/\s+/g,'-')}.com`}</p>
              <p className="text-base font-medium mb-1" style={{ color: '#1a0dab' }}>
                {metaTitulo || `${nombre || 'Taller'} | Taller Mecánico en ${ciudad || 'tu ciudad'}`}
              </p>
              <p className="text-sm leading-snug" style={{ color: '#4d5156' }}>
                {(metaDesc || `${nombre || 'Taller'}, taller mecánico de confianza en ${ciudad || 'tu ciudad'}. Cambio de aceite, frenos, ITV y mecánica general. Presupuesto gratuito.`).slice(0, 160)}
              </p>
            </div>
          </div>

          {/* SEO checklist incluido */}
          <div className="rounded-2xl p-5" style={{ border: `1px solid ${borde}`, background: bg }}>
            <p className="text-xs tracking-widest uppercase mb-4 font-semibold" style={{ color: textoSec }}>✅ Incluido automáticamente en tu landing</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Schema AutoRepair (JSON-LD)', 'Schema FAQPage (JSON-LD)', 'Meta title y description',
                'Open Graph tags', 'HTML semántico (H1/H2)', 'Link canonical', 'Móvil responsive',
                'FAQ accordion (sin JS)', 'Proceso de trabajo', 'Link tel: en botones', 'Footer con NAP', 'Google Maps link',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs" style={{ color: textoSec }}>
                  <span style={{ color: '#10b981' }}>✓</span> {item}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setPaso('contenido')} className="flex-1 py-3 rounded-xl text-sm font-bold"
              style={{ border: `1px solid ${borde}`, color: textoSec }}>← Atrás</button>
            <button onClick={() => setPaso('preview')} className="flex-1 py-3 rounded-xl text-sm font-bold"
              style={{ background: boton, color: botonTexto }}>Previsualizar →</button>
          </div>
        </div>
      )}

      {/* ── PASO 4: PREVIEW + EXPORT ── */}
      {paso === 'preview' && (
        <div>
          {/* Export buttons */}
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={() => downloadHTML(html, filename)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: boton, color: botonTexto }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Descargar HTML
            </button>
            <CopyBtn text={html} label="📋 Copiar HTML completo" />
            <button onClick={() => setPaso('datos')} className="px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ border: `1px solid ${borde}`, color: textoSec }}>✏️ Editar</button>
          </div>

          {/* Mobile / Desktop toggle */}
          <div className="flex gap-2 mb-3">
            <button onClick={() => setVistaPreviewMovil(false)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: !vistaPreviewMovil ? primario : 'transparent', color: !vistaPreviewMovil ? botonTexto : textoSec, border: `1px solid ${!vistaPreviewMovil ? primario : borde}` }}>
              🖥️ Escritorio
            </button>
            <button onClick={() => setVistaPreviewMovil(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: vistaPreviewMovil ? primario : 'transparent', color: vistaPreviewMovil ? botonTexto : textoSec, border: `1px solid ${vistaPreviewMovil ? primario : borde}` }}>
              📱 Móvil
            </button>
          </div>

          {/* iFrame preview */}
          <div className="rounded-2xl overflow-hidden flex justify-center" style={{ border: `1px solid ${borde}`, background: '#e5e7eb' }}>
            <div style={{ width: vistaPreviewMovil ? 390 : '100%', transition: 'width .3s' }}>
              <iframe
                srcDoc={html}
                title="Vista previa landing page"
                style={{ width: '100%', height: 640, border: 'none', display: 'block' }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>

          <p className="text-xs text-center mt-3" style={{ color: textoSec }}>
            Descarga el archivo HTML y súbelo a tu servidor web o compártelo con tu diseñador
          </p>
        </div>
      )}
    </div>
  )
}
