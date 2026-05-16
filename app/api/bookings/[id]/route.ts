import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { estado } = body  // 'confirmada' | 'cancelada'

  const { data: booking, error } = await supabase
    .from('bookings')
    .update({ estado })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enviar email al cliente si tiene email y vino del portal
  if (booking?.customer_email && booking?.origen === 'portal') {
    const { data: rest } = await supabase
      .from('restaurants')
      .select('nombre, color_primario, resend_from_email, resend_from_name, telefono, web')
      .eq('id', booking.restaurant_id)
      .single()

    if (rest) {
      const primario = rest.color_primario || '#2563eb'
      const confirmada = estado === 'confirmada'
      const nombre = booking.customer_name?.split(' ')[0] || ''
      const fechaStr = booking.fecha
        ? new Date(booking.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
        : null

      try {
        await resend.emails.send({
          from: rest.resend_from_email
            ? `${rest.resend_from_name || rest.nombre} <${rest.resend_from_email}>`
            : `${rest.nombre} <noreply@zynalto.com>`,
          to: booking.customer_email,
          subject: confirmada
            ? `✅ Cita confirmada — ${rest.nombre}`
            : `❌ Cita no disponible — ${rest.nombre}`,
          html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07)">
    <div style="background:${confirmada ? primario : '#ef4444'};padding:28px 32px;text-align:center">
      <p style="font-size:40px;margin:0">${confirmada ? '✅' : '❌'}</p>
      <h1 style="margin:12px 0 0;color:#fff;font-size:20px;font-weight:700">${confirmada ? '¡Cita confirmada!' : 'Cita no disponible'}</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px">${rest.nombre}</p>
    </div>
    <div style="padding:28px 32px">
      ${nombre ? `<p style="margin:0 0 16px;font-size:15px;color:#334155">Hola, <strong>${nombre}</strong>.</p>` : ''}
      ${confirmada ? `
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6">
          Tu cita ha sido <strong>confirmada</strong>${fechaStr ? ` para el <strong>${fechaStr}${booking.hora ? ` a las ${booking.hora.slice(0, 5)}` : ''}</strong>` : ''}.
          Te esperamos en el taller. Si necesitas cambiarla, contáctanos con antelación.
        </p>
        ${booking.notas ? `<div style="background:#f0fdf4;border-radius:10px;padding:12px 16px;margin-bottom:20px;border-left:3px solid ${primario}"><p style="margin:0;font-size:13px;color:#15803d">${booking.notas}</p></div>` : ''}
      ` : `
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6">
          Lo sentimos, el horario que solicitaste no está disponible. Por favor, contacta con nosotros para buscar una alternativa.
        </p>
      `}
      ${rest.telefono ? `<p style="font-size:14px;color:#334155;margin-bottom:8px">📞 <a href="tel:${rest.telefono}" style="color:${primario};font-weight:600">${rest.telefono}</a></p>` : ''}
      ${rest.web ? `<p style="font-size:14px;color:#334155">🌐 <a href="${rest.web}" style="color:${primario}">${rest.web}</a></p>` : ''}
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

  return NextResponse.json(booking)
}
