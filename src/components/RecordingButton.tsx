type RecordButtonProps = {
  state: string
  onClick: () => void
}

function RecordButton({ state, onClick }: RecordButtonProps) {
  let stateClass;
  switch(state) {
    case "recording":
      stateClass = "recordingButton--recording";
      break;
    case "ready":
      stateClass = "recordingButton--ready";
      break;
    case "notready":
      stateClass = "recordingButton--error";
      break;
  }

  const handleClick = () => {
    if(state === "notready") return

    onClick()
  }

  return (
    <button
      className={`recordingButton ${stateClass}`}
      onClick={handleClick}
    />
  )
}
export default RecordButton
