"use client";
import { useState, useEffect } from "react";

type Message = {
  role: "user" | "bot";
  content: string;
};

type ChatbotProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Chatbot({ isOpen, onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content: "Hello! I'm your AI career advisor. How can I help you explore your future today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: input,
          history: messages,
        }),
      });

      const data = await res.json();
      const botMessage: Message = { role: "bot", content: data.answer };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "⚠️ Error fetching response." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
      {/* Chatbox Container */}
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col relative overflow-hidden border-7 border-yellow-400 transition-all duration-300 ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFDE59] flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-outfit font-bold text-gray-800">Career Chat</h2>
              <p className="text-xs text-gray-500">AI-powered guidance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`mb-4 flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "bot" && (
                <div className="w-8 h-8 rounded-full bg-[#FFDE59] flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              )}
              <div
                className={`px-4 py-3 rounded-2xl max-w-md font-outfit ${
                  m.role === "user"
                    ? "bg-[#FFDE59] text-gray-800 shadow-md"
                    : "bg-white text-gray-800 shadow-sm border border-gray-200"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start mb-4">
              <div className="w-8 h-8 rounded-full bg-[#FFDE59] flex items-center justify-center mr-2 flex-shrink-0">
                <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 bg-white border-t border-gray-200">
          <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-2 border-2 border-gray-200 focus-within:border-[#FFDE59] transition-colors">
            <input
              className="flex-1 bg-transparent outline-none font-outfit text-gray-800 placeholder-gray-400"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask or search anything..."
              disabled={loading}
            />
            <button
              className="w-10 h-10 rounded-full bg-[#FFDE59] hover:bg-yellow-400 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
            >
              <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2 font-outfit">
            Press Enter to send • Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}