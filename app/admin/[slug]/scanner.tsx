'use client'
import { useEffect, useRef, useState } from 'react'

export default function Scanner({ onScan }: { onScan: (result: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState('')
  const streamRef = useRef<MediaStream | null>(null)
  const escaneadoRef = useRef(false)

  function pararCamara() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  useEffect(() => {
    let controlsRef: any = null

    async function iniciar() {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser')
        const codeReader = new BrowserQRCodeReader()

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        controlsRef = await codeReader.decodeFromStream(
          stream,
          videoRef.current!,
          (result, err, controls) => {
            if (result && !escaneadoRef.current) {
              escaneadoRef.current = true
              controls.stop()
              pararCamara()
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
      if (controlsRef) controlsRef.stop()
      pararCamara()
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