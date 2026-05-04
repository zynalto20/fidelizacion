'use client'
import { useEffect, useRef, useState } from 'react'

export default function Scanner({ onScan }: { onScan: (result: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState('')
  const escaneadoRef = useRef(false)
  const streamRef = useRef<MediaStream | null>(null)

  function pararCamara() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  useEffect(() => {
    async function iniciar() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }

        const { BrowserQRCodeReader } = await import('@zxing/browser')
        const reader = new BrowserQRCodeReader()

        const interval = setInterval(async () => {
          if (!videoRef.current || escaneadoRef.current) return
          try {
            const result = await reader.decodeFromVideoElement(videoRef.current)
            if (result && !escaneadoRef.current) {
              escaneadoRef.current = true
              clearInterval(interval)
              pararCamara()
              onScan(result.getText())
            }
          } catch {}
        }, 500)

        return () => clearInterval(interval)
      } catch (e) {
        setError('No se pudo acceder a la cámara')
      }
    }

    iniciar()

    return () => {
      pararCamara()
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