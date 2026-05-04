'use client'
import { useEffect, useRef, useState } from 'react'

export default function Scanner({ onScan }: { onScan: (result: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState('')
  const streamRef = useRef<MediaStream | null>(null)
  const escaneadoRef = useRef(false)
  const intervalRef = useRef<any>(null)

  function pararCamara() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
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

        intervalRef.current = setInterval(async () => {
          if (escaneadoRef.current) return
          const video = videoRef.current
          const canvas = canvasRef.current
          if (!video || !canvas || video.readyState < 2) return

          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext('2d')
          if (!ctx) return
          ctx.drawImage(video, 0, 0)

          try {
            // @ts-ignore
            const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
            const codes = await detector.detect(canvas)
            if (codes.length > 0 && !escaneadoRef.current) {
              escaneadoRef.current = true
              pararCamara()
              onScan(codes[0].rawValue)
            }
          } catch {}
        }, 300)
      } catch {
        setError('No se pudo acceder a la cámara')
      }
    }

    iniciar()
    return () => pararCamara()
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      <video ref={videoRef} className="w-full rounded-2xl" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />
      <p className="text-zinc-500 text-xs tracking-widest uppercase">Apunta al QR del cliente</p>
    </div>
  )
}