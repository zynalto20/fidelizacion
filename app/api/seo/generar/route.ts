import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Mock realista cuando no hay clave API ─────────────────────────────────────
function mockArticle(tema: string, restaurante: any): string {
  const nombre = restaurante?.nombre || 'nuestro taller'
  const ciudad = restaurante?.ciudad_fiscal || restaurante?.provincia || 'tu ciudad'
  return `<article>
<h1>${tema} — Guía completa para conductores en ${ciudad}</h1>

<p>En <strong>${nombre}</strong> llevamos años ayudando a los conductores de ${ciudad} a mantener sus vehículos en perfecto estado. Hoy te explicamos todo lo que necesitas saber sobre <em>${tema.toLowerCase()}</em> y por qué no debes postergarlo.</p>

<h2>¿Por qué es importante el ${tema.toLowerCase()}?</h2>
<p>El mantenimiento preventivo es la clave para evitar averías costosas. Realizar el ${tema.toLowerCase()} a tiempo puede ahorrarte cientos de euros y, sobre todo, garantizar tu seguridad y la de tu familia en la carretera. Ignorar este mantenimiento puede derivar en daños mayores y reparaciones mucho más caras.</p>

<h2>¿Cada cuánto tiempo debes hacerlo?</h2>
<p>La frecuencia varía según el fabricante, el modelo del vehículo y el uso que le des. Como regla general, consulta el manual del propietario o pregunta a nuestros mecánicos en ${ciudad}, quienes te darán una recomendación personalizada sin compromiso y sin coste adicional.</p>

<h2>Señales de que necesitas actuar ahora</h2>
<ul>
  <li>El testigo de advertencia se ilumina en el cuadro de mandos</li>
  <li>Notas un rendimiento o comportamiento distinto al habitual</li>
  <li>Han pasado más kilómetros o meses de los recomendados por el fabricante</li>
  <li>Escuchas ruidos inusuales durante la conducción</li>
  <li>El consumo de combustible ha aumentado sin razón aparente</li>
</ul>

<h2>¿Qué incluye el servicio en ${nombre}?</h2>
<p>Nuestro equipo de técnicos certificados en ${ciudad} realiza una revisión exhaustiva con equipos de diagnóstico de última generación. Utilizamos exclusivamente piezas homologadas por el fabricante y te entregamos un informe detallado de todo lo revisado y realizado.</p>

<h2>Preguntas frecuentes sobre ${tema.toLowerCase()} en ${ciudad}</h2>
<p><strong>¿Cuánto tiempo tarda?</strong> Dependiendo del servicio, entre 1 y 3 horas. Te informamos del plazo exacto cuando dejas el vehículo.</p>
<p><strong>¿Necesito cita previa?</strong> Recomendamos pedir cita para garantizarte la atención inmediata, aunque también atendemos sin cita según disponibilidad.</p>
<p><strong>¿Ofrecéis garantía?</strong> Sí. Todos nuestros trabajos tienen garantía de mano de obra y las piezas cuentan con la garantía del fabricante.</p>

<h2>Pide cita en ${nombre}, tu taller de confianza en ${ciudad}</h2>
<p>Si buscas un taller de mecánica de confianza en ${ciudad} para el ${tema.toLowerCase()}, en <strong>${nombre}</strong> estamos a tu disposición. Contamos con años de experiencia y un equipo de profesionales comprometidos con la calidad y la honestidad.</p>
<p>Contacta con nosotros hoy mismo y te atendemos sin esperas. La revisión inicial es gratuita y sin compromiso.</p>

<footer>
  <p><em>Artículo redactado por el equipo técnico de ${nombre} · Taller mecánico en ${ciudad}</em></p>
</footer>
</article>`
}

// ── Generación con Anthropic API ──────────────────────────────────────────────
async function generateWithAnthropic(tema: string, restaurante: any): Promise<string> {
  const ciudad = restaurante?.ciudad_fiscal || restaurante?.provincia || 'España'
  const nombre = restaurante?.nombre || 'el taller'

  const systemPrompt = `Eres un redactor SEO experto en automoción y talleres mecánicos en España.
Escribes artículos de blog en español de España, optimizados para posicionamiento local y GEO (Generative Engine Optimization).
Tus artículos son prácticos, útiles para conductores, y mencionan el taller local de forma natural.
Usa lenguaje cercano pero profesional. Incluye datos reales y consejos accionables.
Estructura siempre: H1 con keyword local, introducción, H2 temáticos, listas, llamada a la acción.`

  const userPrompt = `Escribe un artículo de blog SEO completo en HTML semántico sobre: "${tema}".

Datos del taller:
- Nombre: ${nombre}
- Ciudad: ${ciudad}

Requisitos:
- Longitud: 700-900 palabras
- Formato: HTML semántico limpio (h1, h2, p, ul, li, strong). Sin DOCTYPE, sin html/head/body.
- Incluye la keyword "${tema} ${ciudad}" de forma natural al menos 3 veces
- Añade una sección de preguntas frecuentes (FAQ) con 3-4 preguntas reales que hacen los clientes
- Termina con llamada a la acción para pedir cita en ${nombre}
- Escribe en español de España (no latinoamericano)
- Contenido útil y específico, no genérico`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`Anthropic API error ${response.status}: ${(err as any).error?.message || response.statusText}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text || ''
}

// ── POST /api/seo/generar ─────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const { restaurant_id, tema, restaurante } = await request.json()

    if (!restaurant_id || !tema) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios: restaurant_id y tema' }, { status: 400 })
    }

    let contenido: string

    if (!process.env.ANTHROPIC_API_KEY) {
      contenido = mockArticle(tema, restaurante)
    } else {
      try {
        contenido = await generateWithAnthropic(tema, restaurante)
      } catch (err) {
        console.error('Error Anthropic API, usando mock:', err)
        contenido = mockArticle(tema, restaurante)
      }
    }

    // Slug único
    const slug =
      tema
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 60) +
      '-' + Date.now()

    const { data, error } = await supabase
      .from('seo_articles')
      .insert({ restaurant_id, tema, slug, contenido, estado: 'borrador' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ article: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
