type OutputFileProps = {
  file: File | null
  audioFileVisualFile: File | null
}

function OutputFile({ file, audioFileVisualFile }: OutputFileProps) {
  return (
    <div className="chunkList">
        {
          file && (
            <a
              href={URL.createObjectURL(file)}
              download={file.name}
            >
              Download Recording {file.name}
            </a>
          )
        }
        {
          audioFileVisualFile && (
            <img
              src={URL.createObjectURL(audioFileVisualFile)}
            />
          )
        }
    </div>
  )
}
export default OutputFile
