import { useContext, useState } from "react";
import { RoomContext } from "../../RoomContext";

export const ChatInput: React.FC = () => {
  const [message, setMessage] = useState("");
  const { sendMessage } = useContext(RoomContext);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessage(message.trim());
    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="p-2 border-t border-gray-700">
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 bg-gray-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-400"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </form>
  );
};
