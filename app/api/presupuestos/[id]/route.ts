import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabase.from('presupuestos').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  const campos: Record<string, any> = { actualizado_en: new Date().toISOString() }
  const permitidos = ['estado', 'notas', 'validez_dias', 'lineas', 'descripcion',
    'cliente_nombre', 'cliente_telefono', 'cliente_email', 'matricula', 'marca', 'modelo']

  permitidos.forEach(k => { if (k in body) campos[k] = body[k] })

  // Recalcular totales si se actualizan las líneas
  if (body.lineas) {
    const lineas = body.lineas
    const baseImponible = lineas.reduce((acc: number, l: any) => {
      const sub = (l.cantidad || 1) * (l.precio_unitario || 0) * (1 - (l.descuento || 0) / 100)
      return acc + sub
    }, 0)
    const cuotaIva = lineas.reduce((acc: number, l: any) => {
      const sub = (l.cantidad || 1) * (l.precio_unitario || 0) * (1 - (l.descuento || 0) / 100)
      return acc + sub * ((l.tipo_iva || 21) / 100)
    }, 0)
    campos.base_imponible = baseImponible
    campos.cuota_iva = cuotaIva
    campos.total = baseImponible + cuotaIva
  }

  const { data, error } = await supabase.from('presupuestos').update(campos).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabase.from('presupuestos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
