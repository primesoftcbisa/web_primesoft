import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useAuth } from '@/src/contexts/AuthContext';
import Breadcrumb from '@/src/components/Breadcrumb';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Trash2,
  Sparkles
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import Markdown from 'react-markdown';

const IAChat: React.FC = () => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const model = "gemini-3-flash-preview";
      
      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction: `Você é o assistente virtual da Primesoft CBISA, um sistema de gestão agrícola. 
          Seu objetivo é ajudar RTVs e Administradores com dúvidas sobre o sistema, produtos, clientes e propostas.
          O usuário atual é ${profile?.nombre} com perfil ${profile?.perfil_acceso}.
          Seja profissional, prestativo e fale em português ou espanhol conforme a preferência do usuário.`,
        },
      });

      const response = await chat.sendMessage({ message: userMessage });
      const aiContent = response.text || "Desculpe, não consegui processar sua solicitação.";
      
      setMessages(prev => [...prev, { role: 'model', content: aiContent }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Erro ao conectar com a IA: " + error.message }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm('Deseja limpar o histórico do chat?')) {
      setMessages([]);
    }
  };

  return (
    <>
      <Breadcrumb pageName="IA Chat" />

      <div className="flex h-[calc(100vh-240px)] flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-strokedark">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-black dark:text-white">Assistente Primesoft</h3>
              <p className="text-xs text-meta-3">Online</p>
            </div>
          </div>
          <button 
            onClick={clearChat}
            className="text-bodydark2 hover:text-meta-1"
            title="Limpar Chat"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Bot size={48} className="mb-4 text-primary opacity-20" />
              <h4 className="mb-2 text-xl font-semibold text-black dark:text-white">Como posso ajudar hoje?</h4>
              <p className="max-w-md text-sm text-bodydark2">
                Pergunte sobre produtos, clientes, propostas ou como utilizar as funcionalidades do sistema.
              </p>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={cn(
                "flex gap-4",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                msg.role === 'user' ? "bg-primary text-white" : "bg-gray-2 text-primary dark:bg-meta-4"
              )}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                msg.role === 'user' 
                  ? "bg-primary text-white" 
                  : "bg-gray-2 text-black dark:bg-meta-4 dark:text-white"
              )}>
                <div className="markdown-body">
                  <Markdown>{msg.content}</Markdown>
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-2 text-primary dark:bg-meta-4">
                <Bot size={20} />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-gray-2 px-4 py-3 dark:bg-meta-4">
                <Loader2 size={16} className="animate-spin text-primary" />
                <span className="text-xs text-bodydark2">Pensando...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-stroke p-6 dark:border-strokedark">
          <form onSubmit={handleSend} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="w-full rounded-full border border-stroke bg-transparent py-3 pl-6 pr-14 outline-none focus:border-primary dark:border-strokedark"
            />
            <button 
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-primary p-2 text-white hover:bg-opacity-90 disabled:bg-opacity-50"
            >
              <Send size={20} />
            </button>
          </form>
          <p className="mt-2 text-center text-[10px] text-bodydark2">
            A IA pode cometer erros. Verifique informações importantes.
          </p>
        </div>
      </div>
    </>
  );
};

export default IAChat;
