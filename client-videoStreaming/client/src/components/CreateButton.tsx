import { useContext } from "react";
import { RoomContext } from "../RoomContext";
import NameInput from "../common/Name";

export const CreateButton = () => {
  const { ws } = useContext(RoomContext);

  const createRoom = () => {
    ws.emit("create-room");
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full">
      <NameInput />
      <button
        onClick={createRoom}
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors whitespace-nowrap"
      >
        New Meeting
      </button>
    </div>
  );
};
