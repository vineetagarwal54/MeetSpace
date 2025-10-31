import React, { useContext } from "react";
import { IMessage } from "../../types/chat";
import { RoomContext } from "../../RoomContext";
import classNames from "classnames";

export const ChatBubble: React.FC<{ message: IMessage }> = ({ message }) => {
  const { me, peers } = useContext(RoomContext);
  const author = message.author && peers[message.author];
  const username = author?.userName || "Anonumous"
  const isSelf = message.author === me?.id;
  return (
    <div
      className={classNames("m-2 flex", {
        "pl-10 justify-end": isSelf,
        "pr-10 justify-start": !isSelf,
      })}
    >
      <div className="flex flex-col">
        <div
          className={classNames("inline-block py-2 px-4 rounded", {
            "bg-red-200": isSelf,
            "bg-red-300": !isSelf,
          })}
        >
          {message.content}
        </div>
        <div className={classNames("text", {
          "text-right": isSelf,
          "text-left": !isSelf
        })}>
          {isSelf ? "You" : username}
        </div>
      </div>
    </div>
  );
};
