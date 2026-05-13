import { Resend } from 'resend'

export interface Filtros {
  actividad: '' | 'activos' | 'inactivos'
  diasInactividad: number
  sellos: '' | 'min_sellos' | 'tarjeta_completa'
  minSellos: number
  vehiculo: '' | 'con_vehiculo' | 'sin_vehiculo' | 'revision_proxima'
  diasRevision: number
  reservas: '' | 'ha_reservado' | 'nunca_reservado'
  ciudad: string
}

export const filtrosDefault: Filtros = {
  actividad: '',
  diasInactividad: 30,
  sellos: '',
  minSellos: 5,
  vehiculo: '',
  diasRevision: 7,
  reservas: '',
  ciudad: '',
}

export async function getDestinatarios(
  supabase: any,
  restaurant_id: string,
  filtros: Filtros
): Promise<{ email: string; nombre: string }[]> {
  const { data: cards } = await supabase
    .from('loyalty_cards')
    .select('id, sellos_actuales, actualizado_en, customers(id, email, nombre, ciudad)')
    .eq('restaurant_id', restaurant_id)

  let lista = (cards || []).filter((c: any) => c.customers?.email)

  // Actividad
  if (filtros.actividad) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - filtros.diasInactividad)
    lista = filtros.actividad === 'activos'
      ? lista.filter((c: any) => new Date(c.actualizado_en) >= cutoff)
      : lista.filter((c: any) => new Date(c.actualizado_en) < cutoff)
  }

  // Sellos
  if (filtros.sellos === 'min_sellos') {
    lista = lista.filter((c: any) => (c.sellos_actuales ?? 0) >= filtros.minSellos)
  } else if (filtros.sellos === 'tarjeta_completa') {
    const cardIds = lista.map((c: any) => c.id)
    if (cardIds.length === 0) return []
    const { data: canjes } = await supabase
      .from('stamp_events')
      .select('card_id')
      .eq('tipo', 'canje')
      .in('card_id', cardIds)
    const idsConCanje = new Set(canjes?.map((c: any) => c.card_id) || [])
    lista = lista.filter((c: any) => idsConCanje.has(c.id))
  }

  // Vehículo
  if (filtros.vehiculo) {
    const customerIds = lista.map((c: any) => c.customers.id)
    if (customerIds.length === 0) return []

    if (filtros.vehiculo === 'con_vehiculo' || filtros.vehiculo === 'sin_vehiculo') {
      const { data: vehs } = await supabase
        .from('vehicles')
        .select('customer_id')
        .in('customer_id', customerIds)
      const idsConVeh = new Set(vehs?.map((v: any) => v.customer_id) || [])
      lista = filtros.vehiculo === 'con_vehiculo'
        ? lista.filter((c: any) => idsConVeh.has(c.customers.id))
        : lista.filter((c: any) => !idsConVeh.has(c.customers.id))
    } else if (filtros.vehiculo === 'revision_proxima') {
      const desde = new Date().toISOString().split('T')[0]
      const hasta = new Date(Date.now() + filtros.diasRevision * 86400000).toISOString().split('T')[0]
      const { data: svcs } = await supabase
        .from('vehicle_services')
        .select('vehicle_id')
        .gte('proximo_servicio_fecha', desde)
        .lte('proximo_servicio_fecha', hasta)
      if (!svcs || svcs.length === 0) return []
      const { data: vehs } = await supabase
        .from('vehicles')
        .select('customer_id')
        .in('id', svcs.map((s: any) => s.vehicle_id))
        .in('customer_id', customerIds)
      const idsConRevision = new Set(vehs?.map((v: any) => v.customer_id) || [])
      lista = lista.filter((c: any) => idsConRevision.has(c.customers.id))
    }
  }

  // Reservas
  if (filtros.reservas) {
    const emails = lista.map((c: any) => c.customers.email).filter(Boolean)
    if (emails.length === 0) return []
    const { data: bookings } = await supabase
      .from('bookings')
      .select('customer_email')
      .eq('restaurant_id', restaurant_id)
      .in('customer_email', emails)
    const emailsConReserva = new Set(bookings?.map((b: any) => b.customer_email) || [])
    lista = filtros.reservas === 'ha_reservado'
      ? lista.filter((c: any) => emailsConReserva.has(c.customers.email))
      : lista.filter((c: any) => !emailsConReserva.has(c.customers.email))
  }

  // Ciudad
  if (filtros.ciudad.trim()) {
    const ciudadBuscar = filtros.ciudad.trim().toLowerCase()
    lista = lista.filter((c: any) => c.customers.ciudad?.toLowerCase() === ciudadBuscar)
  }

  // Deduplicar por email
  const seen = new Set<string>()
  return lista
    .filter((c: any) => {
      if (seen.has(c.customers.email)) return false
      seen.add(c.customers.email)
      return true
    })
    .map((c: any) => ({ email: c.customers.email, nombre: c.customers.nombre || '' }))
}

export async function enviarEmails(
  resend: any,
  destinatarios: { email: string; nombre: string }[],
  asunto: string,
  cuerpo: string
): Promise<number> {
  const results = await Promise.allSettled(
    destinatarios.map(d =>
      resend.emails.send({
        from: 'Zynalto <noreply@zynalto.com>',
        to: d.email,
        subject: asunto,
        html: cuerpo.replace(/\[nombre\]/g, d.nombre || d.email.split('@')[0]),
      })
    )
  )
  return results.filter(r => r.status === 'fulfilled').length
}
