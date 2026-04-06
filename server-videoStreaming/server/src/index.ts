import express from "express"
import http from "http"
import path from "path"
import { Server } from "socket.io";
import cors from "cors"
import { ExpressPeerServer } from "peer";
import { roomHandler } from "./room/RoomHandler";

const port = Number(process.env.PORT) || 8000;
const app = express();
app.use(cors())
const server = http.createServer(app);

// PeerJS server mounted at /peer
const peerServer = ExpressPeerServer(server, {
    path: "/",
});
app.use("/peer", peerServer);

// Serve React build in production
// __dirname = server-videoStreaming/server/dist → go up 3 levels to project root
const clientBuildPath = path.join(__dirname, "../../../client-videoStreaming/client/build");
app.use(express.static(clientBuildPath));

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET","POST"],
    }
});

io.on("connection", async (socket) => {
    console.log("connected")

    roomHandler(socket)
    socket.on("disconnect", () => {
        console.log("user is disconnected")
    })

})

// SPA fallback — serve index.html for client-side routes only
// (skip /peer, /socket.io which are handled by their own middleware)
app.get("*", (req, res, next) => {
    if (req.path.startsWith("/peer") || req.path.startsWith("/socket.io")) {
        return next();
    }
    res.sendFile(path.join(clientBuildPath, "index.html"));
});

server.listen(port,() => {
    console.log(`Listening on port ${port}`)
})
