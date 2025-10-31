import { Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";

const rooms: Record<string, Record<string, IUser>> = {};
const chats: Record<string, IMessage[]> = {};

interface IUser {
  peerId:string,
  userName: string
}
interface IRoomParams {
  roomId: string;
  peerId: string;
}
interface IMessage {
  content: string;
  author?: string;
  timestamp: number;
}

interface IJoinRoomParams extends IRoomParams {
  userName: string;
}

export const roomHandler = (socket: Socket) => {
  const createRoom = () => {
    const roomId = uuidv4();
    rooms[roomId] = {}
    socket.emit("room-created", { roomId });
    console.log("createeeeeed room");
  };

  const joinRoom = ({ roomId, peerId, userName }: IJoinRoomParams) => {
    if (!rooms[roomId]) rooms[roomId] = {};
    if (!chats[roomId]) chats[roomId] = [];

    socket.emit("get-messages",chats[roomId])
      console.log("hello joining this room", roomId, peerId);
      rooms[roomId][peerId] = {peerId, userName}
      socket.join(roomId);
      socket.emit("joined-room", { roomId });
      socket.to(roomId).emit("user-joined", { peerId, userName });
      // send current participants to the joining client
      socket.emit("get-users", {
        roomId,
        participants: rooms[roomId],
      });
      // notify others with updated participants as well
      socket.to(roomId).emit("get-users", {
        roomId,
        participants: rooms[roomId],
      });
    
    socket.on("disconnect", () => {
      console.log("left the room", peerId);
      leaveRoom({ roomId, peerId });
    });
  };

  const leaveRoom = ({ roomId, peerId }: IRoomParams) => {
    console.log("inside leaveRoom FUnction");
    // rooms[roomId] = rooms[roomId]?.filter((id) => id !== peerId);
    // remove participant from server state
    if (rooms[roomId] && rooms[roomId][peerId]) {
      delete rooms[roomId][peerId];
    }

  // notify the leaving client and other participants
  // emit an object so clients receive a consistent payload shape
  socket.emit("user-left-room", { roomId, peerId });
    socket.to(roomId).emit("user-disconnected", peerId);

    // emit updated participants
    if (rooms[roomId]) {
      socket.to(roomId).emit("get-users", {
        roomId,
        participants: rooms[roomId],
      });
    }

    // cleanup empty room data
    if (rooms[roomId] && Object.keys(rooms[roomId]).length === 0) {
      delete rooms[roomId];
      delete chats[roomId];
    }
  };

  const startSharing = ({ peerId, roomId }: IRoomParams) => {
    console.log({ roomId, peerId });
    socket.to(roomId).emit("user-started-sharing", peerId);
  };

  const stopSharing = (roomId?: string) => {
    // client may call without roomId; if provided, emit to the room, else broadcast
    if (roomId) {
      socket.to(roomId).emit("user-stopped-sharing");
    } else {
      socket.broadcast.emit("user-stopped-sharing");
    }
  };

  const addMessage = (roomId: string, message: IMessage) => {
    console.log({ message });
    if(chats[roomId]) {
        chats[roomId].push(message)
    }
    else {
        chats[roomId] = [message]
    }
    socket.to(roomId).emit("add-message",message)
  };

  socket.on("create-room", createRoom);
  socket.on("join-room", joinRoom);
  socket.on("start-sharing", startSharing);
  socket.on("stop-sharing", stopSharing);
  socket.on("leave-room", leaveRoom);
  socket.on("send-message", addMessage);

  //    socket.on("toggle-video",toggleVideo)
};
