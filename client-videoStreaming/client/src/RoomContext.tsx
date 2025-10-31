import Peer from "peerjs";
import React, { createContext, useEffect, useState, useReducer, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import socketIOClient from "socket.io-client";
import { v4 as uuidV4 } from "uuid";
import { peersReducer } from "./context/peerReducer";
import {
  addPeerAction,
  addPeerNameAction,
  removePeerAction,
  updateAudioAction,
  updateVideoAction,
} from "./context/peerActions";
import { IMessage } from "./types/chat";
import { chatReducer } from "./context/chatReducer";
import {
  addHistoryAction,
  addMessageAction,
  toggleChatAction,
} from "./context/chatActions";

const WS = "http://localhost:8000";

interface RoomContextType {
  ws: any;
  me: Peer | undefined;
  stream: MediaStream | undefined;
    screenStream: MediaStream | null;
  peers: any;
  chat: any;
  shareScreen: () => Promise<void>;
  screenSharingId: string;
  setRoomId: (id: string) => void;
  toggleVideo: () => Promise<void>;
  toggleAudio: () => Promise<void>;
  isVideoOn: boolean;
  isAudioOn: boolean;
  sendMessage: (message: string) => void;
  toggleChat: () => void;
  setUserName: (name: string) => void;
  userName: string;
  userId: string;
  deviceError: string;
  setDeviceError: (error: string) => void;
  isAudioOnly: boolean;
  initializeMediaStream: (withVideo?: boolean) => Promise<void>;
}

export const RoomContext = createContext<RoomContextType>({} as RoomContextType);

export const RoomProvider: React.FunctionComponent<any> = ({ children }) => {
  const ws = useMemo(() => socketIOClient(WS), []);
  const navigate = useNavigate();
  const [me, setMe] = useState<Peer>();
  const [userName, setUserName] = useState(
    localStorage.getItem("userName") || ""
  );
  const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
  const [isAudioOn, setIsAudioOn] = useState<boolean>(true);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [userId, setUserId] = useState<any>()
  const [stream, setStream] = useState<MediaStream>();
  const [peers, dispatch] = useReducer(peersReducer, {});
  const [screenSharingId, setScreenSharingId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>();
  const [deviceError, setDeviceError] = useState<string>("");
  const [isAudioOnly, setIsAudioOnly] = useState<boolean>(false);
  const [chat, chatDispatch] = useReducer(chatReducer, {
    messages: [],
    isChatOpen: false,
  });
  const toggleVideo = async () => {
    if (!stream) {
      // No stream exists, try to initialize one
      await initializeMediaStream(true);
      return;
    }

    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) {
      // No video track exists, try to get video access
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = newStream.getVideoTracks()[0];
        stream.addTrack(newVideoTrack);
        newVideoTrack.enabled = true;
        setIsVideoOn(true);
        dispatch(updateVideoAction(me?.id || "", true));
        localStorage.setItem("isVideoOn", "true");
        setIsAudioOnly(false);
      } catch (error) {
        console.error("Could not enable video:", error);
        setDeviceError("Could not access camera. Please check your device permissions.");
      }
      return;
    }

    // We have a video track, toggle it
    const videoTrack = videoTracks[0];
    try {
      videoTrack.enabled = !videoTrack.enabled;
      dispatch(updateVideoAction(me?.id || "", videoTrack.enabled));
      setIsVideoOn(videoTrack.enabled);
      localStorage.setItem("isVideoOn", videoTrack.enabled ? "true" : "false");
    } catch (error) {
      console.error("Error toggling video:", error);
      setDeviceError("Error toggling video. Please try reloading the page.");
    }
  };


  const toggleAudio = async (): Promise<void> => {
    if (!stream) {
      try {
        // Try to initialize stream with audio only
        await initializeMediaStream(false);
      } catch (error) {
        console.error("Could not initialize audio stream:", error);
        setDeviceError("Could not access microphone. Please check your device permissions.");
        return;
      }
    }

    try {
      const audioTracks = stream?.getAudioTracks() || [];
      if (audioTracks.length > 0) {
        const currentAudioState = audioTracks[0].enabled;
        audioTracks.forEach((audioTrack) => {
          audioTrack.enabled = !currentAudioState;
        });

        dispatch(updateAudioAction(me?.id || "", currentAudioState));
        setIsAudioOn(!currentAudioState);
        localStorage.setItem(
          "isAudioOn",
          currentAudioState ? "true" : "false"
        );
      } else {
        // No audio tracks, try to get audio access
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newAudioTrack = newStream.getAudioTracks()[0];
        stream?.addTrack(newAudioTrack);
        newAudioTrack.enabled = true;
        setIsAudioOn(true);
        dispatch(updateAudioAction(me?.id || "", true));
        localStorage.setItem("isAudioOn", "true");
      }
    } catch (error) {
      console.error("Error toggling audio:", error);
      setDeviceError("Could not access microphone. Please check your device permissions.");
    }
  };

  const enterRoom = ({ roomId }: { roomId: "string" }) => {
    navigate(`/room/${roomId}`);
  };

  const leftRoom = ({ roomId }: { roomId: "string" }) => {
    navigate("/");
  };
  const getUsers = ({ participants }: { participants: string[] }) => {
    console.log({ participants });
  };

  const removePeer = (peerId: string) => {
    dispatch(removePeerAction(peerId));
  };

  const switchStream = async (newStream: MediaStream): Promise<void> => {
    if (!me || !me.connections) {
      throw new Error("Peer connection not established");
    }

    const videoTrack = newStream?.getTracks().find(track => track.kind === "video");
    if (!videoTrack) {
      throw new Error("No video track found in the stream");
    }

    // Set screen sharing ID before replacing tracks
    setScreenSharingId(me.id || "");

    const promises = Object.values(me.connections).map(async (connectionArr: any) => {
      const connections = Array.isArray(connectionArr) ? connectionArr : [connectionArr];
      
      for (const connection of connections) {
        if (!connection?.peerConnection) continue;

        try {
          const senders = connection.peerConnection.getSenders() || [] as RTCRtpSender[];
          const sender = senders.find((s: RTCRtpSender) => s.track?.kind === "video");
          
          if (sender) {
            await sender.replaceTrack(videoTrack);
            console.log("Track replaced successfully for peer");
          } else {
            console.warn("No video sender found in peer connection");
          }
        } catch (err) {
          console.error("Error replacing track:", err);
          throw err;
        }
      }
    });

    try {
      await Promise.all(promises);
      console.log("Stream switched successfully for all peers");
    } catch (error) {
      console.error("Error switching stream:", error);
      throw error;
    }
  };

  const shareScreen = async (): Promise<void> => {
    try {
      if (screenSharingId) {
        // Stop screen sharing
        if (screenStream) {
          screenStream.getTracks().forEach(track => track.stop());
          setScreenStream(null);
        }
        // Switch back to camera stream
        if (stream) {
          await switchStream(stream);
          setScreenSharingId("");
          ws.emit("stop-sharing");
        }
      } else {
        // Start screen sharing
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });

        // Listen for when user stops sharing via browser controls
        displayStream.getVideoTracks()[0].onended = () => {
          if (stream) {
            switchStream(stream).catch(console.error);
              setScreenStream(null);
            setScreenSharingId("");
            ws.emit("stop-sharing");
          }
        };

        await switchStream(displayStream);
        setScreenStream(displayStream);
        ws.emit("start-sharing", { peerId: me?.id, roomId });
      }
    } catch (error) {
      console.error("Error with screen sharing:", error);
      const errorMessage = error instanceof Error && error.name === 'NotAllowedError'
        ? 'Screen sharing was denied. Please grant permission to share your screen.'
        : 'Could not start screen sharing. Please try again.';
      setDeviceError(errorMessage);
      throw error;
    }
  };

  const addMessage = (message: any) => {
    chatDispatch(addMessageAction(message));
  };

  const sendMessage = (message: string) => {
    const messageData: IMessage = {
      content: message,
      timestamp: new Date().getTime(),
      author: me?.id,
    };
    chatDispatch(addMessageAction(messageData));

    ws.emit("send-message", roomId, messageData);
  };

  const addHistory = (messages: IMessage[]) => {
    chatDispatch(addHistoryAction(messages));
  };

  const toggleChat = () => {
    chatDispatch(toggleChatAction(!chat.isChatOpen));
  };

  const initializeMediaStream = async (withVideo: boolean = true): Promise<void> => {
    try {
      const constraints = {
        video: withVideo,
        audio: true
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      setDeviceError("");
      setIsAudioOnly(!withVideo);

      if (localStorage.getItem("isVideoOn") === "false" && withVideo) {
        const videoTrack = newStream.getVideoTracks()[0];
        videoTrack.enabled = false;
        dispatch(updateVideoAction(me?.id || "", false));
      }

      if (localStorage.getItem("isAudioOn") === "false") {
        const audioTracks = newStream.getAudioTracks();
        if (audioTracks.length > 0) {
          audioTracks.forEach((audioTrack) => {
            audioTrack.enabled = false;
          });
          dispatch(updateAudioAction(me?.id || "", false));
        }
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.name === 'NotAllowedError' 
        ? 'Please allow access to your camera and microphone to join the meeting.'
        : error.name === 'NotFoundError'
        ? 'No camera or microphone found. Please check your devices and try again.'
        : 'There was an error accessing your media devices.';
      
      setDeviceError(errorMessage);

      // If video fails, try audio-only as fallback
      if (withVideo) {
        try {
          await initializeMediaStream(false);
        } catch (audioError) {
          setDeviceError('Could not access camera or microphone. Please check your device permissions.');
        }
      }
    }
  };

  useEffect(() => {
    localStorage.setItem("userName", userName);
  }, [userName]);

  // registering socket listeners and peer creation — keep stable for provider lifecycle
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const saveId = localStorage.getItem("userId");
    const meId = saveId || uuidV4();
    setUserId(meId)
    localStorage.setItem("userId", meId);
    const peer = new Peer(meId, {
      host: "localhost",
      port: 9002,
      path: "/",
    });
    setMe(peer);

    setIsVideoOn(localStorage.getItem("isVideoOn") === "true" ? true : false);
    setIsAudioOn(localStorage.getItem("isAudioOn") === "true" ? true : false);

    initializeMediaStream();

    ws.on("room-created", enterRoom);
    ws.on("get-users", getUsers);
    ws.on("user-disconnected", removePeer);
    ws.on("joined-room", enterRoom);
    ws.on("user-left-room", leftRoom);
    ws.on("user-started-sharing", (peerId) => setScreenSharingId(peerId));
    ws.on("user-stopped-sharing", () => setScreenSharingId(""));
    ws.on("add-message", addMessage);
    ws.on("get-messages", addHistory);

    return () => {
      ws.off("room-created");
      ws.off("get-users");
      ws.off("user-disconnected");
      ws.off("user-started-sharing");
      ws.off("user-stopped-sharing");
      ws.off("user-joined");
      ws.off("add-message");
      ws.off("get-messages");
      try {
        ws.disconnect?.();
      } catch (err) {
        /* ignore */
      }
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    if (screenSharingId) {
      ws.emit("start-sharing", { peerId: screenSharingId, roomId });
    } else {
      ws.emit("stop-sharing");
    }
  }, [screenSharingId, roomId, ws]);

  useEffect(() => {
    if (!me) return;
    if (!stream) return;

    ws.on("user-joined", ({ peerId, userName: name }) => {
      dispatch(addPeerNameAction(peerId, name));
      const call = me.call(peerId, stream, {
        metadata: {
          userName,
        },
      });
      console.log("user-joined", peerId, stream);
      call.on("stream", (peerStream) => {
        console.log("call-stream-joined", peerId, stream);
        dispatch(addPeerAction(peerId, peerStream));
      });
    });

    me.on("call", (call) => {
      const { userName } = call.metadata;
      dispatch(addPeerNameAction(call.peer, userName));
      call.answer(stream);
      console.log("me-joined", stream);
      call.on("stream", (peerStream) => {
        console.log("me-joined-call", stream);
        dispatch(addPeerAction(call.peer, peerStream));
      });
    });
  }, [me, stream, userName, ws]);

  console.log({ peers });

  return (
    <RoomContext.Provider
      value={{
        ws,
        me,
        stream,
        screenStream,
        peers,
        chat,
        shareScreen,
        screenSharingId,
        setRoomId,
        toggleVideo,
        toggleAudio,
        isVideoOn,
        isAudioOn,
        sendMessage,
        toggleChat,
        setUserName,
        userName,
        userId,
        deviceError,
        setDeviceError,
        isAudioOnly,
        initializeMediaStream
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};
