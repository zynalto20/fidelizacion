import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  const { restaurant_id, asunto, cuerpo, segmento } = await request.json()

  if (!restaurant_id || !asunto || !cuerpo || !segmento) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  // Fetch customers based on segment
  let destinatarios: { email: string; nombre: string }[] = []

  if (segmento === 'todos' || segmento === 'inactivos') {
    let query = supabase
      .from('loyalty_cards')
      .select('actualizado_en, customers(id, email, nombre)')
      .eq('restaurant_id', restaurant_id)

    if (segmento === 'inactivos') {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 30)
      query = query.lt('actualizado_en', cutoff.toISOString())
    }

    const { data } = await query
    destinatarios = (data || [])
      .filter((c: any) => c.customers?.email)
      .map((c: any) => ({ email: c.customers.email, nombre: c.customers.nombre || '' }))
  } else if (segmento === 'con_vehiculo') {
    const { data: cards } = await supabase
      .from('loyalty_cards')
      .select('customers(id, email, nombre)')
      .eq('restaurant_id', restaurant_id)

    const customerIds = (cards || []).map((c: any) => c.customers?.id).filter(Boolean)

    if (customerIds.length > 0) {
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('customer_id')
        .in('customer_id', customerIds)

      const idsConVehiculo = new Set(vehicles?.map((v: any) => v.customer_id) || [])

      destinatarios = (cards || [])
        .filter((c: any) => c.customers?.email && idsConVehiculo.has(c.customers.id))
        .map((c: any) => ({ email: c.customers.email, nombre: c.customers.nombre || '' }))
    }
  }

  // Deduplicate by email
  const vistos = new Set<string>()
  destinatarios = destinatarios.filter(d => {
    if (vistos.has(d.email)) return false
    vistos.add(d.email)
    return true
  })

  if (destinatarios.length === 0) {
    return NextResponse.json({ error: 'No hay destinatarios para este segmento' }, { status: 400 })
  }

  // Send emails
  const results = await Promise.allSettled(
    destinatarios.map(d =>
      resend.emails.send({
        from: 'Zynalto <noreply@zynalto.com>',
        to: d.email,
        subject: asunto,
        html: cuerpo.replace(/\[nombre\]/g, d.nombre || d.email.split('@')[0]),
      })
    )
  )

  const totalEnviados = results.filter(r => r.status === 'fulfilled').length

  // Save campaign record
  await supabase.from('campaigns').insert({
    restaurant_id,
    asunto,
    cuerpo,
    segmento,
    total_enviados: totalEnviados,
  })

  return NextResponse.json({ total_enviados: totalEnviados, total_destinatarios: destinatarios.length })
}
