import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';
import { generateAIResponse } from '../services/geminiService';

interface AIChatProps {
  systemInstruction: string;
  contextData?: string;
  title?: string;
  placeholder?: string;
  modelId?: string;
  enableSearch?: boolean;
  welcomeMessage?: string;
}

export const AIChat: React.FC<AIChatProps> = ({ 
  systemInstruction, 
  contextData, 
  title = "AI Assistant", 
  placeholder = "Ask me anything...",
  modelId = "gemini-3-flash-preview",
  enableSearch = false,
  welcomeMessage = "How can I help you today?"
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    // Prepare full prompt with context if available
    const fullPrompt = contextData 
      ? `Context Data:\n${contextData}\n\nUser Query: ${inputValue}`
      : inputValue;

    try {
      const responseText = await generateAIResponse(
        fullPrompt, 
        systemInstruction, 
        modelId,
        enableSearch
      );

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, I'm having trouble connecting right now.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-yellow-400 p-2 rounded-lg text-black">
            <Sparkles size={18} />
          </div>
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
        {enableSearch && (
          <span className="text-xs font-bold text-yellow-400 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
            Search Enabled
          </span>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-10">
            <Bot size={48} className="mx-auto mb-3 opacity-20 text-slate-900" />
            {welcomeMessage && <p>{welcomeMessage}</p>}
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'} space-x-3`}>
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-slate-900 text-yellow-400' : 'bg-yellow-400 text-slate-900'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              <div className={`p-3 rounded-2xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none shadow-sm'
              }`}>
                {msg.role === 'model' ? (
                  <div className="prose prose-sm max-w-none prose-slate">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="flex max-w-[85%] space-x-3">
               <div className="flex-shrink-0 h-8 w-8 rounded-full bg-yellow-400 text-slate-900 flex items-center justify-center">
                 <Bot size={16} />
               </div>
               <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                 <Loader2 size={16} className="animate-spin text-slate-900" />
                 <span className="text-xs text-slate-500">Thinking...</span>
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            className="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="bg-yellow-400 hover:bg-yellow-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-900 p-3 rounded-lg transition-colors shadow-sm"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};