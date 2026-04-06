export const RecordingOnOff: React.FC<{
  onClick: () => void;
  pause: boolean;
}> = ({ onClick, pause }) => {
  return (
    <button
      className="bg-white/20 hover:bg-white/30 p-1 rounded text-white"
      onClick={onClick}
      title={pause ? "Resume" : "Pause"}
    >
      {pause ? (
        // Play icon
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      ) : (
        // Pause icon
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </svg>
      )}
    </button>
  );
};
