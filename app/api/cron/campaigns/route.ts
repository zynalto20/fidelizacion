import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getDestinatarios, enviarEmails, filtrosDefault } from '../../../lib/campaignSender'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: pendientes } = await supabase
    .from('campaigns')
    .select('*')
    .eq('estado', 'programada')
    .lte('programada_para', new Date().toISOString())

  if (!pendientes || pendientes.length === 0) {
    return NextResponse.json({ procesadas: 0 })
  }

  let procesadas = 0

  for (const campaign of pendientes) {
    try {
      const filtros = { ...filtrosDefault, ...(campaign.filtros || {}) }
      const destinatarios = await getDestinatarios(supabase, campaign.restaurant_id, filtros)
      const totalEnviados = destinatarios.length > 0
        ? await enviarEmails(resend, destinatarios, campaign.asunto, campaign.cuerpo)
        : 0
      await supabase
        .from('campaigns')
        .update({ estado: 'enviada', total_enviados: totalEnviados })
        .eq('id', campaign.id)
      procesadas++
    } catch {
      await supabase.from('campaigns').update({ estado: 'error' }).eq('id', campaign.id)
    }
  }

  return NextResponse.json({ procesadas })
}
