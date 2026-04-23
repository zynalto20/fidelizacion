'use client'
import { useEffect, useRef } from 'react'

export default function Scanner({ onScan }: { onScan: (result: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let scanner: any

    async function iniciar() {
      const { Html5Qrcode } = await import('html5-qrcode')
      scanner = new Html5Qrcode('scanner-box')
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text: string) => {
          onScan(text)
          scanner.stop()
        },
        undefined
      )
    }

    iniciar()

    return () => {
      if (scanner) scanner.stop().catch(() => {})
    }
  }, [])

  return (
    <div className="flex flex-col items-center">
      <div id="scanner-box" className="w-full rounded-2xl overflow-hidden" />
      <p className="text-zinc-500 text-xs tracking-widest uppercase mt-4">Apunta al QR del cliente</p>
    </div>
  )
}