export const RecordingButton: React.FC<{
  onClick: () => void;
  recording: boolean;
}> = ({ onClick, recording }) => {
  return (
    <button
      className={`p-3 rounded-full text-white transition-colors ${
        recording ? "bg-red-600 hover:bg-red-500 animate-pulse" : "bg-gray-600 hover:bg-gray-500"
      }`}
      onClick={onClick}
      title={recording ? "Stop recording" : "Start recording"}
    >
      {recording ? (
        // Stop icon (square)
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 019 14.437V9.564z" />
        </svg>
      ) : (
        // Record icon (circle)
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
        </svg>
      )}
    </button>
  );
};
