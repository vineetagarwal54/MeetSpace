import React, { useContext, useState } from 'react'
import {CreateButton} from '../components/CreateButton'
import { RoomContext } from '../RoomContext';
import image from "./4Z_2101.w017.n001.346B.p15.346.jpg"

export const Home = () => {
  const [meetCode, setMeetCode] = useState('');

  const handleMeetCodeChange = (e: { target: { value: React.SetStateAction<string>; }; }) => {
    setMeetCode(e.target.value);
  };

  const {ws, me} = useContext(RoomContext);

   
  const handleJoinClick = () => {
    ws.emit("join-room", { roomId: meetCode, peerId: me?.id });
  };

//   return (
//     <div className="App flex col items-center justify-center w-screen h-screen">
//       <input
//         type="text"
//         placeholder="Enter Meet Code"
//         value={meetCode}
//         onChange={handleMeetCodeChange}
//       />
//       <div className='bg-rose-400 hover:bg-rose-600 text-white font-bold py-2 px-8 rounded'>
//       <button onClick={handleJoinClick}>Join</button>
//       </div>
//     <CreateButton/>
// </div>
//   )
return (
  <div
    className="App flex items-center justify-center w-screen min-h-screen p-6"
    style={{ backgroundImage: `url(${image})`, backgroundRepeat: "no-repeat", backgroundSize: "contain" }}
  >
    <div className="w-full max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">Video Conferencing</h1>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/60 p-6 rounded-lg shadow-md">
        {/* New Meeting */}
        <div className="w-full md:w-1/2 flex items-start md:items-center gap-4">
          <CreateButton />
        </div>

        {/* Join */}
        <div className="w-full md:w-1/2 flex justify-end">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Enter Meet Code"
              value={meetCode}
              onChange={handleMeetCodeChange}
              className="border border-gray-300 p-2 rounded w-full sm:w-64"
            />
            <button
              onClick={handleJoinClick}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded w-full sm:w-auto"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
