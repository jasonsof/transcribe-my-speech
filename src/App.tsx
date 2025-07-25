import { useEffect, useRef, useState } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

import RecordingButton from './components/RecordingButton'
import OutputFile from './components/OutputFile'
import { getCurrentTimeString } from './lib/timeHelper'
import { getAudioRecorder } from './lib/mediaRecorder'
import './App.css'

function App() {
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false)
  const [recorderState, setRecorderState] = useState<'notready' | 'ready' | 'recording'>('notready')
  const [outputFile, setOutputFile] = useState<File | null>(null)
  const [spectrogramFile, setSpectrogramFile] = useState<File | null>(null)

  const audioChunksRef = useRef<Blob[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const ffmpegRef = useRef(new FFmpeg())

  useEffect(() => {
    const loadFfmpeg = async () => {
      const ffmpeg = ffmpegRef.current
      ffmpeg.on('log', ({ message }) => console.log(message))

      await ffmpeg.load({
        coreURL: await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript'),
        wasmURL: await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm'),
      })

      setFfmpegLoaded(true)
    }

    const setupMediaRecorder = async () => {
      const { mediaRecorder, audioStream } = await getAudioRecorder()
      mediaRecorderRef.current = mediaRecorder
      audioStreamRef.current = audioStream
      setRecorderState('ready')

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const fullRecording = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const webmFile = new File([fullRecording], 'recorded-audio.webm', { type: 'audio/webm' })
        audioChunksRef.current = []

        const now = getCurrentTimeString()
        const ffmpeg = ffmpegRef.current
        const inputData = await fetchFile(webmFile)

        ffmpeg.writeFile('input.webm', inputData)

        // Convert to WAV
        await ffmpeg.exec(['-i', 'input.webm', 'output.wav'])
        const wavData = await ffmpeg.readFile('output.wav')
        const wavBlob = new Blob([wavData.buffer], { type: 'audio/wav' })
        setOutputFile(new File([wavBlob], `recorded-audio-${now}.wav`, { type: 'audio/wav' }))

        // Generate spectrogram
        await ffmpeg.exec([
          '-i', 'input.webm',
          '-lavfi', 'showspectrumpic=s=640x240',
          'spectrogram.png',
        ])
        const spectrogramData = await ffmpeg.readFile('spectrogram.png')
        const spectrogramBlob = new Blob([spectrogramData.buffer], { type: 'image/png' })
        setSpectrogramFile(new File([spectrogramBlob], `audio-spectrogram-${now}.png`, { type: 'image/png' }))
      }
    }

    loadFfmpeg()
    setupMediaRecorder()

    return () => {
      audioStreamRef.current?.getTracks().forEach(track => track.stop())
    }
  }, [])

  const toggleRecording = () => {
    if (!mediaRecorderRef.current) return

    if (recorderState === 'ready') {
      setRecorderState('recording')
      mediaRecorderRef.current.start(1000)
    } else if (recorderState === 'recording') {
      setRecorderState('ready')
      mediaRecorderRef.current.stop()
    }
  }

  return (
    <div className="container">
      <RecordingButton loading={!ffmpegLoaded} state={recorderState} onClick={toggleRecording} />
      <OutputFile file={outputFile} audioFileVisualFile={spectrogramFile} />
    </div>
  )
}

export default App
