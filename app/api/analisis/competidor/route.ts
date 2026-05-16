import { NextResponse } from 'next/server'

// ── Signal extraction from raw HTML ──────────────────────────────────────────
function extractSignals(html: string, url: string) {
  const isHttps = url.startsWith('https://')

  // Meta title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  const metaTituloTexto = titleMatch ? titleMatch[1].trim().replace(/&amp;/g, '&').replace(/&#039;/g, "'") : ''

  // Meta description
  const descMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) ||
    html.match(/<meta[^>]+content=["']([^"']*)[^>]+name=["']description["']/i)
  const metaDescTexto = descMatch ? descMatch[1].trim() : ''

  // H1
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const h1Texto = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim().slice(0, 100) : ''

  // Schema markup
  const schemaLocalBusiness = /"@type"\s*:\s*"(AutoRepair|LocalBusiness|Garage|AutomotiveBusiness|CarRepair|AutoDealer)"/i.test(html)
  const schemaFAQ = /"@type"\s*:\s*"FAQPage"/i.test(html)
  const schemaBreadcrumb = /"@type"\s*:\s*"BreadcrumbList"/i.test(html)
  const schemaOrganization = /"@type"\s*:\s*"Organization"/i.test(html)
  const schemaMatches = html.match(/<script[^>]+type=["']application\/ld\+json["']/ig)
  const totalSchemas = schemaMatches?.length || 0

  // Technical
  const openGraph = /property=["']og:(title|description|type)["']/i.test(html)
  const viewport = /name=["']viewport["']/i.test(html)
  const canonical = /<link[^>]+rel=["']canonical["']/i.test(html)

  // Content signals
  const faqSection = /preguntas\s+frecuentes|secci[oó]n\s+faq|preguntas\s+comunes/i.test(html)
  const hasPhone = /(?:\+34|0034)?\s*[6789]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}/i.test(html)
  const hasAddress = /(?:calle|avda|avenida|plaza|paseo|carretera|c\/|pol[íi]gono|local|nave)\s+[^<]{3,60}/i.test(html)
  const hasGoogleMaps = /maps\.google|google\.com\/maps|maps\.googleapis|goo\.gl\/maps/i.test(html)
  const hasWhatsApp = /wa\.me|whatsapp\.com\/send|api\.whatsapp/i.test(html)
  const hasSocial = /instagram\.com|facebook\.com|tiktok\.com/i.test(html)
  const hasReviews = /rese[ñn]as|valoraciones|opiniones|reviews/i.test(html)
  const hasImages = /<img[^>]+alt=["'][^"']{5,}/i.test(html)

  // ── SEO Score (100 pts) ──────────────────────────────────────────────────
  let seoScore = 0
  seoScore += isHttps ? 15 : 0
  if (metaTituloTexto.length > 0) seoScore += (metaTituloTexto.length >= 20 && metaTituloTexto.length <= 70) ? 15 : 8
  if (metaDescTexto.length > 0) seoScore += (metaDescTexto.length >= 50 && metaDescTexto.length <= 160) ? 15 : 8
  seoScore += h1Texto.length > 0 ? 15 : 0
  seoScore += openGraph ? 10 : 0
  seoScore += viewport ? 10 : 0
  seoScore += schemaLocalBusiness ? 15 : 0
  seoScore += canonical ? 5 : 0
  seoScore = Math.min(100, seoScore)

  // ── GEO Score (100 pts) ──────────────────────────────────────────────────
  let geoScore = 0
  geoScore += schemaLocalBusiness ? 30 : 0
  geoScore += schemaFAQ ? 25 : 0
  geoScore += faqSection ? 10 : 0
  geoScore += hasPhone ? 10 : 0
  geoScore += hasAddress ? 10 : 0
  geoScore += hasGoogleMaps ? 10 : 0
  geoScore += hasReviews ? 5 : 0
  geoScore = Math.min(100, geoScore)

  // ── Radar dimensions (0–100 each) ────────────────────────────────────────
  const radar = {
    metatags: Math.round(((metaTituloTexto.length > 0 ? 1 : 0) + (metaDescTexto.length > 0 ? 1 : 0)) / 2 * 100),
    schema: Math.round(((schemaLocalBusiness ? 1 : 0) + (schemaFAQ ? 1 : 0) + (totalSchemas > 1 ? 0.5 : 0)) / 2.5 * 100),
    tecnico: Math.round(((isHttps ? 1 : 0) + (openGraph ? 1 : 0) + (viewport ? 1 : 0) + (canonical ? 1 : 0)) / 4 * 100),
    contenido: Math.round(((h1Texto.length > 0 ? 1 : 0) + (faqSection ? 1 : 0) + (hasImages ? 1 : 0)) / 3 * 100),
    geo: geoScore,
    local: Math.round(((hasPhone ? 1 : 0) + (hasAddress ? 1 : 0) + (hasGoogleMaps ? 1 : 0)) / 3 * 100),
  }

  return {
    https: isHttps,
    metaTitulo: metaTituloTexto.length > 0,
    metaTituloTexto: metaTituloTexto.slice(0, 80),
    metaTituloLen: metaTituloTexto.length,
    metaDesc: metaDescTexto.length > 0,
    metaDescTexto: metaDescTexto.slice(0, 180),
    metaDescLen: metaDescTexto.length,
    h1: h1Texto.length > 0,
    h1Texto,
    schemaLocalBusiness,
    schemaFAQ,
    schemaBreadcrumb,
    schemaOrganization,
    totalSchemas,
    openGraph,
    viewport,
    canonical,
    faqSection,
    phoneVisible: hasPhone,
    addressVisible: hasAddress,
    googleMaps: hasGoogleMaps,
    whatsapp: hasWhatsApp,
    social: hasSocial,
    reviews: hasReviews,
    seoScore,
    geoScore,
    radar,
    error: null as string | null,
  }
}

// ── POST /api/analisis/competidor ─────────────────────────────────────────────
export async function POST(request: Request) {
  const { url } = await request.json()

  if (!url) return NextResponse.json({ error: 'URL requerida' }, { status: 400 })

  // Normalize URL
  let normalizedUrl = url.trim()
  if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
    })
    clearTimeout(timeout)

    if (!res.ok && res.status !== 403) {
      return NextResponse.json({
        error: `HTTP ${res.status}`,
        seoScore: 0, geoScore: 0,
        radar: { metatags: 0, schema: 0, tecnico: 0, contenido: 0, geo: 0, local: 0 },
      })
    }

    const html = await res.text()
    const finalUrl = res.url || normalizedUrl
    const signals = extractSignals(html, finalUrl)
    return NextResponse.json(signals)

  } catch (e: any) {
    clearTimeout(timeout)
    const errorMsg = e.name === 'AbortError'
      ? 'Timeout: la web tardó demasiado'
      : `No se pudo acceder: ${e.message?.slice(0, 80)}`
    return NextResponse.json({
      error: errorMsg,
      https: false, metaTitulo: false, metaTituloTexto: '', metaTituloLen: 0,
      metaDesc: false, metaDescTexto: '', metaDescLen: 0,
      h1: false, h1Texto: '', schemaLocalBusiness: false, schemaFAQ: false,
      schemaBreadcrumb: false, schemaOrganization: false, totalSchemas: 0,
      openGraph: false, viewport: false, canonical: false, faqSection: false,
      phoneVisible: false, addressVisible: false, googleMaps: false,
      whatsapp: false, social: false, reviews: false,
      seoScore: 0, geoScore: 0,
      radar: { metatags: 0, schema: 0, tecnico: 0, contenido: 0, geo: 0, local: 0 },
    })
  }
}
