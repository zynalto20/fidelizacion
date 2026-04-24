'use client'
import { useEffect, useRef, useState } from 'react'

export default function Scanner({ onScan }: { onScan: (result: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState('')
  const [activo, setActivo] = useState(false)
  const readerRef = useRef<any>(null)

  useEffect(() => {
    async function iniciar() {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser')
        const reader = new BrowserQRCodeReader()
        readerRef.current = reader

        const devices = await BrowserQRCodeReader.listVideoInputDevices()
        const deviceId = devices[devices.length - 1]?.deviceId

        await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current!,
          (result, error) => {
            if (result) {
              onScan(result.getText())
              reader.reset()
            }
          }
        )
        setActivo(true)
      } catch (e) {
        setError('No se pudo acceder a la cámara')
      }
    }

    iniciar()

    return () => {
      readerRef.current?.reset()
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      <video
        ref={videoRef}
        className="w-full rounded-2xl"
        playsInline
        muted
      />
      <p className="text-zinc-500 text-xs tracking-widest uppercase">
        Apunta al QR del cliente
      </p>
    </div>
  )
}