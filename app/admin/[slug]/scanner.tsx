'use client'
import { useEffect, useRef, useState } from 'react'

export default function Scanner({ onScan }: { onScan: (result: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState('')
  const escaneadoRef = useRef(false)

  useEffect(() => {
    let controls: any = null

    async function iniciar() {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser')
        const codeReader = new BrowserQRCodeReader()

        const devices = await BrowserQRCodeReader.listVideoInputDevices()
        const deviceId = devices[devices.length - 1]?.deviceId

        controls = await codeReader.decodeFromVideoDevice(
          deviceId,
          videoRef.current!,
          (result) => {
            if (result && !escaneadoRef.current) {
              escaneadoRef.current = true
              controls?.stop()
              onScan(result.getText())
            }
          }
        )
      } catch (e) {
        setError('No se pudo acceder a la cámara')
      }
    }

    iniciar()

    return () => {
      controls?.stop()
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      <video ref={videoRef} className="w-full rounded-2xl" playsInline muted autoPlay />
      <p className="text-zinc-500 text-xs tracking-widest uppercase">Apunta al QR del cliente</p>
    </div>
  )
}