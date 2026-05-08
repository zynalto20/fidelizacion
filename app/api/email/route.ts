import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { to, subject, html } = await request.json()

  const { data, error } = await resend.emails.send({
    from: 'Zynalto <noreply@zynalto.com>',
    to,
    subject,
    html
  })

  console.log('Email result:', { data, error, to, subject })

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ data })
}