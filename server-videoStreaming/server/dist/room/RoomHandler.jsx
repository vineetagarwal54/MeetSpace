"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomHandler = void 0;
var uuid_1 = require("uuid");
var roomHandler = function (socket) {
    console.log("hii");
    // const createRoom = () => {
    //    const roomId = uuidv4();
    //    console.log("roomId",roomId)
    //    socket.join(roomId);
    //    socket.emit("room-created", {roomId})
    //    console.log("createeeeee room")
    // }
    var joinRoom = function () {
        console.log("join room");
    };
    socket.on("create-room", function () {
        var roomId = uuid_1.v4();
        console.log("roomId", roomId);
        socket.join(roomId);
        socket.emit("room-created", { roomId: roomId });
        console.log("createeeeee room");
    });
    socket.on("join-room", joinRoom);
};
exports.roomHandler = roomHandler;
