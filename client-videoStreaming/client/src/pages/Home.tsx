import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreateButton } from "../components/CreateButton";

export const Home = () => {
  const [meetCode, setMeetCode] = useState("");
  const navigate = useNavigate();

  const handleJoinClick = () => {
    if (!meetCode.trim()) return;
    navigate(`/room/${meetCode.trim()}`);
  };

  return (
    <div className="flex items-center justify-center w-screen min-h-screen bg-gray-900">
      <div className="w-full max-w-lg px-6">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">MeetSpace</h1>
          <p className="text-gray-400">Video conferencing for everyone</p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-8 shadow-xl space-y-6">
          {/* New Meeting */}
          <div>
            <h2 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
              Start a new meeting
            </h2>
            <CreateButton />
          </div>

          <div className="border-t border-gray-700" />

          {/* Join existing */}
          <div>
            <h2 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
              Join a meeting
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter room code"
                value={meetCode}
                onChange={(e) => setMeetCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinClick()}
                className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
              />
              <button
                onClick={handleJoinClick}
                disabled={!meetCode.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
