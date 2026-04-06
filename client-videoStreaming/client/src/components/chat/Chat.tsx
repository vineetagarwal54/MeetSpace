import React, { useContext, useEffect, useRef } from "react";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { IMessage } from "../../types/chat";
import { RoomContext } from "../../RoomContext";

export const Chat: React.FC = () => {
  const { chat } = useContext(RoomContext);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages?.length]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {chat?.messages?.length === 0 && (
          <div className="text-gray-500 text-sm text-center mt-8">No messages yet</div>
        )}
        {chat?.messages?.map((message: IMessage, i: number) => (
          <ChatBubble key={i} message={message} />
        ))}
        <div ref={bottomRef} />
      </div>
      <ChatInput />
    </div>
  );
};
