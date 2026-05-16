import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabase.from('invoices').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  // Solo permite actualizar estado y notas (no el contenido fiscal una vez emitida)
  const { estado, notas } = body
  const { data, error } = await supabase
    .from('invoices')
    .update({ estado, notas })
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Solo se pueden eliminar borradores o anuladas
  const { data: factura } = await supabase.from('invoices').select('estado, numero, restaurant_id').eq('id', id).single()
  if (!factura) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
  if (factura.estado === 'emitida' || factura.estado === 'pagada') {
    return NextResponse.json({ error: 'No se puede eliminar una factura emitida o pagada. Anúlala primero.' }, { status: 400 })
  }
  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
