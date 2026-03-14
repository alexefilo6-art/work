import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ChatMessage } from '../types';
import Markdown from 'react-markdown';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'chatHistory'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      setMessages(msgs);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !auth.currentUser) return;

    const userMsg = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Save user message to Firestore
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'chatHistory'), {
        role: 'user',
        content: userMsg,
        timestamp: serverTimestamp()
      });

      // Call Gemini
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: "You are a helpful assistant integrated into a collaborative email and note editor. Help the user write, refine, and organize their thoughts."
        }
      });

      const aiText = response.text || "I'm sorry, I couldn't generate a response.";

      // Save AI response to Firestore
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'chatHistory'), {
        role: 'model',
        content: aiText,
        timestamp: serverTimestamp()
      });

    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-80 border-l border-stone-200 bg-stone-50 flex flex-col h-full">
      <div className="p-4 border-b border-stone-200 bg-white flex items-center gap-2">
        <Sparkles size={18} className="text-emerald-600" />
        <h2 className="font-medium text-stone-800">AI Assistant</h2>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`flex items-center gap-1 mb-1 text-[10px] uppercase tracking-wider font-bold text-stone-400`}>
              {msg.role === 'user' ? (
                <>You <User size={10} /></>
              ) : (
                <><Bot size={10} /> Gemini</>
              )}
            </div>
            <div
              className={`max-w-[90%] p-3 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : 'bg-white border border-stone-200 text-stone-800 rounded-tl-none shadow-sm'
              }`}
            >
              <div className="markdown-body prose prose-sm max-w-none">
                <Markdown>{msg.content}</Markdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-stone-400 text-xs animate-pulse">
            <Loader2 size={14} className="animate-spin" />
            Gemini is thinking...
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white border-t border-stone-200">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI for help..."
            className="w-full pl-4 pr-10 py-2 bg-stone-100 border-none rounded-full text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
