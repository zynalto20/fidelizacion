import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── POST /api/social/instagram ─────────────────────────────────────────────────
// Body: { restaurant_id, image_base64, caption, tema }
export async function POST(request: Request) {
  try {
    const { restaurant_id, image_base64, caption, tema } = await request.json()

    if (!restaurant_id || !image_base64 || !caption) {
      return NextResponse.json(
        { error: 'Faltan parámetros: restaurant_id, image_base64 y caption son obligatorios' },
        { status: 400 }
      )
    }

    // ── 1. Get restaurant credentials ────────────────────────────────────────
    // Use service role key if available (bypasses RLS for server-side reads)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: restaurant, error: restError } = await supabaseAdmin
      .from('restaurants')
      .select('ig_access_token, ig_account_id, nombre')
      .eq('id', restaurant_id)
      .single()

    if (restError || !restaurant) {
      return NextResponse.json({ error: 'Restaurante no encontrado' }, { status: 404 })
    }

    const igToken: string = restaurant.ig_access_token
    const igAccountId: string = restaurant.ig_account_id

    if (!igToken || !igAccountId) {
      return NextResponse.json(
        {
          error: 'Credenciales de Instagram no configuradas',
          setup: true,
          message: 'Ve a Configurar Instagram y añade tu Access Token y Account ID para publicar directamente.',
        },
        { status: 422 }
      )
    }

    // ── 2. Convert base64 to Buffer and upload to Supabase Storage ────────────
    const imageBuffer = Buffer.from(image_base64, 'base64')
    const fileName = `${restaurant_id}/${Date.now()}.jpg`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('social-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError)
      return NextResponse.json(
        { error: `Error al subir imagen: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // ── 3. Get public URL ─────────────────────────────────────────────────────
    const { data: urlData } = supabaseAdmin.storage
      .from('social-images')
      .getPublicUrl(fileName)

    const publicUrl = urlData?.publicUrl
    if (!publicUrl) {
      return NextResponse.json({ error: 'No se pudo obtener la URL pública de la imagen' }, { status: 500 })
    }

    // ── 4. Create Instagram media container ───────────────────────────────────
    const containerRes = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: publicUrl,
          caption,
          access_token: igToken,
        }),
      }
    )

    const containerData = await containerRes.json()

    if (!containerRes.ok || containerData.error) {
      const errMsg = containerData.error?.message || `HTTP ${containerRes.status}`
      console.error('Instagram media container error:', containerData)
      return NextResponse.json(
        { error: `Error al crear contenedor de media en Instagram: ${errMsg}` },
        { status: 500 }
      )
    }

    const creationId: string = containerData.id
    if (!creationId) {
      return NextResponse.json({ error: 'Instagram no devolvió un ID de contenedor válido' }, { status: 500 })
    }

    // ── 5. Publish the media container ───────────────────────────────────────
    // Instagram requires a brief wait before publishing — retry up to 3 times
    let publishData: any = null
    let publishOk = false

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 3000))
      }

      const publishRes = await fetch(
        `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: creationId,
            access_token: igToken,
          }),
        }
      )

      publishData = await publishRes.json()

      if (publishRes.ok && publishData.id && !publishData.error) {
        publishOk = true
        break
      }

      // If error code is 9007 (media not ready), retry
      if (publishData?.error?.code !== 9007) {
        break
      }
    }

    if (!publishOk || !publishData?.id) {
      const errMsg = publishData?.error?.message || 'Error desconocido al publicar'
      console.error('Instagram publish error:', publishData)
      return NextResponse.json(
        { error: `Error al publicar en Instagram: ${errMsg}` },
        { status: 500 }
      )
    }

    const igPostId: string = publishData.id

    // ── 6. Record in social_posts table ──────────────────────────────────────
    const { error: insertError } = await supabaseAdmin
      .from('social_posts')
      .insert({
        restaurant_id,
        tema: tema || '',
        caption,
        ig_post_id: igPostId,
        imagen_url: publicUrl,
        estado: 'publicado',
        creado_en: new Date().toISOString(),
      })

    if (insertError) {
      // Non-fatal: the post was published, just log the DB error
      console.error('social_posts insert error (non-fatal):', insertError)
    }

    return NextResponse.json({ success: true, post_id: igPostId, imagen_url: publicUrl })
  } catch (e: any) {
    console.error('Unexpected error in /api/social/instagram:', e)
    return NextResponse.json({ error: e.message || 'Error interno del servidor' }, { status: 500 })
  }
}
