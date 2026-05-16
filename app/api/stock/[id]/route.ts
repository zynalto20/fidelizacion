import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  const campos: Record<string, any> = { actualizado_en: new Date().toISOString() }
  const permitidos = ['nombre', 'referencia', 'categoria', 'cantidad', 'cantidad_minima',
    'precio_coste', 'precio_venta', 'proveedor', 'ubicacion', 'notas']
  permitidos.forEach(k => { if (k in body) campos[k] = body[k] })

  const { data, error } = await supabase.from('stock').update(campos).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabase.from('stock').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
