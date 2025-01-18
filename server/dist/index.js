"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// write a simple express server that listens on port 3000
const express_1 = require("express");
require('dotenv').config();
const express = require("express");
const http = require("http");
const SocketService = require("./service/socketservice");
//middlewares
const cors = require('cors');
const bodyParser = require('body-parser');
// initilize express
const app = express();
const socketservice = new SocketService();
const port = process.env.PORT || 5000;
//using middlewares
app.use(express.json());
app.use(cors());
app.use(bodyParser.json((0, express_1.urlencoded)({ extended: true })));
const server = http.createServer(app);
socketservice.io.attach(server);
socketservice.initialisechatting();
socketservice.initialisejoining();
socketservice.initialisevideo();
app.get("/", (req, res) => {
    res.send("Hello World!");
});
app.use("/room", require("./routes/room"));
server.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
