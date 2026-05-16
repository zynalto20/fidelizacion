import crypto from 'crypto'
import https from 'https'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ItemFactura {
  concepto: string
  cantidad: number
  precio_unitario: number
  descuento: number
  tipo_iva: number
  subtotal: number
}

export interface DatosFactura {
  // Emisor
  nifEmisor: string
  nombreEmisor: string
  direccionEmisor: string
  // Factura
  serie: string
  numero: number
  numeroCompleto: string
  fechaExpedicion: string // YYYY-MM-DD
  tipoFactura: 'F1' | 'F2' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5'
  descripcion: string
  items: ItemFactura[]
  // Cliente
  clienteNombre: string
  clienteNif?: string
  clienteEmail?: string
  clienteDireccion?: string
  // Totales (calculados)
  baseImponible: number
  cuotaIva: number
  importeTotal: number
  // Cadena Verifactu
  huellaAnterior?: string
  numeroAnterior?: string
  fechaAnterior?: string
}

export interface ResultadoAEAT {
  ok: boolean
  csv?: string
  codigoError?: string
  descripcionError?: string
  xmlRespuesta?: string
}

// ─── Formateo ─────────────────────────────────────────────────────────────────

export function formatFecha(dateStr: string): string {
  // YYYY-MM-DD → DD-MM-YYYY
  const [y, m, d] = dateStr.split('-')
  return `${d}-${m}-${y}`
}

export function formatImporte(n: number): string {
  return n.toFixed(2)
}

function esc(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ─── Cálculos ─────────────────────────────────────────────────────────────────

export function calcularTotales(items: ItemFactura[]): { baseImponible: number; cuotaIva: number; importeTotal: number } {
  const baseImponible = items.reduce((acc, i) => acc + i.subtotal, 0)
  const cuotaIva = items.reduce((acc, i) => acc + i.subtotal * (i.tipo_iva / 100), 0)
  const importeTotal = baseImponible + cuotaIva
  return {
    baseImponible: Math.round(baseImponible * 100) / 100,
    cuotaIva: Math.round(cuotaIva * 100) / 100,
    importeTotal: Math.round(importeTotal * 100) / 100,
  }
}

export function agruparIVA(items: ItemFactura[]): Array<{ tipoIva: number; base: number; cuota: number }> {
  const grupos: Record<number, { base: number; cuota: number }> = {}
  items.forEach(i => {
    if (!grupos[i.tipo_iva]) grupos[i.tipo_iva] = { base: 0, cuota: 0 }
    grupos[i.tipo_iva].base += i.subtotal
    grupos[i.tipo_iva].cuota += i.subtotal * (i.tipo_iva / 100)
  })
  return Object.entries(grupos).map(([tipo, v]) => ({
    tipoIva: Number(tipo),
    base: Math.round(v.base * 100) / 100,
    cuota: Math.round(v.cuota * 100) / 100,
  }))
}

// ─── Hash Verifactu ───────────────────────────────────────────────────────────
// Según Orden HAC/1177/2024, Anexo II

export function calcularHuella(datos: {
  nifEmisor: string
  numSerie: string
  fechaExpedicion: string  // DD-MM-YYYY
  tipoFactura: string
  cuotaTotal: string
  importeTotal: string
  huellaAnterior: string
  fechaHoraGeneracion: string
}): string {
  const cadena = [
    datos.nifEmisor,
    datos.numSerie,
    datos.fechaExpedicion,
    datos.tipoFactura,
    datos.cuotaTotal,
    datos.importeTotal,
    datos.huellaAnterior,
    datos.fechaHoraGeneracion,
  ].join('|')
  return crypto.createHash('sha256').update(cadena, 'utf8').digest('hex').toUpperCase()
}

// ─── QR Verifactu ─────────────────────────────────────────────────────────────

export function generarURLQR(nif: string, numSerie: string, fecha: string, importe: string, entorno: 'test' | 'prod' = 'prod'): string {
  const base = entorno === 'test'
    ? 'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR'
    : 'https://www2.aeat.es/wlpl/TIKE-CONT/ValidarQR'
  return `${base}?nif=${encodeURIComponent(nif)}&numserie=${encodeURIComponent(numSerie)}&fecha=${encodeURIComponent(fecha)}&importe=${encodeURIComponent(importe)}`
}

// ─── XML Verifactu ────────────────────────────────────────────────────────────

export function generarXML(factura: DatosFactura, huella: string, fechaHoraGeneracion: string): string {
  const fechaDDMMYYYY = formatFecha(factura.fechaExpedicion)
  const grupos = agruparIVA(factura.items)

  const desgloseXML = grupos.map(g => `
          <T:DetalleIVA>
            <T:TipoImpositivo>${formatImporte(g.tipoIva)}</T:TipoImpositivo>
            <T:BaseImponibleOimporteNoSujeto>${formatImporte(g.base)}</T:BaseImponibleOimporteNoSujeto>
            <T:CuotaRepercutida>${formatImporte(g.cuota)}</T:CuotaRepercutida>
          </T:DetalleIVA>`).join('')

  const esPrimero = !factura.huellaAnterior
  const encadenamientoXML = esPrimero
    ? `<T:Encadenamiento><T:PrimerRegistro>S</T:PrimerRegistro></T:Encadenamiento>`
    : `<T:Encadenamiento>
        <T:RegistroAnterior>
          <T:IDEmisorFactura>${esc(factura.nifEmisor)}</T:IDEmisorFactura>
          <T:NumSerieFactura>${esc(factura.numeroAnterior!)}</T:NumSerieFactura>
          <T:FechaExpedicionFactura>${factura.fechaAnterior!}</T:FechaExpedicionFactura>
          <T:Huella>${factura.huellaAnterior}</T:Huella>
        </T:RegistroAnterior>
      </T:Encadenamiento>`

  const destinatarioXML = (factura.clienteNif || factura.clienteNombre)
    ? `<T:Destinatarios>
        <T:IDDestinatario>
          <T:NombreRazon>${esc(factura.clienteNombre)}</T:NombreRazon>
          ${factura.clienteNif ? `<T:NIF>${esc(factura.clienteNif)}</T:NIF>` : ''}
        </T:IDDestinatario>
      </T:Destinatarios>`
    : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<T:RegFactuSistemaFacturacion xmlns:T="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SistemaFacturacion.xsd">
  <T:Cabecera>
    <T:ObligadoEmision>
      <T:NombreRazon>${esc(factura.nombreEmisor)}</T:NombreRazon>
      <T:NIF>${esc(factura.nifEmisor)}</T:NIF>
    </T:ObligadoEmision>
  </T:Cabecera>
  <T:RegistroFactura>
    <T:RegistroAlta>
      <T:IDVersion>1.0</T:IDVersion>
      <T:IDFactura>
        <T:IDEmisorFactura>${esc(factura.nifEmisor)}</T:IDEmisorFactura>
        <T:NumSerieFactura>${esc(factura.numeroCompleto)}</T:NumSerieFactura>
        <T:FechaExpedicionFactura>${fechaDDMMYYYY}</T:FechaExpedicionFactura>
      </T:IDFactura>
      <T:NombreRazonEmisor>${esc(factura.nombreEmisor)}</T:NombreRazonEmisor>
      <T:TipoFactura>${factura.tipoFactura}</T:TipoFactura>
      <T:DescripcionOperacion>${esc(factura.descripcion || factura.items.map(i => i.concepto).join(', '))}</T:DescripcionOperacion>
      ${destinatarioXML}
      <T:Desglose>
        <T:DesgloseIVA>${desgloseXML}
        </T:DesgloseIVA>
      </T:Desglose>
      <T:CuotaTotal>${formatImporte(factura.cuotaIva)}</T:CuotaTotal>
      <T:ImporteTotal>${formatImporte(factura.importeTotal)}</T:ImporteTotal>
      ${encadenamientoXML}
      <T:SistemaInformatico>
        <T:NombreRazon>Zynalto</T:NombreRazon>
        <T:NIF>${esc(process.env.ZYNALTO_NIF || 'PENDIENTE')}</T:NIF>
        <T:NombreSistemaInformatico>Zynalto</T:NombreSistemaInformatico>
        <T:IdSistemaInformatico>ZYNALTO01</T:IdSistemaInformatico>
        <T:Version>1.0</T:Version>
        <T:NumeroInstalacion>1</T:NumeroInstalacion>
        <T:TipoUsoPosibleSoloVerifactu>S</T:TipoUsoPosibleSoloVerifactu>
        <T:TipoUsoPosibleMultiOT>N</T:TipoUsoPosibleMultiOT>
        <T:IndicadorMultiplesOT>N</T:IndicadorMultiplesOT>
      </T:SistemaInformatico>
      <T:FechaHoraHusoGenRegistro>${fechaHoraGeneracion}</T:FechaHoraHusoGenRegistro>
      <T:Huella>${huella}</T:Huella>
    </T:RegistroAlta>
  </T:RegistroFactura>
</T:RegFactuSistemaFacturacion>`
}

// ─── Envío AEAT (SOAP con mTLS) ───────────────────────────────────────────────

export async function enviarAEAT(xmlFactura: string, entorno: 'test' | 'prod' = 'test'): Promise<ResultadoAEAT> {
  const pfxBase64 = process.env.AEAT_CERT_BASE64
  const pfxPass = process.env.AEAT_CERT_PASS || ''

  if (!pfxBase64) {
    return { ok: false, codigoError: 'NO_CERT', descripcionError: 'Certificado digital no configurado (AEAT_CERT_BASE64)' }
  }

  const endpoint = entorno === 'test'
    ? 'https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP'
    : 'https://www1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP'

  // Extraer el contenido XML sin la declaración para meterlo en SOAP
  const xmlSinDeclaracion = xmlFactura.replace(/<\?xml[^?]*\?>\s*/, '').trim()

  const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Header/>
  <soapenv:Body>
    ${xmlSinDeclaracion}
  </soapenv:Body>
</soapenv:Envelope>`

  const pfxBuffer = Buffer.from(pfxBase64, 'base64')

  return new Promise((resolve) => {
    const reqBody = Buffer.from(soapBody, 'utf8')
    const url = new URL(endpoint)

    const options: https.RequestOptions = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=UTF-8',
        'Content-Length': reqBody.length,
        'SOAPAction': '',
      },
      pfx: pfxBuffer,
      passphrase: pfxPass,
      rejectUnauthorized: true,
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        const csvMatch = data.match(/<CSV>([^<]+)<\/CSV>/)
        const errCodigo = data.match(/<CodigoErrorRegistro>([^<]+)<\/CodigoErrorRegistro>/)
        const errDesc = data.match(/<DescripcionErrorRegistro>([^<]+)<\/DescripcionErrorRegistro>/)

        if (errCodigo) {
          resolve({ ok: false, codigoError: errCodigo[1], descripcionError: errDesc?.[1], xmlRespuesta: data })
        } else {
          resolve({ ok: true, csv: csvMatch?.[1], xmlRespuesta: data })
        }
      })
    })

    req.on('error', (e) => {
      resolve({ ok: false, codigoError: 'NET_ERROR', descripcionError: e.message })
    })

    req.write(reqBody)
    req.end()
  })
}
