"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { 
  Sparkles, X, Send, Bot, 
  MapPin, RefreshCw, Cpu
} from "lucide-react";
import { api } from "@/lib/api";
import { ChatMessage } from "@/types";
import { useLocation } from "@/hooks/useLocation";
import { useAuth } from "@/hooks/useAuth";

export function FoodloopAIChat() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I am **Nouriq**, your FoodLoop Assistant.\n\nI can help you coordinate Event Food Rescue from weddings and banquets, structure surplus food listings, verify FSSAI hygiene standards, or connect with nearby shelters. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([
    "How does Event Rescue work?",
    "Register wedding function",
    "Food safety & untouched rules",
    "Find nearby food in Delhi",
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentLocation } = useLocation();
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const userText = textToSend || input.trim();
    if (!userText || isTyping) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      const response = await api.chatWithAI(
        newMessages,
        currentLocation?.name,
        user?.role
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.reply,
          tools_executed: response.tools_executed,
        },
      ]);

      if (response.suggested_actions && response.suggested_actions.length > 0) {
        setSuggestedActions(response.suggested_actions);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I encountered an issue connecting to the AI service. Please feel free to explore our **Discover** (`/discover`) or **Donate** (`/donate`) sections directly!",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Robot / Assistant Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-red-600 via-orange-500 to-amber-500 hover:scale-105 active:scale-95 text-white rounded-full shadow-floating hover:shadow-hover transition-all duration-300 group"
          aria-label="Nouriq Assistant"
          title="Nouriq Assistant"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-7 h-7 text-white" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-lime-400 rounded-full border-2 border-white animate-pulse" />
          </div>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 w-[92vw] sm:w-[440px] h-[600px] max-h-[85vh] bg-white rounded-3xl border border-freshBorder shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-sm">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight">Nouriq Assistant</h3>
                <p className="text-[10px] text-white/90 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                  <span>Online • Food Rescue & Safety Guide</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setMessages([
                    {
                      role: "assistant",
                      content: "Hello! I am **Nouriq**, your FoodLoop Assistant. How can I help coordinate surplus food rescue with you today?",
                    },
                  ]);
                }}
                title="Restart chat"
                className="p-1.5 hover:bg-white/20 rounded-xl transition-colors text-white/90"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-xl transition-colors text-white"
                aria-label="Close Assistant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Location / Context Sub-bar */}
          <div className="px-4 py-2 bg-freshBg border-b border-freshBorder flex items-center justify-between text-[11px] text-freshText-secondary">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="truncate">Near <strong>{currentLocation?.name || "Delhi NCR"}</strong></span>
            </div>
            <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-freshBorder capitalize font-semibold">
              {user?.role ? user.role.replace("_", " ") : "Guest"}
            </span>
          </div>

          {/* Messages Scroll Area with Professional Markdown Renderer */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-freshBg/30 text-xs">
            {messages.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 border border-white/40 flex items-center justify-center shrink-0 shadow-subtle text-white">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div
                    className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                      isUser
                        ? "bg-gradient-to-r from-red-600 to-amber-600 text-white font-medium rounded-tr-none shadow-sm"
                        : "bg-white text-freshText-primary border border-freshBorder rounded-tl-none shadow-subtle"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <div className="prose prose-xs max-w-none text-freshText-primary">
                        {m.tools_executed && m.tools_executed.length > 0 && (
                          <div className="mb-2 p-2 bg-gradient-to-r from-red-50 to-amber-50 rounded-xl border border-red-200/60 space-y-1">
                            {m.tools_executed.map((t, ti) => (
                              <div key={ti} className="flex items-center gap-1.5 text-[10px] font-mono text-red-700 font-bold">
                                <Cpu className="w-3 h-3 text-red-600 shrink-0" />
                                <span className="truncate">⚡ Checked: {t.tool_name.replace(/_/g, " ")}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <ReactMarkdown
                          components={{
                            strong: ({ children }) => (
                              <strong className="font-extrabold text-freshText-primary">
                                {children}
                              </strong>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-xs font-black uppercase tracking-wider text-red-600 mt-2 mb-1.5 pb-1 border-b border-gray-100">
                                {children}
                              </h3>
                            ),
                            h4: ({ children }) => (
                              <h4 className="text-xs font-bold text-freshText-primary mt-2 mb-1">
                                {children}
                              </h4>
                            ),
                            p: ({ children }) => (
                              <p className="leading-relaxed mb-1.5 last:mb-0">
                                {children}
                              </p>
                            ),
                            ul: ({ children }) => (
                              <ul className="space-y-1 my-1.5 pl-4 list-disc marker:text-red-500">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="space-y-1 my-1.5 pl-4 list-decimal marker:text-red-500 font-medium">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => <li className="pl-0.5">{children}</li>,
                            code: ({ children }) => (
                              <code className="px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 font-mono text-[10px] font-bold border border-red-100">
                                {children}
                              </code>
                            ),
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                className="text-red-600 hover:text-red-700 font-bold underline"
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-xl bg-white border border-freshBorder p-1 flex items-center justify-center shrink-0 shadow-subtle">
                  <img src="/images/logo.png" alt="AI" className="w-full h-full object-contain" />
                </div>
                <div className="p-3 bg-white border border-freshBorder rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-subtle">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Chips */}
          {suggestedActions.length > 0 && (
            <div className="px-3 py-2 bg-white border-t border-freshBorder flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {suggestedActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(action)}
                  className="px-2.5 py-1 bg-freshBg hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-freshBorder rounded-full text-[10px] font-semibold text-freshText-secondary whitespace-nowrap transition-all shrink-0"
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-freshBorder">
            <div className="flex items-center gap-2 bg-freshBg rounded-2xl p-1.5 border border-freshBorder focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question or find surplus food..."
                disabled={isTyping}
                className="flex-1 bg-transparent px-2.5 py-1 text-xs text-freshText-primary placeholder-gray-400 focus:outline-none"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isTyping}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  input.trim() && !isTyping
                    ? "bg-red-600 text-white hover:bg-red-700 shadow-sm"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                aria-label="Send Message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[9px] text-gray-400 text-center mt-1.5">
              FoodLoop Assistant • Save Food • Share Food • Feed Better
            </p>
          </div>
        </div>
      )}
    </>
  );
}
