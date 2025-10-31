import React from 'react';

interface RoomTopBarProps {
  roomId: string;
  onToggleParticipants: () => void;
  participantCount: number;
}

export const RoomTopBar: React.FC<RoomTopBarProps> = ({ roomId, onToggleParticipants, participantCount }) => {
  const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10 px-4 py-2 flex items-center justify-between">
      <div className="text-gray-700 text-sm flex items-center space-x-4">
        <span className="font-medium">{formattedTime}</span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-500">Room: {roomId}</span>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleParticipants}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-full hover:bg-gray-100"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="text-sm text-gray-600">{participantCount}</span>
        </button>
      </div>
    </div>
  );
};