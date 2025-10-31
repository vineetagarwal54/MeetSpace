import React, { useContext } from "react";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { IMessage } from "../../types/chat";
import { RoomContext } from "../../RoomContext";

export const Chat: React.FC = () => {
  const { chat } = useContext(RoomContext);

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        {chat?.messages?.map((message: IMessage) => (
          <ChatBubble message={message} />
        ))}
      </div>
      <ChatInput />
    </div>
  );
};
