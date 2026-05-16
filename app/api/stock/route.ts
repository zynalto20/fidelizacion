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
    .from('stock')
    .select('*')
    .eq('restaurant_id', restaurant_id)
    .order('nombre', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { restaurant_id } = body
  if (!restaurant_id) return NextResponse.json({ error: 'Falta restaurant_id' }, { status: 400 })

  const { data, error } = await supabase.from('stock').insert({
    restaurant_id,
    nombre: body.nombre,
    referencia: body.referencia || null,
    categoria: body.categoria || null,
    cantidad: body.cantidad || 0,
    cantidad_minima: body.cantidad_minima || 1,
    precio_coste: body.precio_coste || null,
    precio_venta: body.precio_venta || null,
    proveedor: body.proveedor || null,
    ubicacion: body.ubicacion || null,
    notas: body.notas || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
