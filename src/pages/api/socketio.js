const http = require("http");
const socketIO = require("socket.io");
const mongoose = require("mongoose");
const express = require("express");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const MONGO_URL = "mongodb://localhost:27017/myDatabase";

mongoose.connect(MONGO_URL, { useNewUrlParser: true });

const Drawing = mongoose.model("Drawing", {
  points: Array,
});

const PORT = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = express();

  const httpServer = http.createServer(server);
  const io = socketIO(httpServer);

  const maxUsersInRoom = 20;
  let roomNumber = 1;

  const roomUsers = {};

  io.on("connection", (socket) => {
    let currentRoom;
    socket.on("disconnect", () => {
      if (currentRoom) {
        const room = roomUsers[currentRoom];
        room.splice(room.indexOf(socket.id), 1);
        socket.leave(currentRoom);
        console.log(`User ${socket.id} left room ${currentRoom}`);
        if (room.length === 0 && currentRoom !== "default") {
          delete roomUsers[currentRoom];
          console.log(`Room ${currentRoom} deleted`);
        }
      }
    });
    if (Object.keys(roomUsers).length === 0) {
      roomUsers.default = [];
      socket.join("default");
      console.log(`User ${socket.id} joined room default`);
    } else if (Object.keys(roomUsers).length > maxUsersInRoom) {
      socket.emit("full");
      console.log(`User ${socket.id} cannot join, rooms are full`);
    } else {
      if (!roomUsers[`room${roomNumber}`]) {
        roomUsers[`room${roomNumber}`] = [];
      }

      socket.join(`room${roomNumber}`);
      roomUsers[`room${roomNumber}`].push(socket.id);
      currentRoom = `room${roomNumber}`;

      console.log(`User ${socket.id} joined room ${currentRoom}`);

      if (roomUsers[currentRoom].length === maxUsersInRoom) {
        roomNumber++;
      }
    }
    socket.on("draw", (data) => {
      const { point, prevPoint, color } = data;
      const drawing = new Drawing({
        points: [
          { x: prevPoint.x, y: prevPoint.y },
          { x: point.x, y: point.y },
        ],
        color,
      });
      drawing.save().then(() => {
        io.to(currentRoom).emit("draw", data);
      });
    });
  });

  server.all("*", (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
