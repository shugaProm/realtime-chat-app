import React, { useState, useEffect } from "react";
import queryString from "query-string";
import io from "socket.io-client";

import "./Chat.css";
import Infobar from "../Infobar/Infobar";
import Input from "../Input/Input";
import Messages from "../Messages/Messages";
import TextContainer from "../TextContainer/TextContainer";

let socket;
const Chat = ({ location }) => {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const ENDPOINT = "https://promise-chat-app.herokuapp.com/";

  useEffect(() => {
    const { name, room } = queryString.parse(location.search);

    // when we get our first connection
    socket = io(ENDPOINT);

    setName(name);
    setRoom(room);

    // emit an event from the frontend and call the fxn on the backend using the same event name
    // logic for user joining and disconnecting
    socket.emit("join", { name, room }, error => {
      if (error) {
        alert(error);
      }
    });

    return () => {
      socket.emit("disconnect");

      socket.off();
    };
  }, [ENDPOINT, location.search]);

  useEffect(() => {
    socket.on("message", message => {
      // add the message to the array of messages
      setMessages([...messages, message]);
    });

    // display current users in the room
    socket.on("roomData", ({ users }) => {
      setUsers(users);
    });
  }, [messages]); // run this useEffect only when this messages array changes

  // fxn for sending messages
  const sendMessage = e => {
    e.preventDefault();
    if (message) {
      socket.emit("sendMessage", message, () => setMessage(""));
    }
  };

  return (
    <div className="outerContainer">
      <div className="container">
        <Infobar room={room} />
        <Messages messages={messages} name={name} />
        <Input
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
        />
      </div>
      <TextContainer users={users} />
    </div>
  );
};

export default Chat;
