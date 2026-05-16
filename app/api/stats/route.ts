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

  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()
  const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1).toISOString()
  const fin12Meses = new Date(ahora.getFullYear() - 1, ahora.getMonth(), 1).toISOString()

  // Órdenes activas por estado
  const { data: ordenesActivas } = await supabase
    .from('orders')
    .select('estado')
    .eq('restaurant_id', restaurant_id)
    .neq('estado', 'entregado')

  const porEstado: Record<string, number> = {}
  ordenesActivas?.forEach(o => { porEstado[o.estado] = (porEstado[o.estado] || 0) + 1 })

  // Órdenes este mes vs mes anterior
  const { count: ordenesMes } = await supabase.from('orders').select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurant_id).gte('creado_en', inicioMes)
  const { count: ordenesMesAnt } = await supabase.from('orders').select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurant_id).gte('creado_en', inicioMesAnterior).lt('creado_en', inicioMes)

  // Ingresos este mes (facturas emitidas)
  const { data: facturasMes } = await supabase.from('invoices')
    .select('total').eq('restaurant_id', restaurant_id)
    .neq('estado', 'borrador').neq('estado', 'anulada')
    .gte('creado_en', inicioMes)
  const ingresosMes = facturasMes?.reduce((a, f) => a + (f.total || 0), 0) || 0

  const { data: facturasMesAnt } = await supabase.from('invoices')
    .select('total').eq('restaurant_id', restaurant_id)
    .neq('estado', 'borrador').neq('estado', 'anulada')
    .gte('creado_en', inicioMesAnterior).lt('creado_en', inicioMes)
  const ingresosMesAnt = facturasMesAnt?.reduce((a, f) => a + (f.total || 0), 0) || 0

  // Presupuestos pendientes de respuesta
  const { count: presupuestosPendientes } = await supabase.from('presupuestos')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurant_id)
    .in('estado', ['borrador', 'enviado'])

  // Ingresos últimos 12 meses (agrupado por mes)
  const { data: facturas12 } = await supabase.from('invoices')
    .select('total, creado_en').eq('restaurant_id', restaurant_id)
    .neq('estado', 'borrador').neq('estado', 'anulada')
    .gte('creado_en', fin12Meses)
    .order('creado_en', { ascending: true })

  const ingresosPorMes: Record<string, number> = {}
  for (let i = 11; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    ingresosPorMes[key] = 0
  }
  facturas12?.forEach(f => {
    const key = f.creado_en.slice(0, 7)
    if (key in ingresosPorMes) ingresosPorMes[key] += f.total || 0
  })

  // Órdenes por mes (últimos 12)
  const { data: ordenes12 } = await supabase.from('orders')
    .select('creado_en').eq('restaurant_id', restaurant_id)
    .gte('creado_en', fin12Meses)

  const ordenesPorMes: Record<string, number> = {}
  Object.keys(ingresosPorMes).forEach(k => { ordenesPorMes[k] = 0 })
  ordenes12?.forEach(o => {
    const key = o.creado_en.slice(0, 7)
    if (key in ordenesPorMes) ordenesPorMes[key]++
  })

  // Tipos de reparación más frecuentes (desde descripcion_problema de órdenes)
  const { data: tiposServicio } = await supabase.from('vehicle_services')
    .select('tipo_servicio').eq('restaurant_id', restaurant_id)
  const porTipo: Record<string, number> = {}
  tiposServicio?.forEach(s => { porTipo[s.tipo_servicio] = (porTipo[s.tipo_servicio] || 0) + 1 })
  const topServicios = Object.entries(porTipo).sort((a, b) => b[1] - a[1]).slice(0, 6)

  // Tiempo medio de reparación (días desde entrada hasta entrega)
  const { data: ordenesEntregadas } = await supabase.from('orders')
    .select('fecha_entrada, fecha_entrega')
    .eq('restaurant_id', restaurant_id)
    .eq('estado', 'entregado')
    .not('fecha_entrega', 'is', null)
    .not('fecha_entrada', 'is', null)
    .limit(50)

  let tiempoMedio = 0
  if (ordenesEntregadas && ordenesEntregadas.length > 0) {
    const dias = ordenesEntregadas.map(o => {
      const diff = new Date(o.fecha_entrega!).getTime() - new Date(o.fecha_entrada).getTime()
      return diff / 86400000
    }).filter(d => d >= 0)
    tiempoMedio = dias.length > 0 ? Math.round(dias.reduce((a, b) => a + b, 0) / dias.length) : 0
  }

  // Tasa de conversión presupuestos
  const { count: presupTotal } = await supabase.from('presupuestos').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurant_id)
  const { count: presupAcept } = await supabase.from('presupuestos').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurant_id).eq('estado', 'aceptado')
  const tasaConversion = presupTotal ? Math.round(((presupAcept || 0) / presupTotal) * 100) : 0

  // Total órdenes históricas
  const { count: totalOrdenes } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurant_id)

  return NextResponse.json({
    porEstado,
    ordenesMes: ordenesMes || 0,
    ordenesMesAnt: ordenesMesAnt || 0,
    ingresosMes,
    ingresosMesAnt,
    presupuestosPendientes: presupuestosPendientes || 0,
    ingresosPorMes,
    ordenesPorMes,
    topServicios,
    tiempoMedio,
    tasaConversion,
    totalOrdenes: totalOrdenes || 0,
  })
}
