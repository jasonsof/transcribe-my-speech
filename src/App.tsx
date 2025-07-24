import { useEffect, useRef, useState } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

import RecordingButton from './components/RecordingButton'
import ChunkList from './components/ChunkList'
import { getCurrentTimeString } from './lib/timeHelper'
import { getAudioRecorder } from './lib/mediaRecorder'
import './App.css'

function App() {
  const [ffmpegLoaded, setFFmpegLoaded] = useState(false)
  const [recorderState, setRecorderState] = useState<"notready" | "ready" | "recording">("notready");
  const [audioChunks, setAudioChunks] = useState<File[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const ffmpegRef = useRef(new FFmpeg())

  useEffect(() => {
    const setupFFmpeg = async () => {
      const ffmpeg = ffmpegRef.current
      ffmpeg.on('log', ({ message }) => {
        console.log(message);
      });

      await ffmpeg.load({
        coreURL: await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript'),
        wasmURL: await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm'),
      });

      setFFmpegLoaded(true)
    }
    setupFFmpeg()

    const setupAudio = async () => {
      const { mediaRecorder, audioStream } = await getAudioRecorder()
      mediaRecorderRef.current = mediaRecorder
      audioStreamRef.current = audioStream
      setRecorderState("ready")

      mediaRecorderRef.current.ondataavailable = (e) => {
        const blob = new Blob([e.data])
        const file = new File([blob], `recorded-audio-${getCurrentTimeString()}.webm`, { type: 'audio/webm' })
        setAudioChunks(prevChunks => [file, ...prevChunks])
      }
    }
    setupAudio()

    return () => {
      audioStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const toggleRecording = () => {
    if(!mediaRecorderRef.current) return

    if(recorderState == "ready") {
      setRecorderState("recording")
      mediaRecorderRef.current.start(1000)
      return
    }
    if(recorderState == "recording") {
      setRecorderState("ready")
      mediaRecorderRef.current.stop()
      return
    }
  }

  return (
    <div className='container'>
      <RecordingButton loading={!ffmpegLoaded} state={recorderState} onClick={toggleRecording} />
      <ChunkList chunks={audioChunks} />
    </div>
  )
}

export default App
