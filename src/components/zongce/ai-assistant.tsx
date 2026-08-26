'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = [
  '我离下一档等级线还差多少分？',
  '志愿服务是怎么计分的？',
  '哪些记录没有计入总分？',
  '团队获奖怎么算分？',
];

export function AiAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || streaming) return;

    const history = [...messages, { role: 'user' as const, content: q }];
    setMessages(history);
    setInput('');
    setStreaming(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `请求失败（${res.status}）`);
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        if (text) {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === 'assistant') {
              next[next.length - 1] = { ...last, content: last.content + text };
            }
            return next;
          });
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : '网络异常，请稍后重试';
      setMessages((prev) => [...prev, { role: 'assistant', content: `抱歉，出错了：${msg}` }]);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[28rem] flex-col rounded-lg border border-stone-200 bg-white/70 shadow-sm">
      <div className="border-b border-stone-200/80 px-5 py-3">
        <h3 className="font-serif text-base font-semibold text-stone-900">AI 综测助手</h3>
        <p className="text-xs text-stone-500">
          熟悉九大模块计分规则，并结合你的当前成绩快照回答提问
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full border border-stone-300 bg-stone-50 px-4 py-2 font-serif text-sm text-stone-600">
              你好，我是综测 AI 助手，可以问我任何关于第二课堂计分的问题
            </div>
            <div className="flex max-w-md flex-wrap justify-center gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => ask(q)}
                  className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-600 transition-colors hover:border-stone-500 hover:text-stone-900"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-stone-800 text-stone-50'
                    : 'border border-stone-200 bg-stone-50 text-stone-800'
                }`}
              >
                {m.content || (streaming && i === messages.length - 1 ? '正在思考…' : '')}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-stone-200/80 p-4">
        <div className="flex items-end gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                ask(input);
              }
            }}
            placeholder="输入问题，回车发送（Shift+回车换行）"
            rows={2}
            disabled={streaming}
            className="resize-none border-stone-300 bg-white text-sm"
          />
          <Button
            onClick={() => ask(input)}
            disabled={streaming || !input.trim()}
            className="bg-stone-800 hover:bg-stone-700"
          >
            {streaming ? '回答中…' : '发送'}
          </Button>
        </div>
      </div>
    </div>
  );
}
