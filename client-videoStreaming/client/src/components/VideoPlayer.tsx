import { useEffect, useRef } from "react";

export const VideoPlayer: React.FC<{
  stream?: MediaStream;
  label?: string;
  isLocal?: boolean;
}> = ({ stream, label, isLocal = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.playsInline = true;
      const p = videoRef.current.play?.();
      if (p && typeof p.then === "function") p.catch(() => {});
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full bg-gray-800">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold mx-auto mb-2">
              {label?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="text-sm">{label || "No video"}</div>
          </div>
        </div>
      )}
      {label && stream && (
        <div className="absolute left-2 bottom-2 bg-black/60 text-white px-2 py-0.5 rounded text-xs">
          {label}
        </div>
      )}
    </div>
  );
};
