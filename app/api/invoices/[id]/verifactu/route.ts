import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enviarAEAT } from '../../../../lib/verifactu'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: factura } = await supabase
    .from('invoices')
    .select('xml_verifactu, estado_verifactu, numero_completo')
    .eq('id', id)
    .single()

  if (!factura) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
  if (!factura.xml_verifactu) return NextResponse.json({ error: 'XML Verifactu no generado' }, { status: 400 })

  const entorno = (process.env.AEAT_ENTORNO as 'test' | 'prod') || 'test'
  const resultado = await enviarAEAT(factura.xml_verifactu, entorno)

  await supabase
    .from('invoices')
    .update({
      estado_verifactu: resultado.ok ? 'enviada' : 'error',
      csv_aeat: resultado.csv,
      respuesta_aeat: resultado,
    })
    .eq('id', id)

  return NextResponse.json(resultado)
}
