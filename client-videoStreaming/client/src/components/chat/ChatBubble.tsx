import React, { useContext } from "react";
import { IMessage } from "../../types/chat";
import { RoomContext } from "../../RoomContext";

export const ChatBubble: React.FC<{ message: IMessage }> = ({ message }) => {
  const { me, peers } = useContext(RoomContext);
  const isSelf = message.author === me?.id;
  const author = message.author && peers[message.author];
  const username = isSelf ? "You" : author?.userName || "Anonymous";

  return (
    <div className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] ${isSelf ? "text-right" : "text-left"}`}>
        <div className="text-[10px] text-gray-400 mb-0.5 px-1">{username}</div>
        <div
          className={`inline-block py-1.5 px-3 rounded-lg text-sm ${
            isSelf
              ? "bg-indigo-600 text-white rounded-br-sm"
              : "bg-gray-700 text-gray-100 rounded-bl-sm"
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
};
