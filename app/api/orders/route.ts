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
    .from('orders')
    .select('*')
    .eq('restaurant_id', restaurant_id)
    .order('creado_en', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { restaurant_id } = body
  if (!restaurant_id) return NextResponse.json({ error: 'Falta restaurant_id' }, { status: 400 })

  // Obtener y actualizar contador
  const { data: rest } = await supabase
    .from('restaurants')
    .select('contador_ordenes')
    .eq('id', restaurant_id)
    .single()

  const nuevoNumero = (rest?.contador_ordenes || 0) + 1
  const year = new Date().getFullYear()
  const numeroCompleto = `O-${year}-${String(nuevoNumero).padStart(4, '0')}`

  const { data, error } = await supabase
    .from('orders')
    .insert({
      restaurant_id,
      numero: nuevoNumero,
      numero_completo: numeroCompleto,
      estado: 'recibido',
      cliente_nombre: body.cliente_nombre || null,
      cliente_telefono: body.cliente_telefono || null,
      cliente_email: body.cliente_email || null,
      matricula: body.matricula || null,
      marca: body.marca || null,
      modelo: body.modelo || null,
      anio: body.anio || null,
      km_entrada: body.km_entrada || null,
      color: body.color || null,
      descripcion_problema: body.descripcion_problema || null,
      diagnostico: body.diagnostico || null,
      trabajos_realizados: body.trabajos_realizados || null,
      fecha_entrada: body.fecha_entrada || new Date().toISOString().split('T')[0],
      fecha_estimada: body.fecha_estimada || null,
      presupuesto: body.presupuesto || null,
      notas: body.notas || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('restaurants').update({ contador_ordenes: nuevoNumero }).eq('id', restaurant_id)

  return NextResponse.json(data)
}
