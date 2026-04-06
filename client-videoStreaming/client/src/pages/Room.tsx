import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RoomContext } from "../RoomContext";
import { VideoPlayer } from "../components/VideoPlayer";
import { ShareScreenButton } from "../components/ShareScreenButton";
import { RecordingButton } from "../components/RecordingButton";
import { EndCallButton } from "../components/EndCallButton";
import { CameraButton } from "../components/CameraButton";
import { AudioButton } from "../components/AudioButton";
import { RecordingOnOff } from "../components/RecordingOnOff";
import { ChatButton } from "../components/ChatButton";
import { Chat } from "../components/chat/Chat";
import { DeviceErrorModal } from "../components/DeviceErrorModal";

export const Room = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    ws,
    me,
    stream,
    peers,
    shareScreen,
    screenSharingId,
    setRoomId,
    toggleVideo,
    isVideoOn,
    toggleAudio,
    isAudioOn,
    toggleChat,
    chat,
    userName,
    screenStream,
    userId,
    deviceError,
    setDeviceError,
    isAudioOnly,
    initializeMediaStream,
  } = useContext(RoomContext);

  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<any>(null);
  const [recordingTime, setRecordingTime] = useState("00:00:00");
  const [message, setMessage] = useState<string | null>(null);
  const [pause, setPause] = useState(false);
  const pausedDurationRef = useRef(0);
  const [showParticipants, setShowParticipants] = useState(false);

  // Join the room when peer is ready
  useEffect(() => {
    if (!me) return;
    const emitJoin = () =>
      ws.emit("join-room", { roomId: id, peerId: me.id, userName });
    if ((me as any).open) {
      emitJoin();
    } else {
      me.on("open", emitJoin);
    }
    return () => {
      try {
        me.off?.("open", emitJoin as any);
      } catch {}
    };
  }, [id, ws, me, userName]);

  useEffect(() => {
    setRoomId(id || "");
  }, [id, setRoomId]);

  // --- Recording ---
  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2000);
  };

  const updateRecordingTime = () => {
    if (!startTimeRef.current) return;
    const elapsed = Date.now() - startTimeRef.current - pausedDurationRef.current;
    const secs = Math.floor(elapsed / 1000) % 60;
    const mins = Math.floor(elapsed / 60000) % 60;
    const hrs = Math.floor(elapsed / 3600000);
    setRecordingTime(
      `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    );
  };

  const startRecording = () => {
    if (!stream) {
      showMessage("No local media available to record.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      showMessage("Recording is not supported in this browser.");
      return;
    }
    recordedChunksRef.current = [];
    pausedDurationRef.current = 0;
    const mr = new MediaRecorder(stream, { mimeType: "video/webm" });
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    mr.onstart = () => {
      startTimeRef.current = Date.now();
      recordingIntervalRef.current = setInterval(updateRecordingTime, 1000);
      showMessage("Recording started");
    };
    mr.onstop = () => {
      clearInterval(recordingIntervalRef.current);
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "meetspace-recording.webm";
      a.click();
      recordedChunksRef.current = [];
      startTimeRef.current = null;
      setRecordingTime("00:00:00");
      showMessage("Recording saved");
    };
    mediaRecorderRef.current = mr;
    mr.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setPause(false);
    }
  };

  const toggleRecording = () => (recording ? stopRecording() : startRecording());

  const pauseRecord = () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    if (!pause && mr.state === "recording") {
      mr.pause();
      clearInterval(recordingIntervalRef.current);
      pausedDurationRef.current += Date.now() - (startTimeRef.current || 0);
      showMessage("Recording paused");
      setPause(true);
    } else if (pause && mr.state === "paused") {
      mr.resume();
      startTimeRef.current = Date.now();
      recordingIntervalRef.current = setInterval(updateRecordingTime, 1000);
      showMessage("Recording resumed");
      setPause(false);
    }
  };

  const endCall = () => {
    try {
      stream?.getTracks().forEach((t) => t.stop());
    } catch {}
    ws.emit("leave-room", { roomId: id, peerId: me?.id });
    try {
      me?.destroy?.();
    } catch {}
    navigate("/");
  };

  // --- Compute video tiles ---
  const screenSharingVideo =
    screenSharingId === userId ? screenStream : peers[screenSharingId]?.stream;

  const peerEntries = Object.entries(peers).filter(
    ([peerId]) => peerId !== screenSharingId
  );
  const totalTiles = peerEntries.length + 1; // +1 for self

  // Grid columns based on tile count
  const gridClass =
    totalTiles === 1
      ? "grid-cols-1"
      : totalTiles === 2
      ? "grid-cols-1 md:grid-cols-2"
      : totalTiles <= 4
      ? "grid-cols-2"
      : totalTiles <= 9
      ? "grid-cols-2 md:grid-cols-3"
      : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  const participantCount = peerEntries.length + 1;
  const formattedTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Device error modal */}
      <DeviceErrorModal
        isOpen={!!deviceError}
        error={deviceError}
        onRetry={() => initializeMediaStream(true)}
        onAudioOnly={() => initializeMediaStream(false)}
        onClose={() => setDeviceError("")}
      />

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-4 text-sm text-gray-300">
          <span>{formattedTime}</span>
          <span className="text-gray-600">|</span>
          <span className="truncate max-w-[200px]" title={id}>
            Room: {id}
          </span>
        </div>
        <button
          onClick={() => setShowParticipants(!showParticipants)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-700 text-sm text-gray-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          {participantCount}
        </button>
      </div>

      {/* Toast message */}
      {message && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-gray-700 text-white px-4 py-2 rounded-full text-sm">
          {message}
        </div>
      )}

      {/* Recording indicator */}
      {recording && (
        <div className="absolute top-14 right-4 z-50 bg-red-600 text-white px-3 py-1.5 rounded-full flex items-center gap-2 text-sm">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span>{recordingTime}</span>
          <RecordingOnOff onClick={pauseRecord} pause={pause} />
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className="flex-1 flex flex-col p-3 overflow-auto">
          {/* Screen share (full width when active) */}
          {screenSharingVideo && (
            <div className="mb-3 rounded-xl overflow-hidden bg-black" style={{ height: "60%" }}>
              <VideoPlayer stream={screenSharingVideo} label="Screen Share" />
            </div>
          )}

          {/* Video grid */}
          <div className={`grid ${gridClass} gap-3 flex-1`}>
            {/* Local video */}
            <div className="relative bg-gray-800 rounded-xl overflow-hidden min-h-[200px]">
              {isAudioOnly ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center text-2xl font-bold mx-auto mb-2">
                      {userName?.[0]?.toUpperCase() || "Y"}
                    </div>
                    <div className="text-gray-400 text-sm">{userName || "You"} (Audio Only)</div>
                  </div>
                </div>
              ) : (
                <VideoPlayer stream={stream} label={userName || "You"} isLocal={true} />
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                {!isVideoOn && (
                  <span className="bg-red-600 rounded-full p-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </span>
                )}
                {!isAudioOn && (
                  <span className="bg-red-600 rounded-full p-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  </span>
                )}
              </div>
            </div>

            {/* Remote peers */}
            {peerEntries.map(([peerId, p]) => {
              const peer = p as any;
              return (
                <div key={peerId} className="relative bg-gray-800 rounded-xl overflow-hidden min-h-[200px]">
                  {peer.stream ? (
                    <VideoPlayer stream={peer.stream} label={peer.userName || "Participant"} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center text-2xl font-bold mx-auto mb-2">
                          {peer.userName?.[0]?.toUpperCase() || "P"}
                        </div>
                        <div className="text-gray-400 text-sm">{peer.userName || "Participant"}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Participants sidebar */}
        {showParticipants && (
          <div className="w-72 bg-gray-800 border-l border-gray-700 p-4 overflow-auto shrink-0">
            <h3 className="font-semibold mb-4 text-lg">Participants ({participantCount})</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-700">
                <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold">
                  {userName?.[0]?.toUpperCase() || "Y"}
                </div>
                <span className="text-sm">{userName || "You"} (You)</span>
              </div>
              {peerEntries.map(([peerId, p]) => {
                const peer = p as any;
                return (
                  <div key={peerId} className="flex items-center gap-3 p-2 rounded-lg bg-gray-700">
                    <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-sm font-bold">
                      {peer.userName?.[0]?.toUpperCase() || "P"}
                    </div>
                    <span className="text-sm">{peer.userName || "Anonymous"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chat sidebar */}
        {chat.isChatOpen && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col shrink-0">
            <div className="px-4 py-3 border-b border-gray-700 font-semibold">Chat</div>
            <Chat />
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="flex items-center justify-center gap-3 px-4 py-3 bg-gray-800 border-t border-gray-700 shrink-0">
        <AudioButton onClick={toggleAudio} recording={isAudioOn} />
        <CameraButton onClick={toggleVideo} recording={isVideoOn} />
        <ShareScreenButton onClick={shareScreen} />
        <RecordingButton onClick={toggleRecording} recording={recording} />
        <ChatButton onClick={toggleChat} />
        <EndCallButton onClick={endCall} />
      </div>
    </div>
  );
};
