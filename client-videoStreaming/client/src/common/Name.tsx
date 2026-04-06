import { useContext } from "react";
import { RoomContext } from "../RoomContext";

export default function NameInput() {
  const { userName, setUserName } = useContext(RoomContext);
  return (
    <input
      className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
      placeholder="Your name"
      onChange={(e) => setUserName(e.target.value)}
      value={userName}
    />
  );
}
