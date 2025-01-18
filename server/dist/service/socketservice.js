"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
class SocketService {
    constructor() {
        console.log("chatting service initialised");
        this._io = new socket_io_1.Server({
            cors: {
                origin: "*",
                allowedHeaders: ["*"]
            }
        });
    }
    initialisechatting() {
        this._io.of("/chat").on("connection", (socket) => {
            console.log("a user connected in chatting");
            socket.on("JOIN", (data) => {
                socket.join(data.room);
                this._io.of("/chat").to(data.room).emit("JOINED", data);
            });
            socket.on("ENDCALL", (data) => {
                this._io.of("/chat").to(data.room).emit("ENDCALL");
            });
            socket.on("MESSAGE", (data) => {
                this._io.of("/chat").to(data.room).emit("MESSAGE", data);
            });
            socket.on("disconnect", () => {
                console.log("chatting user disconnected");
            });
        });
    }
    initialisevideo() {
        this._io.of("/video").on("connection", (socket) => {
            console.log("a user connected in video");
            socket.on("JOINROOM", (data) => {
                console.log("joined the video room" + data.room + "by " + data.email);
                socket.join(data.room);
                this._io.of("/video").to(data.room).emit(data.email, "JOINED video streaming service", data);
            });
            socket.on("JOIN", (data) => {
                console.log(" join the video ");
                this._io.of("/video").to(data.room).emit("JOIN", data);
            });
            socket.on("OFFER", (data) => {
                this._io.of("/video").to(data.room).emit("OFFER", data);
            });
            socket.on("ANSWER", (data) => {
                this._io.of("/video").to(data.room).emit("ANSWER", data);
            });
            socket.on("ICECANDIDATE", (data) => {
                this._io.of("/video").to(data.room).emit("ICECANDIDATE", data);
            });
        });
    }
    initialisejoining() {
        this._io.of("/join").on("connection", (socket) => {
            console.log("a user connected in joining");
            // JOIN THE JOINING ROOM -> this is the room where users request to join a room
            // BOTH ADMIN AND USERS CAN JOIN THIS ROOM
            socket.on("JOINROOM", (data) => {
                console.log("joined the joining room " + data.room);
                socket.join(data.room);
            });
            /*
            * requesting admin to approve the request
            * this event can only be listened by admin
            */
            socket.on("REQUEST", (data) => {
                console.log(data.email + " wants to join the room");
                this._io.of("/join").to(data.room).emit("REQUEST", data);
            });
            /**
             * if admin approves the request
             * data containing details of the user will be emitted to the room
             * user with these credetials can now join the room
             * can only be listened by admin
             */
            socket.on("APPROVE", (data) => {
                console.log("admitting user " + data.email + " to the room" + data.room);
                console.log(data);
                this._io.of("/join").to(data.room).emit("APPROVE", data);
            });
            /**
             * if admin rejects the request
             * data containing details of the user will be emitted to the room
             * user with these credetials cannot join the room
             */
            socket.on("REJECT", (data) => {
                this._io.of("/join").emit("REJECT", data);
            });
            socket.on("disconnect", () => {
                console.log("joined user disconnected");
            });
        });
    }
    get io() {
        return this._io;
    }
}
module.exports = SocketService;
