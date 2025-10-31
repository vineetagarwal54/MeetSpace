import React, { useContext, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { RoomContext } from "../RoomContext";
import { VideoPlayer } from "../components/VideoPlayer";
// peer types are implicit here; consider importing PeerState when needed
import { ShareScreenButton } from "../components/ShareScreenButton";
import { RecordingButton } from "../components/RecordingButton";
import { EndCallButton } from "../components/EndCallButton";
import { CameraButton } from "../components/CameraButton";
import { AudioButton } from "../components/AudioButton";
// import { RecordingOnOff } from "../components/RecordingOnOff";
import { RecordingOnOff } from "../components/RecordingOnOff";
import { ChatButton } from "../components/ChatButton";
import { Chat } from "../components/chat/Chat";
import NameInput from "../common/Name";
import { DeviceErrorModal } from "../components/DeviceErrorModal";
import { RoomTopBar } from "../components/RoomTopBar";

export const Room = () => {
  const { id } = useParams();
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
    initializeMediaStream
  } = useContext(RoomContext);
  const [recording, setRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<any | null>(null);
  const [recordingTime, setRecordingTime] = useState<string>("00:00");
  const [message, setMessage] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<any>();
  const [pause, setPause] = useState<boolean>(false);
  const [pausedDuration, setPausedDuration] = useState<any>();

  console.log(peers,"prrtt")
  const toggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const pauseRecord = () => {
    if (!pause) {
      pauseRecording();
    } else {
      resumeRecording();
    }
  };


  const pauseRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.pause();
      clearInterval(recordingIntervalRef.current);
      setMessage("Recording paused");
  
      if (startTimeRef.current) {
        const elapsedWithoutPause = Date.now() - startTimeRef.current;
        setPausedDuration(elapsedWithoutPause);
        console.log("time", startTimeRef.current, elapsedWithoutPause);
      }
  
      setTimeout(() => setMessage(null), 2000);
      setPause(true);
    }
  };
  

  const resumeRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "paused"
    ) {
      mediaRecorderRef.current.resume();
      recordingIntervalRef.current = setInterval(updateRecordingTime, 1000);
      setMessage("Recording resumed");
      setTimeout(() => setMessage(null), 2000);
      setPause(false);
    }
  };

  const startRecording = () => {
    if (!stream) {
      setMessage("No local media available to record.");
      setTimeout(() => setMessage(null), 2000);
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setMessage("Recording is not supported in this browser.");
      setTimeout(() => setMessage(null), 2000);
      return;
    }

    recordedChunksRef.current = []; // reset
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

    mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstart = () => {
      startTimeRef.current = Date.now();
      recordingIntervalRef.current = setInterval(updateRecordingTime, 1000);
      setMessage("Recording started");
      setTimeout(() => setMessage(null), 2000);
    };

    mediaRecorder.onstop = () => {
      clearInterval(recordingIntervalRef.current);
      const recordedBlob = new Blob(recordedChunksRef.current, {
        type: "video/webm",
      });
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(recordedBlob);
      downloadLink.download = "recorded-meeting.webm";
      downloadLink.click();
      recordedChunksRef.current = [];
      startTimeRef.current = null;
      setRecordingTime("00:00");
      setMessage("Recording stopped");
      setTimeout(() => setMessage(null), 2000);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };
  const end = () => {
    console.log("hello");
    // stop local media
    try {
      stream?.getTracks()?.forEach((t: MediaStreamTrack) => t.stop());
    } catch (err) {
      // ignore
    }
    // destroy peer if present
    try {
      me?.destroy?.();
    } catch (err) {}

    ws.emit("leave-room", { roomId: id, peerId: me?.id });
  };

  const updateRecordingTime = () => {
    if (startTimeRef.current) {
      const currentTime = Date.now();
      const elapsedWithoutPause = currentTime - startTimeRef.current;
      const elapsedWithPause = pause
        ? elapsedWithoutPause - pausedDuration
        : elapsedWithoutPause;
  
      const seconds = Math.floor(elapsedWithPause / 1000) % 60;
      const minutes = Math.floor(elapsedWithPause / (1000 * 60)) % 60;
      const hours = Math.floor(elapsedWithPause / (1000 * 60 * 60));
  
      setRecordingTime(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
          2,
          "0"
        )}:${String(seconds).padStart(2, "0")}`
      );
    }
  };
  
  

  useEffect(() => {
    if (!me) return;
    const emitJoin = () => ws.emit("join-room", { roomId: id, peerId: me.id, userName });
    if ((me as any).open) {
      // already open
      emitJoin();
    } else {
      me.on("open", emitJoin);
    }
    return () => {
      try { me.off?.("open", emitJoin as any); } catch {}
    };
  }, [id, ws, me, userName]);

  useEffect(() => {
    setRoomId(id || "");
  }, [id, setRoomId]);

  const screenSharingVideo =
    screenSharingId === userId ? screenStream : peers[screenSharingId]?.stream;
  const { [screenSharingId]: sharing, ...peersToShow } = peers;

  // console.log(peersToShow[0], "peersToSHowww");

  const handleRetryWithVideo = () => {
    initializeMediaStream(true);
  };

  const handleAudioOnly = () => {
    initializeMediaStream(false);
  };

  const [showParticipants, setShowParticipants] = useState(false);
  const participantCount = Object.keys(peersToShow).length + 1; // +1 for self

  return (
    <div className="bg-gray-900 min-h-screen">
      <DeviceErrorModal 
        isOpen={!!deviceError}
        error={deviceError}
        onRetry={handleRetryWithVideo}
        onAudioOnly={handleAudioOnly}
        onClose={() => setDeviceError("")}
      />

      <RoomTopBar 
        roomId={id || ""} 
        onToggleParticipants={() => setShowParticipants(!showParticipants)}
        participantCount={participantCount}
      />

      <div className="flex min-h-screen pt-14">
        <main className={`flex-1 p-4 ${showParticipants ? 'pr-80' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
            {/* Main video container */}
            <div className={`${selectedStream || screenSharingVideo ? 'col-span-full row-span-2 h-[60vh]' : 'h-48'} bg-gray-800 rounded-lg overflow-hidden relative`}>
              {selectedStream ? (
                <VideoPlayer stream={selectedStream} label={"Selected"} />
              ) : screenSharingVideo ? (
                <VideoPlayer stream={screenSharingVideo} label={"Screen"} />
              ) : isAudioOnly ? (
                <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-4xl mb-2">🎤</div>
                    <div className="text-gray-300">{userName || 'You'} (Audio Only)</div>
                  </div>
                </div>
              ) : (
                <VideoPlayer stream={stream} label={userName || 'You'} isLocal={true} />
              )}
            </div>

            {/* Other participants */}
            {Object.entries(peersToShow).map(([peerId, p]) => {
              const peer = p as any;
              return (
                <div 
                  key={peerId}
                  className="h-48 bg-gray-800 rounded-lg overflow-hidden relative cursor-pointer"
                  onClick={() => setSelectedStream(peer.stream)}
                >
                  <VideoPlayer stream={peer.stream} label={peer.userName || 'Participant'} />
                </div>
              );
            })}
          </div>

          {message && (
            <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full">
              {message}
            </div>
          )}
          
          {recording && (
            <div className="fixed top-16 right-4 bg-red-500 text-white px-4 py-2 rounded-full flex items-center space-x-2">
              <RecordingOnOff onClick={pauseRecord} pause={pause} />
              <span>{recordingTime}</span>
            </div>
          )}
        </main>

        {/* Participants sidebar */}
        <aside className={`fixed right-0 top-14 bottom-0 w-80 bg-gray-800 transform transition-transform duration-300 ease-in-out ${showParticipants ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4">
            <h3 className="text-white font-semibold mb-4">Participants ({participantCount})</h3>
            <div className="space-y-3">
              {/* Current user */}
              <div className="flex items-center gap-3 p-2 rounded bg-gray-700">
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white">
                  {userName?.[0] || 'Y'}
                </div>
                <div className="flex-1">
                  <div className="text-white">{userName || 'You'} (You)</div>
                </div>
              </div>

              {/* Other participants */}
              {Object.entries(peersToShow).map(([peerId, p]) => {
                const peer = p as any;
                return (
                  <div key={peerId} className="flex items-center gap-3 p-2 rounded bg-gray-700">
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white">
                      {peer.userName?.[0] || 'P'}
                    </div>
                    <div className="flex-1">
                      <div className="text-white">{peer.userName || 'Anonymous'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {chat.isChatOpen && (
          <div className="fixed right-0 top-14 bottom-16 w-80 bg-gray-800 border-l border-gray-700">
            <Chat />
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-gray-800 border-t border-gray-700">
        <div className="max-w-3xl mx-auto h-full flex items-center justify-center space-x-4">
          <AudioButton onClick={toggleAudio} recording={isAudioOn} />
          <CameraButton onClick={toggleVideo} recording={isVideoOn} />
          <ShareScreenButton onClick={shareScreen} />
          <RecordingButton onClick={toggleRecording} recording={recording} />
          <ChatButton onClick={toggleChat} />
          <EndCallButton onClick={end} />
        </div>
      </div>
    </div>
  );
};
