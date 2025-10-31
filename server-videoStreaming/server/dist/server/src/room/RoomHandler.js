"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomHandler = void 0;
var uuid_1 = require("uuid");
var rooms = {};
var chats = {};
var roomHandler = function (socket) {
    var createRoom = function () {
        var roomId = uuid_1.v4();
        rooms[roomId] = [];
        socket.emit("room-created", { roomId: roomId });
        console.log("createeeeeed room");
    };
    var joinRoom = function (_a) {
        var roomId = _a.roomId, peerId = _a.peerId;
        if (!rooms[roomId])
            rooms[roomId] = [];
        socket.emit("get-messages", chats[roomId]);
        console.log("hello joining this room", roomId, peerId);
        rooms[roomId].push(peerId);
        socket.join(roomId);
        socket.emit("joined-room", { roomId: roomId });
        socket.to(roomId).emit("user-joined", { peerId: peerId });
        socket.emit("get-users", {
            roomId: roomId,
            participants: rooms[roomId],
        });
        socket.on("disconnect", function () {
            console.log("left the room", peerId);
            leaveRoom({ roomId: roomId, peerId: peerId });
        });
    };
    var leaveRoom = function (_a) {
        var _b;
        var roomId = _a.roomId, peerId = _a.peerId;
        console.log("inside leaveRoom FUnction");
        rooms[roomId] = (_b = rooms[roomId]) === null || _b === void 0 ? void 0 : _b.filter(function (id) { return id !== peerId; });
        socket.emit("user-left-room", peerId);
        socket.to(roomId).emit("user-disconnected", peerId);
    };
    var startSharing = function (_a) {
        var peerId = _a.peerId, roomId = _a.roomId;
        console.log({ roomId: roomId, peerId: peerId });
        socket.to(roomId).emit("user-started-sharing", peerId);
    };
    var stopSharing = function (roomId) {
        socket.to(roomId).emit("user-stopped-sharing");
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
