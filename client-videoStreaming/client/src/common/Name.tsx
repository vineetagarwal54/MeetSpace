import React, { useContext } from "react";
import { RoomContext } from "../RoomContext";

export default function NameInput() {
  const { userName, setUserName } = useContext(RoomContext);
  return (
    // <div>NameInput</div>
    <input
      className="border rounded-md p-2 h-10 my-2"
      placeholder="Enter your Name"
      onChange={(e) => setUserName(e.target.value)}
      value={userName}
    />
  );
}
