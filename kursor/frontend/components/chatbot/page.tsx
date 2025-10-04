"use client";
import { useState } from "react";

type Message = {
  role: "user" | "bot";
  content: string;
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: input,
          history: messages, // send context too
        }),
      });

      const data = await res.json();
      const botMessage: Message = { role: "bot", content: data.answer };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: "bot", content: "⚠️ Error fetching response." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">
        AI Career Chatbot
      </h1>

      {/* Chat Window */}
      <div className="flex-1 overflow-y-auto border rounded-lg p-4 bg-white shadow">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-2 flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-3 py-2 rounded-lg max-w-xs ${
                m.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-gray-500">Bot is typing...</div>}
      </div>

      {/* Input */}
      <div className="flex mt-2">
        <input
          className="flex-1 border p-2 rounded-lg"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button
          className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          onClick={sendMessage}
          disabled={!input.trim() || loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}
