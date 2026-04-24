'use client'
import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

export default function Scanner({ onScan }: { onScan: (result: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let stream: MediaStream
    let animFrame: number

    async function iniciar() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
        escanear()
      } catch (e) {
        setError('No se pudo acceder a la cámara')
      }
    }

    function escanear() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        if (code) {
          onScan(code.data)
          stream?.getTracks().forEach(t => t.stop())
          return
        }
      }
      animFrame = requestAnimationFrame(escanear)
    }

    iniciar()

    return () => {
      cancelAnimationFrame(animFrame)
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return (
    <div className="flex flex-col items-center">
      {error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : (
        <>
          <video ref={videoRef} className="w-full rounded-2xl" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />
          <p className="text-zinc-500 text-xs tracking-widest uppercase mt-4">Apunta al QR del cliente</p>
        </>
      )}
    </div>
  )
}