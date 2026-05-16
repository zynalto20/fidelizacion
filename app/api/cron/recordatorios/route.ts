import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

function htmlRecordatorio({
  tipo,
  nombreCliente,
  nombreTaller,
  matricula,
  marca,
  modelo,
  fechaItv,
  kmActuales,
  kmProximo,
  diasRestantes,
  colorPrimario,
  portalUrl,
}: any) {
  const colorBtn = colorPrimario || '#2563eb'
  const esItv = tipo === 'itv'
  const titulo = esItv
    ? `⚠️ Tu ITV vence en ${diasRestantes} día${diasRestantes === 1 ? '' : 's'}`
    : `🔩 Tu vehículo se acerca al próximo mantenimiento`
  const subtitulo = esItv
    ? `El vehículo <strong>${matricula}</strong>${marca ? ` (${marca} ${modelo || ''})` : ''} tiene la ITV el <strong>${new Date(fechaItv + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.`
    : `El vehículo <strong>${matricula}</strong>${marca ? ` (${marca} ${modelo || ''})` : ''} lleva <strong>${Number(kmActuales).toLocaleString('es-ES')} km</strong> y el próximo mantenimiento está previsto a los <strong>${Number(kmProximo).toLocaleString('es-ES')} km</strong>.`

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titulo}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07)">
    <div style="background:${colorBtn};padding:28px 32px">
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:1px;text-transform:uppercase">${nombreTaller}</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;line-height:1.3">${titulo}</h1>
    </div>
    <div style="padding:28px 32px">
      <p style="color:#334155;font-size:15px;margin:0 0 16px">Hola${nombreCliente ? `, <strong>${nombreCliente}</strong>` : ''},</p>
      <p style="color:#334155;font-size:15px;margin:0 0 24px;line-height:1.6">${subtitulo}</p>

      <div style="background:#f8fafc;border-radius:12px;padding:16px 20px;margin-bottom:24px;border-left:4px solid ${colorBtn}">
        <p style="margin:0;font-size:13px;color:#64748b;line-height:1.7">
          ${esItv
            ? `La ITV es obligatoria por ley. Pasar con el vehículo fuera de plazo puede conllevar multa.<br>Te recomendamos pedir cita cuanto antes.`
            : `Realizar el mantenimiento en el momento adecuado alarga la vida del motor y evita averías costosas.`
          }
        </p>
      </div>

      ${portalUrl ? `<div style="text-align:center;margin-bottom:24px">
        <a href="${portalUrl}" style="display:inline-block;background:${colorBtn};color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600">
          Ver mi expediente →
        </a>
      </div>` : ''}

      <p style="color:#64748b;font-size:13px;margin:0">¿Necesitas cita? Contacta con nosotros y te atendemos lo antes posible.</p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center">
      <p style="margin:0;color:#94a3b8;font-size:11px">${nombreTaller} · Recordatorio automático · Para dejar de recibirlos, contacta con el taller</p>
    </div>
  </div>
</body>
</html>`
}

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const hoy = new Date()
  const hoyStr = hoy.toISOString().split('T')[0]
  let enviados = 0
  let errores = 0

  // Obtener todos los restaurantes con recordatorios activos
  const { data: restaurantes } = await supabase
    .from('restaurants')
    .select('id, nombre, slug, color_primario, recordatorio_itv_dias, recordatorio_mant_km, recordatorios_activos, resend_from_email, resend_from_name')
    .eq('recordatorios_activos', true)

  if (!restaurantes || restaurantes.length === 0) {
    return NextResponse.json({ ok: true, mensaje: 'Sin restaurantes activos', enviados: 0 })
  }

  for (const rest of restaurantes) {
    const diasAntes = rest.recordatorio_itv_dias || 30
    const kmAntes = rest.recordatorio_mant_km || 500

    // Fecha límite para ITV: hoy + diasAntes
    const fechaLimite = new Date(hoy)
    fechaLimite.setDate(fechaLimite.getDate() + diasAntes)
    const fechaLimiteStr = fechaLimite.toISOString().split('T')[0]

    // Obtener vehículos con ITV próxima o mantenimiento próximo
    // Necesitamos el email del cliente → unir vehicles → customers
    const { data: vehiculos } = await supabase
      .from('vehicles')
      .select('id, matricula, marca, modelo, anio, km_actuales, proximo_itv, proximo_mantenimiento_km, customer_id, customers(id, email, nombre, apellidos)')
      .eq('restaurant_id', rest.id)

    if (!vehiculos) continue

    for (const v of vehiculos) {
      const cliente = v.customers as any
      if (!cliente?.email) continue

      const portalUrl = `https://app.zynalto.com/portal/${rest.slug}`

      // — RECORDATORIO ITV —
      if (v.proximo_itv && v.proximo_itv >= hoyStr && v.proximo_itv <= fechaLimiteStr) {
        // Comprobar que no hemos enviado ya en los últimos 20 días
        const { count } = await supabase
          .from('reminders_log')
          .select('id', { count: 'exact', head: true })
          .eq('vehicle_id', v.id)
          .eq('tipo', 'itv')
          .gte('enviado_en', new Date(Date.now() - 20 * 86400000).toISOString())

        if ((count || 0) === 0) {
          const diasRestantes = Math.ceil((new Date(v.proximo_itv).getTime() - hoy.getTime()) / 86400000)
          try {
            await resend.emails.send({
              from: rest.resend_from_email ? `${rest.resend_from_name || rest.nombre} <${rest.resend_from_email}>` : `${rest.nombre} <noreply@zynalto.com>`,
              to: cliente.email,
              subject: `⚠️ ITV de tu ${v.matricula || 'vehículo'} en ${diasRestantes} día${diasRestantes === 1 ? '' : 's'}`,
              html: htmlRecordatorio({
                tipo: 'itv',
                nombreCliente: cliente.nombre,
                nombreTaller: rest.nombre,
                matricula: v.matricula,
                marca: v.marca,
                modelo: v.modelo,
                fechaItv: v.proximo_itv,
                diasRestantes,
                colorPrimario: rest.color_primario,
                portalUrl,
              }),
            })
            await supabase.from('reminders_log').insert({
              restaurant_id: rest.id,
              vehicle_id: v.id,
              customer_id: cliente.id,
              tipo: 'itv',
              email: cliente.email,
              enviado_en: new Date().toISOString(),
            })
            enviados++
          } catch {
            errores++
          }
        }
      }

      // — RECORDATORIO MANTENIMIENTO —
      if (v.proximo_mantenimiento_km && v.km_actuales) {
        const kmRestantes = v.proximo_mantenimiento_km - v.km_actuales
        if (kmRestantes >= 0 && kmRestantes <= kmAntes) {
          const { count } = await supabase
            .from('reminders_log')
            .select('id', { count: 'exact', head: true })
            .eq('vehicle_id', v.id)
            .eq('tipo', 'mantenimiento')
            .gte('enviado_en', new Date(Date.now() - 20 * 86400000).toISOString())

          if ((count || 0) === 0) {
            try {
              await resend.emails.send({
                from: rest.resend_from_email ? `${rest.resend_from_name || rest.nombre} <${rest.resend_from_email}>` : `${rest.nombre} <noreply@zynalto.com>`,
                to: cliente.email,
                subject: `🔩 Mantenimiento próximo de tu ${v.matricula || 'vehículo'}`,
                html: htmlRecordatorio({
                  tipo: 'mantenimiento',
                  nombreCliente: cliente.nombre,
                  nombreTaller: rest.nombre,
                  matricula: v.matricula,
                  marca: v.marca,
                  modelo: v.modelo,
                  kmActuales: v.km_actuales,
                  kmProximo: v.proximo_mantenimiento_km,
                  colorPrimario: rest.color_primario,
                  portalUrl,
                }),
              })
              await supabase.from('reminders_log').insert({
                restaurant_id: rest.id,
                vehicle_id: v.id,
                customer_id: cliente.id,
                tipo: 'mantenimiento',
                email: cliente.email,
                enviado_en: new Date().toISOString(),
              })
              enviados++
            } catch {
              errores++
            }
          }
        }
      }
    }
  }

  // ── RECORDATORIO PRESUPUESTOS SIN RESPUESTA ──────────────────────────────
  // Presupuestos en estado "enviado" hace más de 3 días sin actualizar
  const { data: presupuestosRest } = await supabase
    .from('restaurants')
    .select('id, nombre, slug, color_primario, resend_from_email, resend_from_name')

  for (const rest of presupuestosRest || []) {
    const hace3dias = new Date(Date.now() - 3 * 86400000).toISOString()
    const { data: presupuestos } = await supabase
      .from('presupuestos')
      .select('id, numero_completo, cliente_email, cliente_nombre, total, actualizado_en')
      .eq('restaurant_id', rest.id)
      .eq('estado', 'enviado')
      .lt('actualizado_en', hace3dias)

    for (const p of presupuestos || []) {
      if (!p.cliente_email) continue

      // Dedup: no repetir en 7 días
      const { count } = await supabase
        .from('reminders_log')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', rest.id)
        .eq('tipo', 'presupuesto')
        .eq('email', p.cliente_email)
        .gte('enviado_en', new Date(Date.now() - 7 * 86400000).toISOString())

      if ((count || 0) > 0) continue

      const primario = rest.color_primario || '#2563eb'
      const portalUrl = `https://app.zynalto.com/portal/${rest.slug}`
      const nombre = p.cliente_nombre ? p.cliente_nombre.split(' ')[0] : ''

      try {
        await resend.emails.send({
          from: rest.resend_from_email
            ? `${rest.resend_from_name || rest.nombre} <${rest.resend_from_email}>`
            : `${rest.nombre} <noreply@zynalto.com>`,
          to: p.cliente_email,
          subject: `📋 Tu presupuesto ${p.numero_completo} sigue disponible — ${rest.nombre}`,
          html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07)">
    <div style="background:${primario};padding:28px 32px;text-align:center">
      <p style="font-size:36px;margin:0">📋</p>
      <h1 style="margin:12px 0 0;color:#fff;font-size:20px;font-weight:700">Tu presupuesto sigue disponible</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px">${rest.nombre}</p>
    </div>
    <div style="padding:28px 32px">
      ${nombre ? `<p style="margin:0 0 16px;font-size:15px;color:#334155">Hola, <strong>${nombre}</strong>.</p>` : ''}
      <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6">
        Te recordamos que tienes un presupuesto pendiente de revisar:
      </p>
      <div style="background:#f8fafc;border-radius:12px;padding:16px 20px;margin-bottom:24px;border-left:4px solid ${primario}">
        <p style="margin:0 0 4px;font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Presupuesto</p>
        <p style="margin:0;font-family:monospace;font-size:18px;font-weight:900;color:#0f172a">${p.numero_completo}</p>
        ${p.total ? `<p style="margin:8px 0 0;font-size:22px;font-weight:700;color:${primario}">${Number(p.total).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>` : ''}
      </div>
      <p style="font-size:13px;color:#64748b;margin-bottom:20px">Si tienes alguna duda o quieres modificarlo, no dudes en contactarnos.</p>
      <div style="text-align:center">
        <a href="${portalUrl}" style="display:inline-block;background:${primario};color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600">
          Ver mi expediente →
        </a>
      </div>
    </div>
    <div style="padding:14px 32px;border-top:1px solid #f1f5f9;text-align:center">
      <p style="margin:0;color:#94a3b8;font-size:11px">${rest.nombre} · Recordatorio automático</p>
    </div>
  </div>
</body>
</html>`,
        })
        await supabase.from('reminders_log').insert({
          restaurant_id: rest.id,
          tipo: 'presupuesto',
          email: p.cliente_email,
          enviado_en: new Date().toISOString(),
        })
        enviados++
      } catch { errores++ }
    }
  }

  return NextResponse.json({ ok: true, enviados, errores })
}
