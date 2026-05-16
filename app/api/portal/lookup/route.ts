import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  const { restaurant_id, query } = await request.json()
  if (!restaurant_id || !query) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  const q = query.trim().toLowerCase()

  // Buscar en customers por email o teléfono
  const { data: customers } = await supabase
    .from('customers')
    .select('id, email, nombre, apellidos, telefono_nuevo, prefijo_telefono')
    .or(`email.ilike.%${q}%,telefono_nuevo.ilike.%${q}%`)
    .limit(5)

  if (!customers || customers.length === 0) {
    return NextResponse.json({ encontrado: false })
  }

  // Tomar el primer match y buscar su loyalty_card para este restaurante
  // Probar todos los matches
  for (const customer of customers) {
    const { data: card } = await supabase
      .from('loyalty_cards')
      .select('*')
      .eq('restaurant_id', restaurant_id)
      .eq('customer_id', customer.id)
      .single()

    if (card) {
      // Buscar órdenes de este cliente en este restaurante
      const { data: ordenes } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurant_id)
        .or(`cliente_email.ilike.%${q}%,cliente_telefono.ilike.%${q}%`)
        .order('creado_en', { ascending: false })

      // Buscar vehículos
      const { data: vehiculos } = await supabase
        .from('vehicles')
        .select('*')
        .eq('customer_id', customer.id)
        .order('creado_en', { ascending: false })

      // Historial de servicios
      const { data: servicios } = await supabase
        .from('vehicle_services')
        .select('*, vehicles(matricula, marca, modelo)')
        .eq('restaurant_id', restaurant_id)
        .eq('customer_id', customer.id)
        .order('fecha_servicio', { ascending: false })
        .limit(20)

      // Próximas reservas
      const hoy = new Date().toISOString().split('T')[0]
      const { data: reservas } = await supabase
        .from('bookings')
        .select('*')
        .eq('restaurant_id', restaurant_id)
        .gte('fecha', hoy)
        .or(`customer_email.ilike.%${q}%`)
        .order('fecha', { ascending: true })
        .limit(5)

      return NextResponse.json({
        encontrado: true,
        cliente: customer,
        card,
        ordenes: ordenes || [],
        vehiculos: vehiculos || [],
        servicios: servicios || [],
        reservas: reservas || [],
      })
    }
  }

  // Si no tiene loyalty card, buscar órdenes directamente por teléfono/email
  const { data: ordenes } = await supabase
    .from('orders')
    .select('*')
    .eq('restaurant_id', restaurant_id)
    .or(`cliente_email.ilike.%${q}%,cliente_telefono.ilike.%${q}%`)
    .order('creado_en', { ascending: false })

  if (ordenes && ordenes.length > 0) {
    return NextResponse.json({
      encontrado: true,
      cliente: { nombre: ordenes[0].cliente_nombre, email: ordenes[0].cliente_email, telefono_nuevo: ordenes[0].cliente_telefono },
      card: null,
      ordenes,
      vehiculos: [],
      servicios: [],
      reservas: [],
    })
  }

  return NextResponse.json({ encontrado: false })
}
