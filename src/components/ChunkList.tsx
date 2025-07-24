type ChunkListProps = {
  chunks: File[]
}

function ChunkList({ chunks }: ChunkListProps) {
  return (
    <div className="chunkList">
      {
        chunks.map((chunk, i) => (
          <a
            href={URL.createObjectURL(chunk)}
            download={chunk.name}
            key={i}
          >
            Download Recording {chunk.name}
          </a>
        ))
      }
    </div>
  )
}
export default ChunkList
