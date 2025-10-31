import React, { useContext } from 'react'
import { RoomContext } from '../RoomContext'
import NameInput from '../common/Name';

export const CreateButton = () => {
  
    const {ws} = useContext(RoomContext);

    const createRoom = () =>{
      ws.emit("create-room")  
    }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <NameInput />
      <div>
        <button
          onClick={createRoom}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-6 rounded"
        >
          New Meeting
        </button>
      </div>
    </div>
  );
}
