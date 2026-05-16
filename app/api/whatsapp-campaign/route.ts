import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const { restaurant_id, mensaje, filtros } = await request.json()
    if (!restaurant_id || !mensaje) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_WHATSAPP_FROM
    if (!accountSid || !authToken || !from) {
      return NextResponse.json({ error: 'Twilio no configurado' }, { status: 500 })
    }

    // Obtener clientes del restaurante
    let query = supabase
      .from('loyalty_cards')
      .select('id, sellos_actuales, actualizado_en, creado_en, customers(id, nombre, apellidos, telefono_nuevo, prefijo_telefono, email)')
      .eq('restaurant_id', restaurant_id)

    const { data: cards, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    let lista = (cards || []).filter((c: any) => c.customers?.telefono_nuevo)

    // Aplicar filtros
    if (filtros) {
      const ahora = Date.now()
      if (filtros.actividad === 'activos' && filtros.diasInactividad) {
        lista = lista.filter((c: any) => c.actualizado_en && (ahora - new Date(c.actualizado_en).getTime()) < filtros.diasInactividad * 86400000)
      }
      if (filtros.actividad === 'inactivos' && filtros.diasInactividad) {
        lista = lista.filter((c: any) => !c.actualizado_en || (ahora - new Date(c.actualizado_en).getTime()) > filtros.diasInactividad * 86400000)
      }
      if (filtros.sellos === 'min_sellos' && filtros.minSellos) {
        lista = lista.filter((c: any) => (c.sellos_actuales || 0) >= filtros.minSellos)
      }
    }

    if (lista.length === 0) {
      return NextResponse.json({ enviados: 0, sin_telefono: (cards || []).length })
    }

    // Enviar WhatsApp via Twilio
    let enviados = 0
    const errores: string[] = []

    for (const card of lista) {
      const cliente = card.customers as any
      const nombre = [cliente.nombre, cliente.apellidos].filter(Boolean).join(' ') || 'Cliente'
      const prefijo = cliente.prefijo_telefono || '+34'
      const telefono = `${prefijo}${cliente.telefono_nuevo}`.replace(/\s/g, '')
      const to = `whatsapp:${telefono}`

      const texto = mensaje.replace('[nombre]', nombre)

      try {
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ From: from, To: to, Body: texto }).toString(),
        })
        if (res.ok) enviados++
        else {
          const err = await res.json()
          errores.push(`${telefono}: ${err.message}`)
        }
      } catch (e: any) {
        errores.push(`${telefono}: ${e.message}`)
      }
    }

    // Guardar en campaigns
    await supabase.from('campaigns').insert({
      restaurant_id,
      canal: 'whatsapp',
      asunto: mensaje.substring(0, 80),
      cuerpo: mensaje,
      filtros: filtros || null,
      total_enviados: enviados,
      estado: 'enviada',
    })

    return NextResponse.json({ enviados, total: lista.length, errores })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
