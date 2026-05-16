import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

async function enviarWhatsApp(telefono: string, mensaje: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM
  if (!sid || !token || !from) return

  // Normalizar teléfono español: añadir +34 si no tiene prefijo
  let to = telefono.replace(/\s/g, '')
  if (!to.startsWith('+')) to = `+34${to}`
  to = `whatsapp:${to}`

  const body = new URLSearchParams({ From: from, To: to, Body: mensaje })
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    signal: AbortSignal.timeout(6000),
  })
}

const MENSAJES_ESTADO: Record<string, { titulo: string; cuerpo: string; emoji: string }> = {
  diagnostico:      { emoji: '🔍', titulo: 'Estamos revisando tu vehículo',     cuerpo: 'Nuestros técnicos están realizando el diagnóstico. Te informaremos en breve.' },
  esperando_piezas: { emoji: '📦', titulo: 'Esperando llegada de piezas',       cuerpo: 'El diagnóstico está listo. Estamos a la espera de recibir los repuestos necesarios.' },
  reparacion:       { emoji: '🔧', titulo: 'Tu vehículo está en reparación',    cuerpo: 'Nuestros mecánicos ya están trabajando en tu vehículo.' },
  terminado:        { emoji: '✅', titulo: '¡Tu vehículo está listo!',           cuerpo: 'La reparación ha finalizado. Puedes pasar a recogerlo cuando quieras. Llámanos si tienes alguna duda.' },
  entregado:        { emoji: '🏁', titulo: 'Vehículo entregado',                 cuerpo: 'Gracias por confiar en nosotros. Esperamos verte de nuevo.' },
}

async function enviarNotificacionEstado(orden: any, nuevoEstado: string, restaurante: any) {
  if (!orden.cliente_email) return
  const msg = MENSAJES_ESTADO[nuevoEstado]
  if (!msg) return

  const primario = restaurante.color_primario || '#2563eb'
  const vehiculo = [orden.matricula, orden.marca, orden.modelo].filter(Boolean).join(' · ')
  const portalUrl = `https://app.zynalto.com/portal/${restaurante.slug}`

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07)">
    <div style="background:${primario};padding:28px 32px;text-align:center">
      <p style="font-size:40px;margin:0">${msg.emoji}</p>
      <h1 style="margin:12px 0 0;color:#fff;font-size:20px;font-weight:700;line-height:1.3">${msg.titulo}</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px">${restaurante.nombre}</p>
    </div>
    <div style="padding:28px 32px">
      ${orden.cliente_nombre ? `<p style="margin:0 0 16px;font-size:15px;color:#334155">Hola, <strong>${orden.cliente_nombre}</strong>.</p>` : ''}
      <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6">${msg.cuerpo}</p>

      ${vehiculo ? `<div style="background:#f8fafc;border-radius:10px;padding:12px 16px;margin-bottom:20px;border-left:3px solid ${primario}">
        <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;margin-bottom:4px">Vehículo</p>
        <p style="margin:0;font-family:monospace;font-weight:700;font-size:15px;color:#0f172a">${vehiculo}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#64748b">${orden.numero_completo}</p>
      </div>` : ''}

      ${orden.fecha_estimada && nuevoEstado !== 'terminado' && nuevoEstado !== 'entregado' ? `
      <p style="font-size:13px;color:#64748b;margin-bottom:20px">
        📅 Fecha estimada de entrega: <strong>${new Date(orden.fecha_estimada + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
      </p>` : ''}

      ${orden.presupuesto && nuevoEstado === 'terminado' ? `
      <p style="font-size:13px;color:#64748b;margin-bottom:20px">
        💰 Importe de la reparación: <strong>${Number(orden.presupuesto).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</strong>
      </p>` : ''}

      <div style="text-align:center;margin-top:8px">
        <a href="${portalUrl}" style="display:inline-block;background:${primario};color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600">
          Ver estado de tu vehículo →
        </a>
      </div>
    </div>
    <div style="padding:14px 32px;border-top:1px solid #f1f5f9;text-align:center">
      <p style="margin:0;color:#94a3b8;font-size:11px">${restaurante.nombre} · Notificación automática</p>
    </div>
  </div>
</body>
</html>`

  // Email
  try {
    await resend.emails.send({
      from: restaurante.resend_from_email
        ? `${restaurante.resend_from_name || restaurante.nombre} <${restaurante.resend_from_email}>`
        : `${restaurante.nombre} <noreply@zynalto.com>`,
      to: orden.cliente_email,
      subject: `${msg.emoji} ${msg.titulo} — ${restaurante.nombre}`,
      html,
    })
  } catch { /* no bloquear si el email falla */ }

  // WhatsApp (solo si está activado en el restaurante)
  if (restaurante?.notif_whatsapp_activo && orden.cliente_telefono) {
    const vehiculo = [orden.matricula, orden.marca, orden.modelo].filter(Boolean).join(' ')
    const nombre = orden.cliente_nombre ? `Hola ${orden.cliente_nombre.split(' ')[0]}, ` : ''
    const extras = nuevoEstado === 'terminado' && orden.presupuesto
      ? `\n💰 Importe: ${Number(orden.presupuesto).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`
      : nuevoEstado !== 'terminado' && nuevoEstado !== 'entregado' && orden.fecha_estimada
      ? `\n📅 Entrega estimada: ${new Date(orden.fecha_estimada + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`
      : ''
    const waMsg = `${nombre}te escribimos desde *${restaurante.nombre}*.

${msg.emoji} *${msg.titulo}*${vehiculo ? `\n🚗 ${vehiculo}` : ''}
${msg.cuerpo}${extras}

🔗 Consulta el estado: ${portalUrl}`
    try { await enviarWhatsApp(orden.cliente_telefono, waMsg) } catch { /* no bloquear */ }
  }
}

async function enviarSolicitudValoracion(orden: any, restaurante: any) {
  const primario = restaurante.color_primario || '#2563eb'
  const nombre = orden.cliente_nombre ? orden.cliente_nombre.split(' ')[0] : ''
  const vehiculo = [orden.matricula, orden.marca, orden.modelo].filter(Boolean).join(' ')
  const googleUrl = restaurante.google_maps_url || null

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07)">
    <div style="background:${primario};padding:28px 32px;text-align:center">
      <p style="font-size:40px;margin:0">⭐</p>
      <h1 style="margin:12px 0 0;color:#fff;font-size:20px;font-weight:700;line-height:1.3">¿Quedaste satisfecho con el servicio?</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px">${restaurante.nombre}</p>
    </div>
    <div style="padding:28px 32px">
      ${nombre ? `<p style="margin:0 0 16px;font-size:15px;color:#334155">Hola, <strong>${nombre}</strong>.</p>` : ''}
      <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6">
        Acabamos de entregarte tu vehículo${vehiculo ? ` <strong>${vehiculo}</strong>` : ''} y nos encantaría saber tu opinión. Tu valoración nos ayuda a mejorar y a que otros clientes nos encuentren.
      </p>
      ${googleUrl ? `
      <div style="text-align:center;margin-bottom:24px">
        <a href="${googleUrl}" style="display:inline-block;background:#4285f4;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.2px">
          ⭐ Dejar reseña en Google
        </a>
      </div>
      <p style="text-align:center;font-size:12px;color:#94a3b8">Solo te llevará 1 minuto y nos ayuda muchísimo 🙏</p>
      ` : `
      <div style="background:#fef9c3;border-radius:10px;padding:16px;text-align:center;border:1px solid #fde047">
        <p style="margin:0;font-size:14px;color:#92400e">Puedes contactarnos directamente con tu opinión. ¡Muchas gracias!</p>
      </div>
      `}
    </div>
    <div style="padding:14px 32px;border-top:1px solid #f1f5f9;text-align:center">
      <p style="margin:0;color:#94a3b8;font-size:11px">${restaurante.nombre} · Notificación automática · Puedes ignorar este email si no deseas valorar</p>
    </div>
  </div>
</body>
</html>`

  try {
    await resend.emails.send({
      from: restaurante.resend_from_email
        ? `${restaurante.resend_from_name || restaurante.nombre} <${restaurante.resend_from_email}>`
        : `${restaurante.nombre} <noreply@zynalto.com>`,
      to: orden.cliente_email,
      subject: `⭐ ¿Cómo fue tu experiencia? — ${restaurante.nombre}`,
      html,
    })
  } catch { /* no bloquear */ }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  // Obtener la orden actual para comparar estado
  const { data: ordenActual } = await supabase.from('orders').select('*').eq('id', id).single()

  const campos: Record<string, any> = { actualizado_en: new Date().toISOString() }
  const permitidos = ['estado', 'cliente_nombre', 'cliente_telefono', 'cliente_email',
    'matricula', 'marca', 'modelo', 'anio', 'km_entrada', 'color',
    'descripcion_problema', 'diagnostico', 'trabajos_realizados',
    'fecha_entrada', 'fecha_estimada', 'fecha_entrega', 'presupuesto', 'notas',
    'bloqueada', 'motivo_bloqueo']

  permitidos.forEach(k => { if (k in body) campos[k] = body[k] })

  const { data, error } = await supabase.from('orders').update(campos).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ESTADO_LABELS: Record<string, string> = {
    recibido: 'Recibido', diagnostico: 'Diagnóstico', esperando_piezas: 'Esperando piezas',
    reparacion: 'En reparación', terminado: 'Terminado', entregado: 'Entregado',
  }

  // — Log de actividad —
  const eventos: { tipo: string; descripcion: string }[] = []

  if (body.estado && ordenActual?.estado !== body.estado) {
    eventos.push({ tipo: 'estado', descripcion: `Estado cambiado a "${ESTADO_LABELS[body.estado] || body.estado}"` })
  }
  if ('bloqueada' in body) {
    if (body.bloqueada) {
      eventos.push({ tipo: 'bloqueo', descripcion: `Orden bloqueada: ${body.motivo_bloqueo || 'sin motivo'}` })
    } else if (ordenActual?.bloqueada) {
      eventos.push({ tipo: 'desbloqueo', descripcion: 'Orden desbloqueada' })
    }
  }
  if (body.diagnostico && body.diagnostico !== ordenActual?.diagnostico) {
    eventos.push({ tipo: 'diagnostico', descripcion: 'Diagnóstico actualizado' })
  }
  if (body.trabajos_realizados && body.trabajos_realizados !== ordenActual?.trabajos_realizados) {
    eventos.push({ tipo: 'trabajos', descripcion: 'Trabajos realizados actualizados' })
  }
  if (body.presupuesto && body.presupuesto !== ordenActual?.presupuesto) {
    eventos.push({ tipo: 'presupuesto', descripcion: `Presupuesto actualizado: ${Number(body.presupuesto).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}` })
  }
  if (body.notas && body.notas !== ordenActual?.notas) {
    eventos.push({ tipo: 'nota', descripcion: 'Notas internas actualizadas' })
  }
  if (body.fecha_estimada && body.fecha_estimada !== ordenActual?.fecha_estimada) {
    eventos.push({ tipo: 'fecha', descripcion: `Entrega estimada: ${new Date(body.fecha_estimada + 'T00:00:00').toLocaleDateString('es-ES')}` })
  }

  if (eventos.length > 0) {
    await supabase.from('order_events').insert(
      eventos.map(e => ({ order_id: id, tipo: e.tipo, descripcion: e.descripcion, usuario: 'Taller' }))
    )
  }

  // — Notificación de estado —
  if (body.estado && ordenActual && body.estado !== ordenActual.estado && data) {
    const { data: rest } = await supabase.from('restaurants').select('*').eq('id', data.restaurant_id).single()
    if (rest?.notif_estado_activo !== false) {
      await enviarNotificacionEstado(data, body.estado, rest)
    }
    // — Valoración post-entrega —
    if (body.estado === 'entregado' && data.cliente_email && rest?.notif_valoracion_activo) {
      await enviarSolicitudValoracion(data, rest)
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
