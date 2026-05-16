import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const restaurant_id = searchParams.get('restaurant_id')
  if (!restaurant_id) return NextResponse.json({ error: 'Falta restaurant_id' }, { status: 400 })

  const { data, error } = await supabase
    .from('catalogo_servicios')
    .select('*')
    .eq('restaurant_id', restaurant_id)
    .order('nombre', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { restaurant_id, nombre, descripcion, precio, tipo_iva = 21, categoria } = body
  if (!restaurant_id || !nombre) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })

  const { data, error } = await supabase
    .from('catalogo_servicios')
    .insert({ restaurant_id, nombre, descripcion: descripcion || null, precio: precio || null, tipo_iva, categoria: categoria || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })
  const { error } = await supabase.from('catalogo_servicios').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
