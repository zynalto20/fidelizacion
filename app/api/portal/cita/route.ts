import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const body = await request.json()
  const { restaurant_id, cliente_nombre, cliente_telefono, cliente_email, matricula, servicio, fecha_preferida, hora_preferida, notas } = body

  if (!restaurant_id || !cliente_nombre || !cliente_telefono) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  // Guardar la solicitud como booking pendiente
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      restaurant_id,
      customer_name: cliente_nombre,
      customer_phone: cliente_telefono,
      customer_email: cliente_email || null,
      servicio: servicio || 'Solicitud desde portal',
      fecha: fecha_preferida || null,
      hora: hora_preferida || null,
      notas: [
        matricula ? `Matrícula: ${matricula}` : null,
        notas || null,
      ].filter(Boolean).join('\n') || null,
      estado: 'pendiente',
      origen: 'portal',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Obtener datos del taller para el email
  const { data: rest } = await supabase
    .from('restaurants')
    .select('nombre, email, resend_from_email, resend_from_name, color_primario')
    .eq('id', restaurant_id)
    .single()

  if (rest) {
    const primario = rest.color_primario || '#2563eb'
    const fechaStr = fecha_preferida
      ? new Date(fecha_preferida + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
      : 'Sin fecha concreta'

    // Email al taller
    const emailTaller = rest.resend_from_email || rest.email
    if (emailTaller) {
      try {
        await resend.emails.send({
          from: `${rest.resend_from_name || rest.nombre} <${rest.resend_from_email || 'noreply@zynalto.com'}>`,
          to: emailTaller,
          subject: `📅 Nueva solicitud de cita — ${cliente_nombre}`,
          html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07)">
    <div style="background:${primario};padding:28px 32px">
      <p style="font-size:36px;margin:0">📅</p>
      <h1 style="margin:12px 0 0;color:#fff;font-size:20px;font-weight:700">Nueva solicitud de cita</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px">${rest.nombre}</p>
    </div>
    <div style="padding:28px 32px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;font-size:13px;color:#94a3b8;width:40%">Cliente</td><td style="padding:8px 0;font-size:14px;color:#0f172a;font-weight:600">${cliente_nombre}</td></tr>
        <tr style="border-top:1px solid #f1f5f9"><td style="padding:8px 0;font-size:13px;color:#94a3b8">Teléfono</td><td style="padding:8px 0;font-size:14px;color:#0f172a">${cliente_telefono}</td></tr>
        ${cliente_email ? `<tr style="border-top:1px solid #f1f5f9"><td style="padding:8px 0;font-size:13px;color:#94a3b8">Email</td><td style="padding:8px 0;font-size:14px;color:#0f172a">${cliente_email}</td></tr>` : ''}
        ${matricula ? `<tr style="border-top:1px solid #f1f5f9"><td style="padding:8px 0;font-size:13px;color:#94a3b8">Matrícula</td><td style="padding:8px 0;font-size:14px;color:#0f172a;font-family:monospace;font-weight:700">${matricula.toUpperCase()}</td></tr>` : ''}
        ${servicio ? `<tr style="border-top:1px solid #f1f5f9"><td style="padding:8px 0;font-size:13px;color:#94a3b8">Servicio</td><td style="padding:8px 0;font-size:14px;color:#0f172a">${servicio}</td></tr>` : ''}
        <tr style="border-top:1px solid #f1f5f9"><td style="padding:8px 0;font-size:13px;color:#94a3b8">Fecha preferida</td><td style="padding:8px 0;font-size:14px;color:#0f172a">${fechaStr}${hora_preferida ? ` · ${hora_preferida}` : ''}</td></tr>
        ${notas ? `<tr style="border-top:1px solid #f1f5f9"><td style="padding:8px 0;font-size:13px;color:#94a3b8">Notas</td><td style="padding:8px 0;font-size:14px;color:#0f172a">${notas}</td></tr>` : ''}
      </table>
      <div style="margin-top:24px;padding:16px;background:#f0fdf4;border-radius:10px;border-left:3px solid #22c55e">
        <p style="margin:0;font-size:13px;color:#15803d">✅ La solicitud se ha guardado en Reservas de tu dashboard Zynalto.</p>
      </div>
    </div>
  </div>
</body>
</html>`,
        })
      } catch { /* no bloquear */ }
    }

    // Email de confirmación al cliente
    if (cliente_email) {
      try {
        await resend.emails.send({
          from: rest.resend_from_email
            ? `${rest.resend_from_name || rest.nombre} <${rest.resend_from_email}>`
            : `${rest.nombre} <noreply@zynalto.com>`,
          to: cliente_email,
          subject: `✅ Solicitud de cita recibida — ${rest.nombre}`,
          html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07)">
    <div style="background:${primario};padding:28px 32px;text-align:center">
      <p style="font-size:40px;margin:0">✅</p>
      <h1 style="margin:12px 0 0;color:#fff;font-size:20px;font-weight:700">¡Solicitud recibida!</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px">${rest.nombre}</p>
    </div>
    <div style="padding:28px 32px">
      <p style="margin:0 0 16px;font-size:15px;color:#334155">Hola, <strong>${cliente_nombre.split(' ')[0]}</strong>.</p>
      <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6">Hemos recibido tu solicitud de cita para el <strong>${fechaStr}${hora_preferida ? ` a las ${hora_preferida}` : ''}</strong>. Nos pondremos en contacto contigo muy pronto para confirmarte el horario.</p>
      ${matricula ? `<div style="background:#f8fafc;border-radius:10px;padding:12px 16px;margin-bottom:20px;border-left:3px solid ${primario}"><p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;margin-bottom:4px">Vehículo</p><p style="margin:0;font-family:monospace;font-weight:700;font-size:16px;color:#0f172a">${matricula.toUpperCase()}</p></div>` : ''}
      <p style="font-size:13px;color:#64748b">¿Tienes alguna pregunta? Llámanos directamente.</p>
    </div>
    <div style="padding:14px 32px;border-top:1px solid #f1f5f9;text-align:center">
      <p style="margin:0;color:#94a3b8;font-size:11px">${rest.nombre} · Notificación automática</p>
    </div>
  </div>
</body>
</html>`,
        })
      } catch { /* no bloquear */ }
    }
  }

  return NextResponse.json({ ok: true, booking_id: booking.id })
}
