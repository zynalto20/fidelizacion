import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getDestinatarios, enviarEmails, filtrosDefault, type Filtros } from '../../lib/campaignSender'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  const { restaurant_id, asunto, cuerpo, filtros, programada_para } = await request.json()

  if (!restaurant_id || !asunto || !cuerpo) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const filtrosCompletos: Filtros = { ...filtrosDefault, ...(filtros || {}) }

  // Campaña programada: guardar sin enviar
  if (programada_para) {
    const { data, error } = await supabase.from('campaigns').insert({
      restaurant_id,
      asunto,
      cuerpo,
      filtros: filtrosCompletos,
      estado: 'programada',
      programada_para,
      total_enviados: 0,
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ programada: true, campaign: data })
  }

  // Envío inmediato
  const destinatarios = await getDestinatarios(supabase, restaurant_id, filtrosCompletos)

  if (destinatarios.length === 0) {
    return NextResponse.json({ error: 'No hay destinatarios con esos filtros' }, { status: 400 })
  }

  const totalEnviados = await enviarEmails(resend, destinatarios, asunto, cuerpo)

  await supabase.from('campaigns').insert({
    restaurant_id,
    asunto,
    cuerpo,
    filtros: filtrosCompletos,
    estado: 'enviada',
    total_enviados: totalEnviados,
  })

  return NextResponse.json({ total_enviados: totalEnviados, total_destinatarios: destinatarios.length })
}
