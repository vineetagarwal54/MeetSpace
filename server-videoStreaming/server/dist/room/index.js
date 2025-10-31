"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomHandler = void 0;
var roomHandler = function (socket) {
    var joinRoom = function () {
        console.log("join room");
    };
    var createRoom = function () {
        console.log("create room");
    };
    socket.on("create-room", createRoom);
    socket.on("join-room", joinRoom);
};
exports.roomHandler = roomHandler;
