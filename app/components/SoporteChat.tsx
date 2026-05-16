'use client'
import { useState } from 'react'

// ── Cambia este número por el de soporte de Zynalto ──────────────────
const WHATSAPP_NUMERO = '34600000000' // formato: código país + número sin +

const FAQS = [
  { q: '¿Cómo añado un cliente nuevo?', a: 'Ve a Clientes → pulsa "+ Añadir" e introduce el email. El cliente recibirá acceso a su tarjeta de fidelización.' },
  { q: '¿Cómo doy un sello?', a: 'Entra en la ficha del cliente (en Clientes o Fidelización) y pulsa "⭐ Dar sello". Se registra al instante.' },
  { q: '¿Cómo creo una orden de reparación?', a: 'Ve a Órdenes → botón "Nueva orden". Puedes asignarla a un cliente existente o crear una nueva entrada.' },
  { q: '¿Cómo envío un presupuesto?', a: 'En Presupuestos → "Nuevo presupuesto". Rellena las líneas, pulsa "Enviar por email" y el cliente lo recibe al instante.' },
  { q: '¿Puedo personalizar los emails?', a: 'Sí. En Fidelización → Emails automáticos, puedes editar las plantillas con el editor o usar las plantillas prediseñadas.' },
  { q: 'El portal del cliente no carga', a: 'Comprueba que la URL sea app.zynalto.com/portal/[tu-slug]. Si el problema persiste, escríbenos por WhatsApp.' },
]

interface Props {
  restaurante?: any
}

export default function SoporteChat({ restaurante }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [faqActiva, setFaqActiva] = useState<number | null>(null)

  function abrirWhatsApp() {
    const contexto = restaurante?.nombre ? `\n\nTaller: ${restaurante.nombre} (${restaurante.slug})` : ''
    const texto = mensaje.trim()
      ? `Hola, necesito ayuda con Zynalto.\n\n${mensaje}${contexto}`
      : `Hola, necesito ayuda con Zynalto.${contexto}`
    const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank')
  }

  return (
    <>
      {/* ── Panel de chat ── */}
      {abierto && (
        <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 w-80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ background: '#fff', border: '1px solid #e2e8f0', maxHeight: '80vh' }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: '#25D366' }}>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.858L0 24l6.305-1.654A11.932 11.932 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.87 0-3.618-.5-5.12-1.37l-.367-.217-3.812 1 1.017-3.71-.24-.38A9.96 9.96 0 0 1 2 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-white leading-tight">Soporte Zynalto</p>
              <p className="text-xs text-white/80">Respuesta en &lt; 24h · WhatsApp</p>
            </div>
            <button onClick={() => setAbierto(false)} className="text-white/80 hover:text-white text-xl leading-none">×</button>
          </div>

          {/* Cuerpo */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#f0f2f5' }}>
            {/* Mensaje de bienvenida */}
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ background: '#25D366' }}>Z</div>
              <div className="rounded-2xl rounded-tl-none px-3 py-2.5 max-w-[85%]" style={{ background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                <p className="text-sm text-gray-800 leading-relaxed">
                  ¡Hola{restaurante?.nombre ? `, ${restaurante.nombre.split(' ')[0]}` : ''}! 👋 Soy el equipo de Zynalto.<br/>
                  ¿En qué podemos ayudarte hoy?
                </p>
              </div>
            </div>

            {/* FAQs rápidas */}
            <div className="space-y-1.5">
              {FAQS.map((faq, i) => (
                <div key={i}>
                  <button onClick={() => setFaqActiva(faqActiva === i ? null : i)}
                    className="w-full text-left text-xs px-3 py-2 rounded-xl font-medium transition-all"
                    style={{
                      background: faqActiva === i ? '#25D366' : '#fff',
                      color: faqActiva === i ? '#fff' : '#374151',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                    }}>
                    {faq.q}
                  </button>
                  {faqActiva === i && (
                    <div className="ml-2 mt-1 flex gap-2">
                      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#25D366' }}>Z</div>
                      <div className="rounded-2xl rounded-tl-none px-3 py-2.5" style={{ background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                        <p className="text-xs text-gray-700 leading-relaxed">{faq.a}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Input + enviar */}
          <div className="p-3 border-t" style={{ background: '#fff', borderColor: '#e5e7eb' }}>
            <textarea
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              placeholder="Escribe tu pregunta aquí..."
              rows={2}
              className="w-full text-sm resize-none rounded-xl px-3 py-2 focus:outline-none mb-2"
              style={{ background: '#f0f2f5', color: '#111', border: 'none' }}
            />
            <button onClick={abrirWhatsApp}
              className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: '#25D366', color: '#fff' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.858L0 24l6.305-1.654A11.932 11.932 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.87 0-3.618-.5-5.12-1.37l-.367-.217-3.812 1 1.017-3.71-.24-.38A9.96 9.96 0 0 1 2 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/></svg>
              Abrir WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* ── Botón flotante ── */}
      <button
        onClick={() => setAbierto(v => !v)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
        style={{ background: abierto ? '#e5e7eb' : '#25D366' }}
        aria-label="Soporte">
        {abierto ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.858L0 24l6.305-1.654A11.932 11.932 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.87 0-3.618-.5-5.12-1.37l-.367-.217-3.812 1 1.017-3.71-.24-.38A9.96 9.96 0 0 1 2 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/></svg>
        )}
      </button>
    </>
  )
}
