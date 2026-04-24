'use client'
import { useRef, useState } from 'react'

export default function Scanner({ onScan }: { onScan: (result: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const img = new Image()
    const url = URL.createObjectURL(file)
    img.src = url

    img.onload = async () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0)

      try {
        // @ts-ignore
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        const codes = await detector.detect(canvas)
        if (codes.length > 0) {
          onScan(codes[0].rawValue)
        } else {
          setError('No se detectó ningún QR')
        }
      } catch {
        setError('Tu navegador no soporta el escáner')
      }

      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={() => inputRef.current?.click()}
        className="w-full bg-zinc-800 text-white font-semibold rounded-xl py-4"
      >
        Abrir cámara
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <p className="text-zinc-500 text-xs tracking-widest uppercase">Apunta al QR del cliente</p>
    </div>
  )
}