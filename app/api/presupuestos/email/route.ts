import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

function fmt(n: number) { return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function calcSubtotal(l: any) {
  return (l.cantidad || 1) * (l.precio_unitario || 0) * (1 - (l.descuento || 0) / 100)
}

export async function POST(request: Request) {
  const { presupuesto_id, restaurant_id } = await request.json()

  const { data: p } = await supabase.from('presupuestos').select('*').eq('id', presupuesto_id).single()
  const { data: rest } = await supabase.from('restaurants').select('*').eq('id', restaurant_id).single()

  if (!p || !rest) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (!p.cliente_email) return NextResponse.json({ error: 'Sin email de cliente' }, { status: 400 })

  const lineasHTML = (p.lineas || []).map((l: any) => `
    <tr>
      <td style="padding:8px 4px;border-bottom:1px solid #f1f5f9;color:#334155">${l.concepto}</td>
      <td style="padding:8px 4px;border-bottom:1px solid #f1f5f9;text-align:center;color:#334155">${l.cantidad}</td>
      <td style="padding:8px 4px;border-bottom:1px solid #f1f5f9;text-align:right;color:#334155">${fmt(l.precio_unitario)} €</td>
      <td style="padding:8px 4px;border-bottom:1px solid #f1f5f9;text-align:center;color:#64748b">${l.descuento > 0 ? l.descuento + '%' : '—'}</td>
      <td style="padding:8px 4px;border-bottom:1px solid #f1f5f9;text-align:center;color:#64748b">${l.tipo_iva}%</td>
      <td style="padding:8px 4px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;color:#0f172a">${fmt(calcSubtotal(l))} €</td>
    </tr>
  `).join('')

  const primario = rest.color_primario || '#2563eb'
  const fechaCreacion = new Date(p.creado_en).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  const fechaValidez = new Date(new Date(p.creado_en).getTime() + p.validez_dias * 86400000)
    .toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07)">
    <div style="background:${primario};padding:28px 32px;display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        ${rest.logo_url ? `<img src="${rest.logo_url}" style="height:40px;margin-bottom:8px;border-radius:8px">` : ''}
        <p style="margin:0;font-weight:700;color:#fff;font-size:18px">${rest.nombre}</p>
        ${rest.nif ? `<p style="margin:2px 0 0;color:rgba(255,255,255,0.7);font-size:12px">NIF: ${rest.nif}</p>` : ''}
      </div>
      <div style="text-align:right">
        <p style="margin:0;font-weight:700;color:#fff;font-size:22px">${p.numero_completo}</p>
        <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px">PRESUPUESTO</p>
        <p style="margin:2px 0 0;color:rgba(255,255,255,0.6);font-size:11px">Fecha: ${fechaCreacion}</p>
        <p style="margin:2px 0 0;color:rgba(255,255,255,0.6);font-size:11px">Válido hasta: ${fechaValidez}</p>
      </div>
    </div>

    <div style="padding:28px 32px">
      ${p.cliente_nombre ? `<p style="margin:0 0 4px;font-size:15px;color:#334155">Estimado/a <strong>${p.cliente_nombre}</strong>,</p>` : ''}
      <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6">Le enviamos el presupuesto solicitado. Puede revisarlo a continuación:</p>

      ${p.matricula || p.marca ? `
      <div style="background:#f8fafc;border-radius:8px;padding:12px 16px;margin-bottom:16px">
        <p style="margin:0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;margin-bottom:4px">Vehículo</p>
        ${p.matricula ? `<p style="margin:0;font-family:monospace;font-weight:700;font-size:15px;color:#0f172a">${p.matricula}</p>` : ''}
        ${p.marca || p.modelo ? `<p style="margin:2px 0 0;font-size:13px;color:#64748b">${[p.marca, p.modelo].filter(Boolean).join(' ')}</p>` : ''}
      </div>` : ''}

      ${p.descripcion ? `
      <div style="background:#f8fafc;border-radius:8px;padding:12px 16px;margin-bottom:16px;border-left:3px solid ${primario}">
        <p style="margin:0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;margin-bottom:4px">Descripción del trabajo</p>
        <p style="margin:0;font-size:14px;color:#334155;line-height:1.5">${p.descripcion}</p>
      </div>` : ''}

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:13px">
        <thead>
          <tr style="border-bottom:2px solid #e2e8f0">
            ${['Concepto','Cant.','Precio','Dto.','IVA','Subtotal'].map(h =>
              `<th style="padding:8px 4px;text-align:${h === 'Concepto' ? 'left' : h === 'Subtotal' || h === 'Precio' ? 'right' : 'center'};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8">${h}</th>`
            ).join('')}
          </tr>
        </thead>
        <tbody>${lineasHTML}</tbody>
      </table>

      <div style="display:flex;justify-content:flex-end;margin-bottom:24px">
        <div style="min-width:200px">
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f1f5f9">
            <span style="font-size:12px;color:#64748b">Base imponible</span>
            <span style="font-size:12px;color:#334155">${fmt(p.base_imponible)} €</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f1f5f9">
            <span style="font-size:12px;color:#64748b">IVA</span>
            <span style="font-size:12px;color:#334155">${fmt(p.cuota_iva)} €</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:8px 0">
            <span style="font-weight:700;font-size:14px;color:#0f172a">TOTAL</span>
            <span style="font-weight:700;font-size:16px;color:${primario}">${p.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
          </div>
        </div>
      </div>

      ${p.notas ? `<p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:12px">${p.notas}</p>` : ''}

      <p style="font-size:12px;color:#94a3b8;margin-top:16px">
        Este presupuesto tiene una validez de ${p.validez_dias} días. Para aceptarlo o solicitar más información, por favor contáctenos.
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center">
      <p style="margin:0;color:#94a3b8;font-size:11px">${rest.nombre} · Presupuesto generado automáticamente</p>
    </div>
  </div>
</body>
</html>`

  try {
    await resend.emails.send({
      from: rest.resend_from_email
        ? `${rest.resend_from_name || rest.nombre} <${rest.resend_from_email}>`
        : `${rest.nombre} <noreply@zynalto.com>`,
      to: p.cliente_email,
      subject: `Presupuesto ${p.numero_completo} de ${rest.nombre}`,
      html,
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
