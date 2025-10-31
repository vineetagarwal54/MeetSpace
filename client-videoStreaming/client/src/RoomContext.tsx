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
  screenStream: MediaStream | undefined;
  peers: any;
  chat: any;
  shareScreen: () => void;
  screenSharingId: string;
  setRoomId: (id: string) => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
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
  const [screenStream, setScreenStream] = useState<MediaStream>();
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
  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      dispatch(updateVideoAction(me?.id || "", videoTrack.enabled));
      setIsVideoOn(videoTrack.enabled);
      localStorage.setItem("isVideoOn", videoTrack.enabled ? "true" : "false");
    }
  };


  const toggleAudio = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
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
      }
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

  const switchStream = (stream: MediaStream) => {
    // setStream(stream);
    setScreenSharingId(me?.id || "");

    // Defensive: ensure Peer connections exist and that senders/tracks are present
    if (!me || !me.connections) return;
    Object.values(me.connections).forEach((connectionArr: any) => {
      const connection = Array.isArray(connectionArr) ? connectionArr[0] : connectionArr;
      if (!connection || !connection.peerConnection) return;
      const videoTrack: any = stream?.getTracks().find((track) => track.kind === "video");
      try {
        const senders = connection.peerConnection.getSenders?.() || [];
        const sender = senders.find((s: any) => s.track && s.track.kind === "video");
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack).catch((err: any) => console.error("replaceTrack error", err));
        }
      } catch (err) {
        console.error("Error replacing track:", err);
      }
    });
  };

  const shareScreen = () => {
    if (screenSharingId) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then(switchStream)
        .catch((error) => {
          console.error("Error accessing media devices:", error);
        });
    } else {
      navigator.mediaDevices
        .getDisplayMedia({})
        .then((stream) => {
          switchStream(stream);
          setScreenStream(stream)
        })
        .catch((error) => {
          console.error("Error accessing display media:", error);
        });
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
