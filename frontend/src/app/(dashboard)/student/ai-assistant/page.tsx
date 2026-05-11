'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { aiApi, getApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import { Bot, Send, User, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Merhaba! Ben EduConnect\'in yapay zeka asistanıyım. CV hazırlama, staj başvurusu veya kariyer planlaması konularında sana yardımcı olabilirim. Ne sormak istersin?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const user = auth.getUserData();
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await aiApi.post('/api/v1/ai/chat', {
        message: text,
        user_id: user?.user_id,
      });
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: res.data.response ?? res.data.message ?? 'Yanıt alınamadı.' },
      ]);
    } catch (err) {
      toast.error(getApiError(err));
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '⚠️ Şu an yanıt veremiyorum, lütfen daha sonra tekrar dene.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Bot className="w-7 h-7 text-[#818cf8]" />
          YZ Asistanı
        </h1>
        <p className="text-[#64748b] text-sm mt-1">
          Gemini AI destekli kariyer asistanı — CV, staj ve kariyer sorularında yardımcı olur.
        </p>
      </div>

      {/* Chat window */}
      <Card className="flex-1 flex flex-col !p-0 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'assistant'
                  ? 'bg-gradient-to-br from-[#6366f1] to-[#8b5cf6]'
                  : 'bg-[#2a2a3e] border border-[rgba(99,102,241,0.3)]'
              }`}>
                {msg.role === 'assistant'
                  ? <Sparkles className="w-4 h-4 text-white" />
                  : <User className="w-4 h-4 text-[#94a3b8]" />}
              </div>
              {/* Bubble */}
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'assistant'
                  ? 'bg-[rgba(42,42,62,0.8)] text-[#e2e8f0] rounded-tl-sm border border-[rgba(99,102,241,0.2)]'
                  : 'bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white rounded-tr-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-[rgba(42,42,62,0.8)] border border-[rgba(99,102,241,0.2)] px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-2 h-2 rounded-full bg-[#6366f1] animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-[rgba(99,102,241,0.2)] p-4 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Bir şey sor... (örn: CV'me nasıl başlamalıyım?)"
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-[#2a2a3e] border border-[#3a3a52] rounded-xl text-white placeholder-[#64748b] text-sm focus:outline-none focus:border-[#818cf8] transition-colors disabled:opacity-60"
          />
          <Button onClick={handleSend} isLoading={isLoading} size="default">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
