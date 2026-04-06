import Peer from "peerjs";
import React, {
  createContext,
  useEffect,
  useState,
  useReducer,
  useMemo,
  useCallback,
  useRef,
} from "react";
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

const WS = process.env.REACT_APP_SERVER_URL || window.location.origin;

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
  const [userId, setUserId] = useState<string>("");
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

  // Refs to avoid stale closures in socket/peer callbacks
  const meRef = useRef<Peer>();
  const streamRef = useRef<MediaStream>();
  const peersRef = useRef<any>({});
  const roomIdRef = useRef<string>();
  const userNameRef = useRef<string>(userName);

  meRef.current = me;
  streamRef.current = stream;
  peersRef.current = peers;
  roomIdRef.current = roomId;
  userNameRef.current = userName;

  const toggleVideo = useCallback(async () => {
    const s = streamRef.current;
    if (!s) {
      await initializeMediaStream(true);
      return;
    }

    const videoTracks = s.getVideoTracks();
    if (videoTracks.length === 0) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        const newVideoTrack = newStream.getVideoTracks()[0];
        s.addTrack(newVideoTrack);
        newVideoTrack.enabled = true;
        setIsVideoOn(true);
        dispatch(updateVideoAction(meRef.current?.id || "", true));
        localStorage.setItem("isVideoOn", "true");
        setIsAudioOnly(false);
      } catch (error) {
        console.error("Could not enable video:", error);
        setDeviceError(
          "Could not access camera. Please check your device permissions."
        );
      }
      return;
    }

    const videoTrack = videoTracks[0];
    videoTrack.enabled = !videoTrack.enabled;
    dispatch(updateVideoAction(meRef.current?.id || "", videoTrack.enabled));
    setIsVideoOn(videoTrack.enabled);
    localStorage.setItem("isVideoOn", videoTrack.enabled ? "true" : "false");
  }, []);

  const toggleAudio = useCallback(async (): Promise<void> => {
    const s = streamRef.current;
    if (!s) {
      try {
        await initializeMediaStream(false);
      } catch (error) {
        setDeviceError(
          "Could not access microphone. Please check your device permissions."
        );
        return;
      }
    }

    try {
      const audioTracks = streamRef.current?.getAudioTracks() || [];
      if (audioTracks.length > 0) {
        const currentAudioState = audioTracks[0].enabled;
        audioTracks.forEach((audioTrack) => {
          audioTrack.enabled = !currentAudioState;
        });
        dispatch(updateAudioAction(meRef.current?.id || "", !currentAudioState));
        setIsAudioOn(!currentAudioState);
        localStorage.setItem("isAudioOn", !currentAudioState ? "true" : "false");
      } else {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const newAudioTrack = newStream.getAudioTracks()[0];
        streamRef.current?.addTrack(newAudioTrack);
        newAudioTrack.enabled = true;
        setIsAudioOn(true);
        dispatch(updateAudioAction(meRef.current?.id || "", true));
        localStorage.setItem("isAudioOn", "true");
      }
    } catch (error) {
      console.error("Error toggling audio:", error);
      setDeviceError(
        "Could not access microphone. Please check your device permissions."
      );
    }
  }, []);

  // Replace the video track on all peer connections (no state changes here)
  const replaceVideoTrack = useCallback(
    async (newStream: MediaStream): Promise<void> => {
      const peer = meRef.current;
      if (!peer || !peer.connections) return;

      const videoTrack = newStream
        .getTracks()
        .find((track) => track.kind === "video");
      if (!videoTrack) return;

      const promises = Object.values(peer.connections).map(
        async (connectionArr: any) => {
          const connections = Array.isArray(connectionArr)
            ? connectionArr
            : [connectionArr];

          for (const connection of connections) {
            if (!connection?.peerConnection) continue;
            try {
              const senders: RTCRtpSender[] =
                connection.peerConnection.getSenders() || [];
              const sender = senders.find(
                (s: RTCRtpSender) => s.track?.kind === "video"
              );
              if (sender) {
                await sender.replaceTrack(videoTrack);
              }
            } catch (err) {
              console.error("Error replacing track:", err);
            }
          }
        }
      );

      await Promise.all(promises);
    },
    []
  );

  const stopScreenSharing = useCallback(async () => {
    // Stop display tracks
    screenStream?.getTracks().forEach((track) => track.stop());
    // Switch back to camera
    if (streamRef.current) {
      await replaceVideoTrack(streamRef.current);
    }
    // Batch all state updates together
    setScreenStream(null);
    setScreenSharingId("");
    ws.emit("stop-sharing", roomIdRef.current);
  }, [screenStream, replaceVideoTrack, ws]);

  const shareScreen = useCallback(async (): Promise<void> => {
    try {
      if (screenSharingId) {
        await stopScreenSharing();
      } else {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        // If user stops sharing via browser controls
        displayStream.getVideoTracks()[0].onended = () => {
          stopScreenSharing();
        };

        // Replace track on all connections FIRST, then update state together
        await replaceVideoTrack(displayStream);

        // Batch these state updates so the UI renders with both at once
        setScreenStream(displayStream);
        setScreenSharingId(meRef.current?.id || "");
        ws.emit("start-sharing", {
          peerId: meRef.current?.id,
          roomId: roomIdRef.current,
        });
      }
    } catch (error) {
      console.error("Error with screen sharing:", error);
      if (error instanceof Error && error.name === "NotAllowedError") {
        setDeviceError(
          "Screen sharing was denied. Please grant permission to share your screen."
        );
      }
    }
  }, [screenSharingId, stopScreenSharing, replaceVideoTrack, ws]);

  const sendMessage = useCallback(
    (message: string) => {
      const messageData: IMessage = {
        content: message,
        timestamp: new Date().getTime(),
        author: meRef.current?.id,
      };
      chatDispatch(addMessageAction(messageData));
      ws.emit("send-message", roomIdRef.current, messageData);
    },
    [ws]
  );

  const toggleChat = useCallback(() => {
    chatDispatch(toggleChatAction(!chat.isChatOpen));
  }, [chat.isChatOpen]);

  const initializeMediaStream = useCallback(
    async (withVideo: boolean = true): Promise<void> => {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: withVideo,
          audio: true,
        });
        setStream(newStream);
        setDeviceError("");
        setIsAudioOnly(!withVideo);

        if (localStorage.getItem("isVideoOn") === "false" && withVideo) {
          const videoTrack = newStream.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.enabled = false;
            setIsVideoOn(false);
          }
        }

        if (localStorage.getItem("isAudioOn") === "false") {
          newStream.getAudioTracks().forEach((audioTrack) => {
            audioTrack.enabled = false;
          });
          setIsAudioOn(false);
        }
      } catch (error: any) {
        console.error("Media error:", error);
        const errorMessage =
          error.name === "NotAllowedError"
            ? "Please allow access to your camera and microphone to join the meeting."
            : error.name === "NotFoundError"
            ? "No camera or microphone found. Please check your devices and try again."
            : "There was an error accessing your media devices.";
        setDeviceError(errorMessage);

        if (withVideo) {
          try {
            await initializeMediaStream(false);
          } catch {
            setDeviceError(
              "Could not access camera or microphone. Please check your device permissions."
            );
          }
        }
      }
    },
    []
  );

  // Persist userName to localStorage
  useEffect(() => {
    localStorage.setItem("userName", userName);
  }, [userName]);

  // ─── One-time setup: create Peer, register socket listeners ───
  useEffect(() => {
    const savedSessionId = sessionStorage.getItem("sessionUserId");
    const meId = savedSessionId || uuidV4();
    setUserId(meId);
    sessionStorage.setItem("sessionUserId", meId);

    const peerHost =
      process.env.REACT_APP_PEER_HOST || window.location.hostname;
    const peerPort = Number(
      process.env.REACT_APP_PEER_PORT || window.location.port || (window.location.protocol === "https:" ? 443 : 80)
    );

    const peer = new Peer(meId, {
      host: peerHost,
      port: peerPort,
      path: "/peer",
      secure: window.location.protocol === "https:",
    });
    setMe(peer);

    setIsVideoOn(localStorage.getItem("isVideoOn") !== "false");
    setIsAudioOn(localStorage.getItem("isAudioOn") !== "false");

    initializeMediaStream();

    // --- Socket listeners (use refs to avoid stale closures) ---

    ws.on("room-created", ({ roomId }: { roomId: string }) => {
      navigate(`/room/${roomId}`);
    });

    ws.on("get-users", (payload: any) => {
      try {
        const participants = payload?.participants || {};
        const currentMe = meRef.current;
        const currentStream = streamRef.current;

        if (currentMe && currentStream) {
          Object.keys(participants).forEach((peerId) => {
            if (!peerId || peerId === currentMe.id) return;
            if (peersRef.current[peerId]) return;

            try {
              const call = currentMe.call(peerId, currentStream, {
                metadata: { userName: userNameRef.current },
              });
              call.on("stream", (peerStream: MediaStream) => {
                dispatch(addPeerAction(peerId, peerStream));
              });
              const name = participants[peerId]?.userName;
              if (name) dispatch(addPeerNameAction(peerId, name));
            } catch (err) {
              console.warn("Could not call participant", peerId, err);
            }
          });
        }
      } catch (err) {
        console.error("Error processing get-users", err);
      }
    });

    ws.on("user-joined", ({ peerId, userName: name }: any) => {
      const currentMe = meRef.current;
      const currentStream = streamRef.current;
      if (!currentMe || !currentStream) return;

      if (name) dispatch(addPeerNameAction(peerId, name));
      try {
        const call = currentMe.call(peerId, currentStream, {
          metadata: { userName: userNameRef.current },
        });
        call.on("stream", (peerStream: MediaStream) => {
          dispatch(addPeerAction(peerId, peerStream));
        });
      } catch (err) {
        console.warn("Could not call new user", peerId, err);
      }
    });

    ws.on("user-disconnected", (peerId: string) => {
      dispatch(removePeerAction(peerId));
    });

    ws.on("user-left-room", (payload: any) => {
      if (payload?.peerId) {
        dispatch(removePeerAction(payload.peerId));
      }
    });

    ws.on("user-started-sharing", (peerId: string) =>
      setScreenSharingId(peerId)
    );
    ws.on("user-stopped-sharing", () => setScreenSharingId(""));

    ws.on("add-message", (message: IMessage) => {
      chatDispatch(addMessageAction(message));
    });

    ws.on("get-messages", (messages: IMessage[]) => {
      chatDispatch(addHistoryAction(messages));
    });

    // Answer incoming calls
    peer.on("call", (call) => {
      const name = call.metadata?.userName;
      if (name) dispatch(addPeerNameAction(call.peer, name));

      // Wait until we have a stream to answer
      const tryAnswer = () => {
        const currentStream = streamRef.current;
        if (currentStream) {
          call.answer(currentStream);
          call.on("stream", (peerStream: MediaStream) => {
            dispatch(addPeerAction(call.peer, peerStream));
          });
        } else {
          // Retry after a short delay if stream isn't ready yet
          setTimeout(tryAnswer, 500);
        }
      };
      tryAnswer();
    });

    peer.on("error", (err) => {
      console.error("PeerJS error:", err);
    });

    return () => {
      ws.off("room-created");
      ws.off("get-users");
      ws.off("user-joined");
      ws.off("user-disconnected");
      ws.off("user-left-room");
      ws.off("user-started-sharing");
      ws.off("user-stopped-sharing");
      ws.off("add-message");
      ws.off("get-messages");
      try {
        peer.destroy();
      } catch {}
      try {
        ws.disconnect();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        initializeMediaStream,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};
