import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const restaurant_id = searchParams.get('restaurant_id')
  const order_id = searchParams.get('order_id')
  if (!restaurant_id) return NextResponse.json({ error: 'Falta restaurant_id' }, { status: 400 })

  let q = supabase.from('presupuestos').select('*').eq('restaurant_id', restaurant_id)
  if (order_id) q = q.eq('order_id', order_id)
  const { data, error } = await q.order('creado_en', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { restaurant_id } = body
  if (!restaurant_id) return NextResponse.json({ error: 'Falta restaurant_id' }, { status: 400 })

  // Auto-número P-YYYY-NNNN
  const { data: rest } = await supabase.from('restaurants').select('contador_presupuestos').eq('id', restaurant_id).single()
  const nuevoNum = (rest?.contador_presupuestos || 0) + 1
  const year = new Date().getFullYear()
  const numeroCompleto = `P-${year}-${String(nuevoNum).padStart(4, '0')}`

  // Calcular totales desde líneas
  const lineas = body.lineas || []
  const baseImponible = lineas.reduce((acc: number, l: any) => {
    const sub = (l.cantidad || 1) * (l.precio_unitario || 0) * (1 - (l.descuento || 0) / 100)
    return acc + sub
  }, 0)
  const cuotaIva = lineas.reduce((acc: number, l: any) => {
    const sub = (l.cantidad || 1) * (l.precio_unitario || 0) * (1 - (l.descuento || 0) / 100)
    return acc + sub * ((l.tipo_iva || 21) / 100)
  }, 0)
  const total = baseImponible + cuotaIva

  const { data, error } = await supabase.from('presupuestos').insert({
    restaurant_id,
    order_id: body.order_id || null,
    numero: nuevoNum,
    numero_completo: numeroCompleto,
    estado: 'borrador',
    cliente_nombre: body.cliente_nombre || null,
    cliente_telefono: body.cliente_telefono || null,
    cliente_email: body.cliente_email || null,
    matricula: body.matricula || null,
    marca: body.marca || null,
    modelo: body.modelo || null,
    descripcion: body.descripcion || null,
    lineas,
    base_imponible: baseImponible,
    cuota_iva: cuotaIva,
    total,
    validez_dias: body.validez_dias || 30,
    notas: body.notas || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabase.from('restaurants').update({ contador_presupuestos: nuevoNum }).eq('id', restaurant_id)
  return NextResponse.json(data)
}
