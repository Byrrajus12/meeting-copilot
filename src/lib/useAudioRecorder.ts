import { useRef, useCallback } from 'react'

export function useAudioRecorder() {
  type ChunkHandler = (blob: Blob) => void | Promise<void>

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onChunkReadyRef = useRef<ChunkHandler | null>(null)
  const pendingFlushResolveRef = useRef<(() => void) | null>(null)

  const startRecording = useCallback(async (onChunkReady: ChunkHandler) => {
    // Request mic permission from browser
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream
    onChunkReadyRef.current = onChunkReady

    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    mediaRecorderRef.current = mediaRecorder
    chunksRef.current = []

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      chunksRef.current = []

      void Promise.resolve(onChunkReadyRef.current?.(blob)).finally(() => {
        if (pendingFlushResolveRef.current) {
          pendingFlushResolveRef.current()
          pendingFlushResolveRef.current = null
        }
      })
    }

    // Start recording
    mediaRecorder.start()
    
    // stop current recording every 30 seconds and start new one
    intervalRef.current = setInterval(() => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop()
        mediaRecorder.start()
      }
    }, 30000)

  }, [])

  const flushCurrentChunk = useCallback(async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state !== 'recording') return false
    if (pendingFlushResolveRef.current) return false

    await new Promise<void>((resolve) => {
      pendingFlushResolveRef.current = resolve
      recorder.stop()
      recorder.start()
    })

    return true
  }, [])

  const stopRecording = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    // Stop all mic tracks to remove the mic indicator in browser
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    onChunkReadyRef.current = null

    if (pendingFlushResolveRef.current) {
      pendingFlushResolveRef.current()
      pendingFlushResolveRef.current = null
    }
  }, [])

  return { startRecording, stopRecording, flushCurrentChunk }
}