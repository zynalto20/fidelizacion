'use client'

// ── Generadores de plantillas HTML ─────────────────────────────────────
// Cada plantilla recibe el color primario y el nombre del negocio
// y devuelve HTML de email listo para usar (inline styles, email-safe)

export interface Plantilla {
  id: string
  nombre: string
  descripcion: string
  emoji: string
  preview: { titulo: string; subtitulo: string; colorBg: string }
  html: (primario: string, negocio: string) => string
}

function footerHtml(negocio: string) {
  return `
    <div style="padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:12px;margin:0;font-family:-apple-system,sans-serif;">
        ${negocio} · Si no quieres recibir más emails, responde con "Baja"
      </p>
    </div>`
}

function headerHtml(primario: string, negocio: string, subtitulo = '') {
  return `
    <div style="background:${primario};padding:36px 32px;text-align:center;border-radius:12px 12px 0 0;">
      <h1 style="color:#ffffff;font-size:26px;margin:0;font-weight:700;font-family:-apple-system,sans-serif;letter-spacing:-0.5px;">${negocio}</h1>
      ${subtitulo ? `<p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;font-family:-apple-system,sans-serif;">${subtitulo}</p>` : ''}
    </div>`
}

function btnHtml(primario: string, texto: string, href = '#') {
  return `
    <div style="text-align:center;margin:28px 0;">
      <a href="${href}" style="background:${primario};color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;font-family:-apple-system,sans-serif;">${texto}</a>
    </div>`
}

export const PLANTILLAS: Plantilla[] = [

  // 1. Bienvenida
  {
    id: 'bienvenida',
    nombre: 'Bienvenida',
    descripcion: 'Para nuevos clientes. Presenta la tarjeta de fidelización.',
    emoji: '👋',
    preview: { titulo: '¡Bienvenido!', subtitulo: 'Tarjeta de fidelización activa', colorBg: '#f0fdf4' },
    html: (p, n) => `
${headerHtml(p, n, 'Tu taller de confianza')}
<div style="background:#ffffff;padding:36px 32px;">
  <h2 style="font-size:22px;color:#111827;margin:0 0 16px;font-family:-apple-system,sans-serif;font-weight:700;">
    ¡Bienvenido/a, <span style="color:${p};">[nombre]</span>! 👋
  </h2>
  <p style="color:#4b5563;line-height:1.75;margin:0 0 14px;font-family:-apple-system,sans-serif;font-size:15px;">
    Es un placer tenerte como cliente. En <strong>${n}</strong> nos comprometemos a cuidar tu vehículo con la máxima profesionalidad y atención.
  </p>
  <p style="color:#4b5563;line-height:1.75;margin:0 0 24px;font-family:-apple-system,sans-serif;font-size:15px;">
    Ya tienes tu <strong>tarjeta de fidelización activa</strong>. Con cada visita acumulas sellos y consigues recompensas exclusivas. ¡Empieza a sumar hoy!
  </p>
  <div style="background:#f8fafc;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
    <p style="margin:0;font-size:14px;color:#6b7280;font-family:-apple-system,sans-serif;">⭐ <strong style="color:#111827;">Así funciona:</strong> trae el coche al taller → acumula sellos → consigue tu premio</p>
  </div>
  ${btnHtml(p, 'Ver mi tarjeta de fidelización')}
</div>
${footerHtml(n)}`,
  },

  // 2. Recordatorio de cita
  {
    id: 'recordatorio_cita',
    nombre: 'Recordatorio de cita',
    descripcion: 'Recuerda al cliente su cita del día siguiente.',
    emoji: '📅',
    preview: { titulo: 'Tu cita es mañana', subtitulo: '[servicio] · [hora]', colorBg: '#eff6ff' },
    html: (p, n) => `
${headerHtml(p, n, 'Recordatorio de cita')}
<div style="background:#ffffff;padding:36px 32px;">
  <p style="color:#4b5563;font-size:15px;margin:0 0 20px;font-family:-apple-system,sans-serif;line-height:1.75;">
    Hola <strong style="color:#111827;">[nombre]</strong>, te recordamos que mañana tienes una cita con nosotros.
  </p>
  <div style="border-radius:12px;overflow:hidden;margin-bottom:24px;border:1px solid #e5e7eb;">
    <div style="background:${p};padding:16px 24px;">
      <p style="color:rgba(255,255,255,0.8);font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;font-family:-apple-system,sans-serif;">Tu cita</p>
      <p style="color:#ffffff;font-size:20px;font-weight:700;margin:0;font-family:-apple-system,sans-serif;">[servicio]</p>
    </div>
    <div style="background:#f9fafb;padding:16px 24px;">
      <table style="width:100%;border-collapse:collapse;font-family:-apple-system,sans-serif;">
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:13px;width:80px;">📅 Fecha</td>
          <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">[fecha]</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:13px;">🕐 Hora</td>
          <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">[hora]</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:13px;">📍 Lugar</td>
          <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">${n}</td>
        </tr>
      </table>
    </div>
  </div>
  <p style="color:#6b7280;font-size:13px;margin:0;font-family:-apple-system,sans-serif;line-height:1.6;">
    Si necesitas cambiar o cancelar tu cita, no dudes en contactarnos. ¡Te esperamos!
  </p>
</div>
${footerHtml(n)}`,
  },

  // 3. Vehículo listo
  {
    id: 'vehiculo_listo',
    nombre: 'Vehículo listo',
    descripcion: 'Avisa al cliente de que su coche ya está listo para recoger.',
    emoji: '✅',
    preview: { titulo: '¡Tu coche está listo!', subtitulo: 'Ya puedes recogerlo', colorBg: '#f0fdf4' },
    html: (p, n) => `
${headerHtml(p, n)}
<div style="background:#ffffff;padding:36px 32px;text-align:center;">
  <div style="font-size:56px;margin-bottom:16px;">🚗✅</div>
  <h2 style="font-size:24px;color:#111827;margin:0 0 12px;font-family:-apple-system,sans-serif;font-weight:700;">
    ¡Tu vehículo está listo, <span style="color:${p};">[nombre]</span>!
  </h2>
  <p style="color:#4b5563;font-size:15px;line-height:1.75;margin:0 0 24px;font-family:-apple-system,sans-serif;text-align:left;">
    Hemos terminado con tu <strong>[marca] [modelo]</strong> (<strong>[matricula]</strong>). Ya puedes venir a recogerlo cuando quieras.
  </p>
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 24px;margin-bottom:24px;text-align:left;">
    <p style="color:#166534;font-size:14px;margin:0;font-family:-apple-system,sans-serif;">
      ✅ <strong>Trabajo completado</strong> · No olvides preguntar por tu sello de fidelización al recoger el vehículo.
    </p>
  </div>
  ${btnHtml(p, 'Contactar con el taller')}
  <p style="color:#9ca3af;font-size:13px;margin:16px 0 0;font-family:-apple-system,sans-serif;">
    Nuestro horario de recogida: consulta con nosotros
  </p>
</div>
${footerHtml(n)}`,
  },

  // 4. Premio / Tarjeta completa
  {
    id: 'tarjeta_completa',
    nombre: '¡Premio conseguido!',
    descripcion: 'El cliente ha completado su tarjeta de sellos.',
    emoji: '🎁',
    preview: { titulo: '¡Tarjeta completa!', subtitulo: 'Tu premio te espera', colorBg: '#fefce8' },
    html: (p, n) => `
${headerHtml(p, n, '¡Enhorabuena!')}
<div style="background:#ffffff;padding:36px 32px;text-align:center;">
  <div style="font-size:64px;margin-bottom:16px;">🎁</div>
  <h2 style="font-size:26px;color:#111827;margin:0 0 8px;font-family:-apple-system,sans-serif;font-weight:800;">
    ¡Tarjeta completa, <span style="color:${p};">[nombre]</span>!
  </h2>
  <p style="color:#6b7280;font-size:15px;margin:0 0 28px;font-family:-apple-system,sans-serif;">
    Has acumulado todos tus sellos. ¡Tu premio te está esperando!
  </p>
  <div style="background:#fefce8;border:2px solid #fde047;border-radius:16px;padding:24px;margin-bottom:28px;">
    <p style="color:#854d0e;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;font-family:-apple-system,sans-serif;font-weight:600;">Tu premio</p>
    <p style="color:#111827;font-size:20px;font-weight:700;margin:0;font-family:-apple-system,sans-serif;">🌟 [PREMIO]</p>
  </div>
  <p style="color:#4b5563;font-size:14px;line-height:1.75;margin:0 0 24px;font-family:-apple-system,sans-serif;">
    Pasa por el taller en tu próxima visita y menciona que has completado tu tarjeta. ¡Muchas gracias por tu fidelidad!
  </p>
  ${btnHtml(p, 'Reservar cita para canjear')}
</div>
${footerHtml(n)}`,
  },

  // 5. Te echamos de menos
  {
    id: 'te_echamos_de_menos',
    nombre: 'Te echamos de menos',
    descripcion: 'Reactivación para clientes que llevan tiempo sin visitar.',
    emoji: '💙',
    preview: { titulo: 'Hace tiempo que no te vemos', subtitulo: 'Vuelve con una oferta especial', colorBg: '#eff6ff' },
    html: (p, n) => `
${headerHtml(p, n)}
<div style="background:#ffffff;padding:36px 32px;">
  <div style="font-size:48px;text-align:center;margin-bottom:20px;">💙</div>
  <h2 style="font-size:22px;color:#111827;margin:0 0 16px;font-family:-apple-system,sans-serif;font-weight:700;text-align:center;">
    Hola <span style="color:${p};">[nombre]</span>, ¡te echamos de menos!
  </h2>
  <p style="color:#4b5563;line-height:1.75;margin:0 0 14px;font-family:-apple-system,sans-serif;font-size:15px;">
    Llevamos un tiempo sin verte por el taller y queríamos saber cómo estás. Tu vehículo puede estar necesitando un poco de atención.
  </p>
  <p style="color:#4b5563;line-height:1.75;margin:0 0 24px;font-family:-apple-system,sans-serif;font-size:15px;">
    En <strong>${n}</strong> seguimos aquí para lo que necesites: revisiones, reparaciones, mantenimiento... ¡Nos encantaría volver a verte!
  </p>
  <div style="background:#f8fafc;border-left:4px solid ${p};border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
    <p style="color:#374151;font-size:14px;margin:0;font-family:-apple-system,sans-serif;line-height:1.6;">
      💡 <strong>¿Cuándo fue la última revisión de tu vehículo?</strong> Tener el coche al día previene averías y te da tranquilidad en carretera.
    </p>
  </div>
  ${btnHtml(p, 'Pedir cita')}
</div>
${footerHtml(n)}`,
  },

  // 6. Recordatorio ITV / revisión
  {
    id: 'recordatorio_revision',
    nombre: 'Recordatorio ITV / revisión',
    descripcion: 'Aviso próxima revisión o ITV del vehículo.',
    emoji: '🔧',
    preview: { titulo: 'Revisión próxima', subtitulo: 'Tu vehículo lo necesita', colorBg: '#fff7ed' },
    html: (p, n) => `
${headerHtml(p, n, 'Aviso de mantenimiento')}
<div style="background:#ffffff;padding:36px 32px;">
  <h2 style="font-size:22px;color:#111827;margin:0 0 16px;font-family:-apple-system,sans-serif;font-weight:700;">
    Hola <span style="color:${p};">[nombre]</span>, es hora de la revisión 🔧
  </h2>
  <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
    <p style="color:#9a3412;font-size:14px;margin:0 0 8px;font-family:-apple-system,sans-serif;font-weight:600;">⚠️ Próxima revisión</p>
    <table style="font-family:-apple-system,sans-serif;width:100%;border-collapse:collapse;">
      <tr>
        <td style="color:#78350f;font-size:13px;padding:4px 0;width:90px;">Vehículo</td>
        <td style="color:#111827;font-size:14px;font-weight:600;padding:4px 0;">[marca] [modelo] · [matricula]</td>
      </tr>
      <tr>
        <td style="color:#78350f;font-size:13px;padding:4px 0;">Fecha límite</td>
        <td style="color:#111827;font-size:14px;font-weight:600;padding:4px 0;">[fecha]</td>
      </tr>
    </table>
  </div>
  <p style="color:#4b5563;line-height:1.75;margin:0 0 14px;font-family:-apple-system,sans-serif;font-size:15px;">
    Mantener el mantenimiento al día te protege a ti y a tu familia en carretera. Además, un vehículo bien mantenido consume menos y tiene más valor de reventa.
  </p>
  <p style="color:#4b5563;line-height:1.75;margin:0 0 24px;font-family:-apple-system,sans-serif;font-size:15px;">
    En <strong>${n}</strong> nos encargamos de todo. Pide tu cita hoy y no dejes que se pase el plazo.
  </p>
  ${btnHtml(p, 'Pedir cita de revisión')}
</div>
${footerHtml(n)}`,
  },
]

// ── Componente picker ──────────────────────────────────────────────────
interface PickerProps {
  primario: string
  negocio: string
  borde: string
  texto: string
  textoSec: string
  fondoClaro: boolean
  onSeleccionar: (html: string) => void
  onCerrar: () => void
}

export default function PlantillasModal({ primario, negocio, borde, texto, textoSec, fondoClaro, onSeleccionar, onCerrar }: PickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onCerrar}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl" style={{ background: fondoClaro ? '#fff' : '#1e293b' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${borde}` }}>
          <div>
            <h3 className="font-bold text-base" style={{ color: texto }}>Plantillas de email</h3>
            <p className="text-xs mt-0.5" style={{ color: textoSec }}>Elige una plantilla para empezar. Puedes editar el texto después.</p>
          </div>
          <button onClick={onCerrar} className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ color: textoSec, border: `1px solid ${borde}` }}>✕</button>
        </div>

        {/* Grid de plantillas */}
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[70vh] overflow-y-auto">
          {PLANTILLAS.map(p => (
            <button key={p.id}
              onClick={() => { onSeleccionar(p.html(primario, negocio || 'Tu taller')); onCerrar() }}
              className="rounded-xl text-left transition-all hover:shadow-md group overflow-hidden"
              style={{ border: `1px solid ${borde}` }}>
              {/* Preview visual */}
              <div className="h-24 flex flex-col items-center justify-center gap-1 relative"
                style={{ background: p.preview.colorBg }}>
                <span className="text-3xl">{p.emoji}</span>
                <p className="text-xs font-semibold px-2 text-center leading-tight" style={{ color: '#111827' }}>{p.preview.titulo}</p>
                {/* Color accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 group-hover:h-1.5 transition-all" style={{ background: primario }} />
              </div>
              {/* Info */}
              <div className="p-3">
                <p className="text-sm font-semibold mb-0.5" style={{ color: texto }}>{p.nombre}</p>
                <p className="text-xs leading-snug" style={{ color: textoSec }}>{p.descripcion}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
