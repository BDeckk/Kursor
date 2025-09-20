"use client";
import { useState } from "react";

// Temporary Page for chatbot
export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
  if (!input.trim()) return;

  const userMessage = { role: "user", content: input };

  // Immediately add user's message
  setMessages(prev => [...prev, userMessage]);
  setInput(""); 
  setLoading(true);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ question: input }),
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();
    const botMessage = { role: "bot", content: data.answer };

    // Append bot reply
    setMessages(prev => [...prev, botMessage]);
  } catch (err) {
    setMessages(prev => [...prev, { role: "bot", content: "⚠️ Error fetching response." }]);
  } finally {
    setLoading(false);
  }
}


  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="border p-2 rounded h-96 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-blue-600" : "text-green-600"}>
            <b>{m.role}:</b> {m.content}
          </div>
        ))}
        {loading && <div className="text-gray-500">Bot is typing...</div>}
      </div>

      <div className="flex mt-2">
        <input
          className="flex-1 border p-2 rounded"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button
          className="ml-2 bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={sendMessage}
          disabled={!input.trim() || loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}
