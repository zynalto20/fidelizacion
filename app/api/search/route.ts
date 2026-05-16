import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  const restaurant_id = searchParams.get('restaurant_id')

  if (!q || q.length < 2 || !restaurant_id) {
    return NextResponse.json({ ordenes: [], clientes: [], presupuestos: [] })
  }

  const like = `%${q}%`

  const [ordenesRes, clientesRes, presupuestosRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, numero_completo, estado, cliente_nombre, matricula, marca, modelo')
      .eq('restaurant_id', restaurant_id)
      .or(`numero_completo.ilike.${like},cliente_nombre.ilike.${like},matricula.ilike.${like},marca.ilike.${like},modelo.ilike.${like},cliente_telefono.ilike.${like}`)
      .order('creado_en', { ascending: false })
      .limit(5),

    supabase
      .from('loyalty_cards')
      .select('id, sellos_actuales, customers(id, nombre, apellidos, email, telefono_nuevo)')
      .eq('restaurant_id', restaurant_id)
      .or(`customers.nombre.ilike.${like},customers.apellidos.ilike.${like},customers.email.ilike.${like},customers.telefono_nuevo.ilike.${like}`)
      .limit(5),

    supabase
      .from('presupuestos')
      .select('id, numero_completo, estado, cliente_nombre, total, matricula')
      .eq('restaurant_id', restaurant_id)
      .or(`numero_completo.ilike.${like},cliente_nombre.ilike.${like},matricula.ilike.${like}`)
      .order('creado_en', { ascending: false })
      .limit(5),
  ])

  return NextResponse.json({
    ordenes: ordenesRes.data || [],
    clientes: (clientesRes.data || []).filter((c: any) => c.customers),
    presupuestos: presupuestosRes.data || [],
  })
}
