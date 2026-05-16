import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/orders/[id]/piezas → lista piezas usadas en la orden
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabase
    .from('orden_piezas')
    .select('*, stock:stock_id(nombre, referencia, cantidad)')
    .eq('order_id', id)
    .order('creado_en', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/orders/[id]/piezas → añadir pieza a la orden (descuenta stock)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { stock_id, nombre, referencia, cantidad, precio_coste, precio_venta } = body

  if (!nombre || !cantidad) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  // Insertar línea
  const { data, error } = await supabase
    .from('orden_piezas')
    .insert({
      order_id: id,
      stock_id: stock_id || null,
      nombre,
      referencia: referencia || null,
      cantidad: Number(cantidad),
      precio_coste: precio_coste ? Number(precio_coste) : null,
      precio_venta: precio_venta ? Number(precio_venta) : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Descontar stock si viene de una pieza del inventario
  if (stock_id) {
    const { data: pieza } = await supabase
      .from('stock')
      .select('cantidad')
      .eq('id', stock_id)
      .single()

    if (pieza) {
      const nuevaCantidad = Math.max(0, (pieza.cantidad || 0) - Number(cantidad))
      await supabase
        .from('stock')
        .update({ cantidad: nuevaCantidad, actualizado_en: new Date().toISOString() })
        .eq('id', stock_id)
    }
  }

  // Log en historial de la orden
  await supabase.from('order_events').insert({
    order_id: id,
    tipo: 'pieza',
    descripcion: `Pieza añadida: ${nombre} × ${cantidad}${precio_venta ? ` (${Number(precio_venta * cantidad).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })})` : ''}`,
    usuario: 'Taller',
  })

  return NextResponse.json(data)
}

// DELETE /api/orders/[id]/piezas?pieza_id=xxx → eliminar pieza (devuelve stock)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const pieza_id = searchParams.get('pieza_id')
  if (!pieza_id) return NextResponse.json({ error: 'Falta pieza_id' }, { status: 400 })

  // Obtener la pieza antes de borrar para devolver stock
  const { data: pieza } = await supabase
    .from('orden_piezas')
    .select('*')
    .eq('id', pieza_id)
    .eq('order_id', id)
    .single()

  if (!pieza) return NextResponse.json({ error: 'Pieza no encontrada' }, { status: 404 })

  const { error } = await supabase.from('orden_piezas').delete().eq('id', pieza_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Devolver stock si era una pieza del inventario
  if (pieza.stock_id) {
    const { data: stockActual } = await supabase
      .from('stock')
      .select('cantidad')
      .eq('id', pieza.stock_id)
      .single()

    if (stockActual) {
      await supabase
        .from('stock')
        .update({ cantidad: (stockActual.cantidad || 0) + pieza.cantidad, actualizado_en: new Date().toISOString() })
        .eq('id', pieza.stock_id)
    }
  }

  return NextResponse.json({ ok: true })
}
