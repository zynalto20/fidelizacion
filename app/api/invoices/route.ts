import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calcularHuella, generarXML, formatFecha, formatImporte } from '../../lib/verifactu'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const restaurant_id = searchParams.get('restaurant_id')
  if (!restaurant_id) return NextResponse.json({ error: 'Falta restaurant_id' }, { status: 400 })

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('restaurant_id', restaurant_id)
    .order('numero', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { restaurant_id, items, cliente_nombre, cliente_nif, cliente_email, cliente_direccion,
    descripcion, tipo_factura = 'F1', notas, fecha_expedicion } = body

  if (!restaurant_id) return NextResponse.json({ error: 'Falta restaurant_id' }, { status: 400 })

  // Obtener datos del restaurante y última factura para encadenamiento
  const { data: rest } = await supabase
    .from('restaurants')
    .select('nombre, nif, direccion_fiscal, serie_factura, contador_facturas')
    .eq('id', restaurant_id)
    .single()

  if (!rest) return NextResponse.json({ error: 'Restaurante no encontrado' }, { status: 404 })
  if (!rest.nif) return NextResponse.json({ error: 'El negocio no tiene NIF configurado. Ve a Ajustes.' }, { status: 400 })

  // Incrementar contador
  const nuevoNumero = (rest.contador_facturas || 0) + 1
  const serie = rest.serie_factura || 'A'
  const year = new Date().getFullYear()
  const numeroCompleto = `${serie}-${year}-${String(nuevoNumero).padStart(4, '0')}`

  // Calcular totales
  const baseImponible = items.reduce((acc: number, i: any) => acc + i.subtotal, 0)
  const cuotaIva = items.reduce((acc: number, i: any) => acc + i.subtotal * (i.tipo_iva / 100), 0)
  const importeTotal = baseImponible + cuotaIva

  // Obtener última factura para encadenamiento
  const { data: ultimaFactura } = await supabase
    .from('invoices')
    .select('numero_completo, fecha_expedicion, huella')
    .eq('restaurant_id', restaurant_id)
    .order('numero', { ascending: false })
    .limit(1)
    .single()

  // Generar Verifactu
  const fechaHoraGeneracion = new Date().toISOString().replace('Z', '+00:00')
  const fechaDDMMYYYY = formatFecha(fecha_expedicion || new Date().toISOString().split('T')[0])

  const huella = calcularHuella({
    nifEmisor: rest.nif,
    numSerie: numeroCompleto,
    fechaExpedicion: fechaDDMMYYYY,
    tipoFactura: tipo_factura,
    cuotaTotal: formatImporte(Math.round(cuotaIva * 100) / 100),
    importeTotal: formatImporte(Math.round(importeTotal * 100) / 100),
    huellaAnterior: ultimaFactura?.huella || '',
    fechaHoraGeneracion,
  })

  const datosFact = {
    nifEmisor: rest.nif,
    nombreEmisor: rest.nombre,
    direccionEmisor: rest.direccion_fiscal || '',
    serie,
    numero: nuevoNumero,
    numeroCompleto,
    fechaExpedicion: fecha_expedicion || new Date().toISOString().split('T')[0],
    tipoFactura: tipo_factura as any,
    descripcion: descripcion || '',
    items,
    clienteNombre: cliente_nombre || '',
    clienteNif: cliente_nif,
    clienteEmail: cliente_email,
    clienteDireccion: cliente_direccion,
    baseImponible: Math.round(baseImponible * 100) / 100,
    cuotaIva: Math.round(cuotaIva * 100) / 100,
    importeTotal: Math.round(importeTotal * 100) / 100,
    huellaAnterior: ultimaFactura?.huella,
    numeroAnterior: ultimaFactura?.numero_completo,
    fechaAnterior: ultimaFactura ? formatFecha(ultimaFactura.fecha_expedicion) : undefined,
  }

  const xmlVerifactu = generarXML(datosFact, huella, fechaHoraGeneracion)

  // Guardar factura
  const { data: factura, error } = await supabase
    .from('invoices')
    .insert({
      restaurant_id,
      serie,
      numero: nuevoNumero,
      numero_completo: numeroCompleto,
      fecha_expedicion: fecha_expedicion || new Date().toISOString().split('T')[0],
      tipo_factura,
      descripcion,
      items,
      cliente_nombre,
      cliente_nif,
      cliente_email,
      cliente_direccion,
      base_imponible: Math.round(baseImponible * 100) / 100,
      cuota_iva: Math.round(cuotaIva * 100) / 100,
      importe_total: Math.round(importeTotal * 100) / 100,
      huella,
      huella_anterior: ultimaFactura?.huella,
      fecha_hora_generacion: fechaHoraGeneracion,
      estado_verifactu: 'pendiente',
      xml_verifactu: xmlVerifactu,
      estado: 'emitida',
      notas,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Actualizar contador del restaurante
  await supabase
    .from('restaurants')
    .update({ contador_facturas: nuevoNumero })
    .eq('id', restaurant_id)

  return NextResponse.json(factura)
}
