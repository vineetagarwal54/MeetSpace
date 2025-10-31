import { useEffect, useRef } from "react"

export const VideoPlayer: React.FC<{stream?:MediaStream; label?:string; isLocal?:boolean}> = ({stream, label, isLocal=false}) =>{
    const videoRef = useRef<HTMLVideoElement>(null);
    
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.playsInline = true;
            // autoplay may be blocked; try and ignore errors
            const p = videoRef.current.play?.();
            if (p && typeof p.then === 'function') p.catch(() => {});
        }
    }, [stream]);

    return (
      <div className="relative bg-black rounded overflow-hidden w-full h-60 md:h-96">
        {stream ? (
          <video ref={videoRef} autoPlay muted={isLocal} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-sm bg-gray-800">
            <div className="text-center">
              <div className="font-semibold">No video</div>
              <div className="text-xs mt-1 text-gray-300">{label || "No source"}</div>
            </div>
          </div>
        )}
        {label && (
          <div className="absolute left-2 bottom-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
            {label}
          </div>
        )}
      </div>
    );
}