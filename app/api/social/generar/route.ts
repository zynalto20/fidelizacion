import { NextResponse } from 'next/server'

// ── Mock captions per tipo ─────────────────────────────────────────────────────
function mockPost(tema: string, tipo: string, restaurante: any): { caption: string; hashtags: string } {
  const nombre = restaurante?.nombre || 'nuestro taller'
  const ciudad = restaurante?.ciudad_fiscal || restaurante?.provincia || 'tu ciudad'
  const telefono = restaurante?.telefono ? `📞 ${restaurante.telefono}` : '¡Llámanos!'

  const baseHashtags = [
    '#taller', '#mecanico', '#coches', '#automocion', '#mantenimiento',
    `#taller${ciudad.toLowerCase().replace(/\s/g, '')}`,
    `#mecanico${ciudad.toLowerCase().replace(/\s/g, '')}`,
    '#revision', '#neumaticos', '#frenos', '#aceite', '#ITV',
    '#vehiculos', '#motoristas', '#coche', '#autocare', '#workshop',
    '#tallermecánico', '#mecánicodeconfianza', '#tallerespana',
    '#coches🚗', '#mantenimientovehiculo',
  ]

  if (tipo === 'educativo') {
    return {
      caption: `¿Sabías que ${tema.toLowerCase()}? 🔍\n\nEn ${nombre} te lo explicamos todo para que cuides tu vehículo como merece. El mantenimiento preventivo es la mejor inversión que puedes hacer en tu coche: te evita averías costosas y te da seguridad en carretera. 💪\n\nNuestros mecánicos certificados en ${ciudad} están listos para asesorarte sin compromiso. ¡Pide cita hoy mismo! ${telefono}`,
      hashtags: baseHashtags.concat(['#consejosautomocion', '#sabiasque', '#educacion', '#conductores', '#seguridad']).join(' '),
    }
  }

  if (tipo === 'promocion') {
    return {
      caption: `🔥 OFERTA ESPECIAL — ${tema.toUpperCase()}\n\nEsta es tu oportunidad de poner tu coche a punto al mejor precio. En ${nombre} (${ciudad}) llevamos años cuidando los vehículos de nuestros clientes con honestidad y calidad.\n\n✅ Pide cita ahora y benefíciate de esta oferta exclusiva. ¡Las plazas son limitadas! ${telefono}\n\n📍 ${ciudad}`,
      hashtags: baseHashtags.concat(['#oferta', '#promocion', '#descuento', '#talleroferta', '#ahorra', '#precioespecia', '#limitado']).join(' '),
    }
  }

  if (tipo === 'branding') {
    return {
      caption: `En ${nombre} somos más que un taller: somos tu mecánico de confianza en ${ciudad}. 🏆\n\n${tema}. Cada vehículo que entra por nuestra puerta recibe el mismo trato que daríamos al nuestro propio. Equipos de última generación, piezas originales y garantía total en todos nuestros trabajos.\n\n¿Buscas un taller de confianza en ${ciudad}? Aquí estamos. ${telefono}`,
      hashtags: baseHashtags.concat(['#confianza', '#calidad', '#garantia', '#profesionales', '#experiencia', '#mecanicocertificado']).join(' '),
    }
  }

  if (tipo === 'temporada') {
    return {
      caption: `¡No dejes que el cambio de estación te pille por sorpresa! 🌟\n\n${tema}. En ${nombre} preparamos tu vehículo para que viajes tranquilo y seguro, pase lo que pase en la carretera.\n\nRevisa con nosotros: frenos, neumáticos, niveles, batería y mucho más. Cita rápida, atención personalizada y sin sorpresas en la factura. 📋\n\n📍 ${ciudad} | ${telefono}`,
      hashtags: baseHashtags.concat(['#temporada', '#verano', '#invierno', '#preparacion', '#seguridad', '#viaje', '#vacaciones']).join(' '),
    }
  }

  // tipo === 'servicio' (default)
  return {
    caption: `🔧 ${tema}\n\nEn ${nombre} realizamos este servicio con precisión, rapidez y al mejor precio en ${ciudad}. Utilizamos piezas de calidad y te entregamos un informe detallado de todo lo revisado.\n\n¿Tu coche necesita atención? No esperes a que sea urgente. Pide cita ahora y te atendemos sin demoras. ${telefono}`,
    hashtags: baseHashtags.concat(['#servicio', '#revision', '#calidad', '#rapido', '#citaprevia']).join(' '),
  }
}

// ── Generate with Anthropic API ────────────────────────────────────────────────
async function generateWithAnthropic(
  tema: string,
  tipo: string,
  restaurante: any
): Promise<{ caption: string; hashtags: string }> {
  const nombre = restaurante?.nombre || 'nuestro taller'
  const ciudad = restaurante?.ciudad_fiscal || restaurante?.provincia || 'España'

  const systemPrompt = `Eres un experto en redes sociales para talleres mecánicos en España. Escribes captions para Instagram en español de España. Tono cercano, con personalidad, emojis estratégicos. Siempre incluyes una llamada a la acción clara. Conoces bien la cultura española y el sector de la automoción.`

  const userPrompt = `Crea un caption para Instagram sobre: "${tema}"

Datos del taller:
- Nombre: ${nombre}
- Ciudad: ${ciudad}
- Tipo de post: ${tipo}

Requisitos:
- Caption: 3-5 frases naturales y cercanas, máximo 200 palabras
- Incluye 2-3 emojis estratégicos (no en exceso)
- Termina con llamada a la acción y mención al número o cita previa
- Menciona ${nombre} y ${ciudad} de forma natural
- Tono ${tipo === 'promocion' ? 'urgente y emocionante' : tipo === 'educativo' ? 'informativo pero cercano' : tipo === 'branding' ? 'de orgullo y confianza' : tipo === 'temporada' ? 'estacional y relevante' : 'profesional y beneficioso'}
- Hashtags: 20-25 hashtags relevantes en español e inglés, mezcla de populares y nicho
- Incluye hashtags con el nombre de la ciudad: #taller${ciudad.toLowerCase().replace(/\s/g, '')} etc.

Responde SOLO con un JSON válido en este formato exacto (sin markdown, sin texto extra):
{"caption": "texto del caption aquí", "hashtags": "#hashtag1 #hashtag2 ..."}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`Anthropic API error ${response.status}: ${(err as any).error?.message || response.statusText}`)
  }

  const data = await response.json()
  const rawText: string = data.content?.[0]?.text || ''

  // Parse JSON from response — strip markdown fences if present
  const clean = rawText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
  try {
    const parsed = JSON.parse(clean)
    if (typeof parsed.caption === 'string' && typeof parsed.hashtags === 'string') {
      return { caption: parsed.caption, hashtags: parsed.hashtags }
    }
    throw new Error('Unexpected JSON shape')
  } catch {
    // Fallback: try to extract caption/hashtags with regex
    const captionMatch = clean.match(/"caption"\s*:\s*"([\s\S]*?)(?<!\\)"/)?.[1]?.replace(/\\n/g, '\n').replace(/\\"/g, '"')
    const hashtagsMatch = clean.match(/"hashtags"\s*:\s*"([\s\S]*?)(?<!\\)"/)?.[1]
    if (captionMatch && hashtagsMatch) {
      return { caption: captionMatch, hashtags: hashtagsMatch }
    }
    throw new Error('Could not parse Anthropic response as JSON')
  }
}

// ── POST /api/social/generar ───────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tema, emoji, tipo, restaurante } = body

    if (!tema || !tipo) {
      return NextResponse.json({ error: 'Faltan parámetros: tema y tipo son obligatorios' }, { status: 400 })
    }

    let result: { caption: string; hashtags: string }

    if (!process.env.ANTHROPIC_API_KEY) {
      result = mockPost(tema, tipo, restaurante)
    } else {
      try {
        result = await generateWithAnthropic(tema, tipo, restaurante)
      } catch (err) {
        console.error('Anthropic API error, using mock:', err)
        result = mockPost(tema, tipo, restaurante)
      }
    }

    return NextResponse.json({
      caption: result.caption,
      hashtags: result.hashtags,
      emoji: emoji || '🔧',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 })
  }
}
