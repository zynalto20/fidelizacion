import { NextResponse } from 'next/server'

// Proveedor: autoapi.es
// Para activar: añade AUTOAPI_KEY en las variables de entorno de Vercel
// Registro gratuito en https://autoapi.es

interface DatosVehiculo {
  marca?: string
  modelo?: string
  anio?: number
  color?: string
  combustible?: string
  bastidor?: string
  tipo?: string
  potencia_cv?: number
  cilindrada?: number
  num_puertas?: number
  plazas?: number
  procedencia?: string
}

async function consultarAutoapi(matricula: string): Promise<DatosVehiculo | null> {
  const key = process.env.AUTOAPI_KEY
  if (!key) return null

  const r = await fetch(`https://api.autoapi.es/v1/vehicles?registration=${encodeURIComponent(matricula)}`, {
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  })

  if (!r.ok) return null
  const json = await r.json()
  // autoapi devuelve un array, tomamos el primer resultado
  const v = Array.isArray(json) ? json[0] : json

  if (!v) return null

  return {
    marca: v.brand || v.make || v.marca,
    modelo: v.model || v.modelo,
    anio: v.year || v.ano || v.anio,
    color: v.color || v.colour,
    combustible: v.fuel || v.combustible,
    bastidor: v.vin || v.bastidor || v.chassis,
    tipo: v.type || v.tipo,
    potencia_cv: v.power_cv || v.potencia,
    cilindrada: v.engine_cc || v.cilindrada,
    num_puertas: v.doors || v.puertas,
    plazas: v.seats || v.plazas,
    procedencia: v.origin || v.procedencia,
  }
}

// Proveedor alternativo: carregistrationapi.com (fallback)
async function consultarCarregistration(matricula: string): Promise<DatosVehiculo | null> {
  const key = process.env.CARREGISTRATION_KEY
  if (!key) return null

  const r = await fetch(`https://api.carregistrationapi.com/vehicle/${encodeURIComponent(matricula)}?country=ES`, {
    headers: { 'x-api-key': key, Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  })

  if (!r.ok) return null
  const v = await r.json()

  return {
    marca: v.Make,
    modelo: v.Model,
    anio: v.Year,
    color: v.Colour,
    combustible: v.FuelType,
    bastidor: v.VIN,
    tipo: v.VehicleType,
  }
}

export async function POST(request: Request) {
  const { matricula } = await request.json()
  if (!matricula) return NextResponse.json({ error: 'Falta matrícula' }, { status: 400 })

  const plate = matricula.trim().toUpperCase().replace(/[\s\-]/g, '')

  // Intentar proveedores en orden
  let datos = await consultarAutoapi(plate)
  if (!datos) datos = await consultarCarregistration(plate)

  if (!datos) {
    // Sin API key configurada o sin resultado
    return NextResponse.json({ encontrado: false, datos: null })
  }

  // Limpiar nulos
  const limpio: DatosVehiculo = Object.fromEntries(
    Object.entries(datos).filter(([, v]) => v !== null && v !== undefined && v !== '')
  )

  return NextResponse.json({ encontrado: true, datos: limpio })
}
