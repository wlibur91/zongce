'use client';

const CHAT_URL = 'https://xingduo.qfnu.edu.cn/aiApp/XXCPHD304I';

export function AiAssistant() {
  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[28rem] flex-col rounded-lg border border-stone-200 bg-white/70 shadow-sm overflow-hidden">
      <iframe
        src={CHAT_URL}
        className="h-full w-full border-0"
        title="AI 综测助手"
        allow="clipboard-write"
      />
    </div>
  );
}
