import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const ITEMS_DEFAULT = [
  { categoria: 'Carrocería', items: ['Carrocería delantera', 'Carrocería trasera', 'Puertas y bisagras', 'Capó', 'Maletero', 'Cristales y espejos'] },
  { categoria: 'Interior', items: ['Salpicadero', 'Volante y pedales', 'Asientos', 'Tapicería y alfombrillas', 'Climatización'] },
  { categoria: 'Motor', items: ['Nivel de aceite', 'Líquido refrigerante', 'Líquido frenos', 'Correa distribución (visual)', 'Fugas visibles'] },
  { categoria: 'Frenos', items: ['Freno delantero', 'Freno trasero', 'Freno de mano'] },
  { categoria: 'Neumáticos', items: ['ND - Profundidad y presión', 'NI - Profundidad y presión', 'TD - Profundidad y presión', 'TI - Profundidad y presión'] },
  { categoria: 'Luces', items: ['Luces delanteras', 'Luces traseras', 'Intermitentes', 'Luces de freno', 'Luz marcha atrás'] },
  { categoria: 'Electricidad', items: ['Batería (visual)', 'Testigos en cuadro'] },
]

// GET → devuelve el checklist de la orden (o genera uno vacío)
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabase
    .from('orden_checklist')
    .select('*')
    .eq('order_id', id)
    .order('orden', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST → inicializar checklist con items por defecto
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Comprobar si ya existe
  const { count } = await supabase.from('orden_checklist').select('*', { count: 'exact', head: true }).eq('order_id', id)
  if ((count || 0) > 0) return NextResponse.json({ ok: true, msg: 'ya_existe' })

  const filas: any[] = []
  let orden = 0
  ITEMS_DEFAULT.forEach(cat => {
    cat.items.forEach(item => {
      filas.push({ order_id: id, categoria: cat.categoria, item, estado: 'pendiente', notas: null, orden: orden++ })
    })
  })

  const { error } = await supabase.from('orden_checklist').insert(filas)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// PATCH → actualizar un item (estado + notas)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { item_id, estado, notas } = body

  const { data, error } = await supabase
    .from('orden_checklist')
    .update({ estado, notas: notas ?? null })
    .eq('id', item_id)
    .eq('order_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
