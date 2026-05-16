import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const restaurantId = formData.get('restaurant_id') as string

    if (!file || !restaurantId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    if (!['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext)) {
      return NextResponse.json({ error: 'Formato no permitido. Usa JPG, PNG o WebP.' }, { status: 400 })
    }

    // Usa service role key para bypassar RLS (acepta los dos nombres posibles)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.service_role
    if (!serviceKey) {
      return NextResponse.json({ error: 'Service role key no configurada. Contacta con soporte.' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey
    )

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Cache-buster: incluimos timestamp en el nombre del archivo
    const ts = Date.now()
    const path = `${restaurantId}/logo_${ts}.${ext}`

    // Intentar crear el bucket si no existe (falla silenciosamente si ya existe)
    await supabase.storage.createBucket('logos', { public: true }).catch(() => {})

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('[upload/logo] uploadError:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)

    // Actualizar restaurants con la URL nueva
    const { error: dbError } = await supabase
      .from('restaurants')
      .update({ logo_url: publicUrl })
      .eq('id', restaurantId)

    if (dbError) {
      console.error('[upload/logo] dbError:', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ url: publicUrl })
  } catch (e: any) {
    console.error('[upload/logo] exception:', e)
    return NextResponse.json({ error: e.message || 'Error desconocido' }, { status: 500 })
  }
}
