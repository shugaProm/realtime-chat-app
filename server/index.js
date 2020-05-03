const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");

const PORT = process.env.PORT || 5000;

const router = require("./router");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");

// because we are managing this particular socket, all code should be in that block: connection and disconnection

// connection to the socket on the client side
io.on("connect", socket => {
  socket.on("join", ({ name, room }, callback) => {
    // taking 2 args because we return either a user or an error
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);

    socket.join(user.room);

    // send a message to the newly added user
    socket.emit("message", {
      user: "admin",
      text: `${user.name}, welcome to ${user.room} group`,
    });

    // send a message to other users in the group telling them a new user has joined
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name} has joined!` });

    // get all users in the room
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    // call the callback fxn so we can do something on the frontend
    callback();
  });

  // user generated message
  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    // emit the user event (send message) to the room
    io.to(user.room).emit("message", { user: user.name, text: message });

    // send a new message when the user leaves
    io.to(user.room).emit("message", { user: user.name, text: message });

    // call the callback fxn so we can do something on the frontend
    callback();
  });

  // disconnect socket: no parameters because that user has left
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", {
        user: "admin",
        text: `${user.name} has left.`,
      });
    }
  });
});

app.use(cors());

app.use(router);

server.listen(PORT, () => console.log(`Server started at port ${PORT}`));
