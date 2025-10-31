"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomHandler = void 0;
var uuid_1 = require("uuid");
var rooms = {};
var chats = {};
var roomHandler = function (socket) {
    var createRoom = function () {
        var roomId = (0, uuid_1.v4)();
        rooms[roomId] = {};
        socket.emit("room-created", { roomId: roomId });
        console.log("createeeeeed room");
    };
    var joinRoom = function (_a) {
        var roomId = _a.roomId, peerId = _a.peerId, userName = _a.userName;
        if (!rooms[roomId])
            rooms[roomId] = {};
        if (!chats[roomId])
            chats[roomId] = [];
        socket.emit("get-messages", chats[roomId]);
        console.log("hello joining this room", roomId, peerId);
        rooms[roomId][peerId] = { peerId: peerId, userName: userName };
        socket.join(roomId);
        socket.emit("joined-room", { roomId: roomId });
        socket.to(roomId).emit("user-joined", { peerId: peerId, userName: userName });
        // send current participants to the joining client
        socket.emit("get-users", {
            roomId: roomId,
            participants: rooms[roomId],
        });
        // notify others with updated participants as well
        socket.to(roomId).emit("get-users", {
            roomId: roomId,
            participants: rooms[roomId],
        });
        socket.on("disconnect", function () {
            console.log("left the room", peerId);
            leaveRoom({ roomId: roomId, peerId: peerId });
        });
    };
    var leaveRoom = function (_a) {
        var roomId = _a.roomId, peerId = _a.peerId;
        console.log("inside leaveRoom FUnction");
        // rooms[roomId] = rooms[roomId]?.filter((id) => id !== peerId);
        // remove participant from server state
        if (rooms[roomId] && rooms[roomId][peerId]) {
            delete rooms[roomId][peerId];
        }
        // notify the leaving client and other participants
        socket.emit("user-left-room", peerId);
        socket.to(roomId).emit("user-disconnected", peerId);
        // emit updated participants
        if (rooms[roomId]) {
            socket.to(roomId).emit("get-users", {
                roomId: roomId,
                participants: rooms[roomId],
            });
        }
        // cleanup empty room data
        if (rooms[roomId] && Object.keys(rooms[roomId]).length === 0) {
            delete rooms[roomId];
            delete chats[roomId];
        }
    };
    var startSharing = function (_a) {
        var peerId = _a.peerId, roomId = _a.roomId;
        console.log({ roomId: roomId, peerId: peerId });
        socket.to(roomId).emit("user-started-sharing", peerId);
    };
    var stopSharing = function (roomId) {
        // client may call without roomId; if provided, emit to the room, else broadcast
        if (roomId) {
            socket.to(roomId).emit("user-stopped-sharing");
        }
        else {
            socket.broadcast.emit("user-stopped-sharing");
        }
    };
    var addMessage = function (roomId, message) {
        console.log({ message: message });
        if (chats[roomId]) {
            chats[roomId].push(message);
        }
        else {
            chats[roomId] = [message];
        }
        socket.to(roomId).emit("add-message", message);
    };
    socket.on("create-room", createRoom);
    socket.on("join-room", joinRoom);
    socket.on("start-sharing", startSharing);
    socket.on("stop-sharing", stopSharing);
    socket.on("leave-room", leaveRoom);
    socket.on("send-message", addMessage);
    //    socket.on("toggle-video",toggleVideo)
};
exports.roomHandler = roomHandler;
