'use client';

const CHAT_URL = 'https://xingduo.qfnu.edu.cn/aiApp/XXCPHD304I';

export function AiAssistant() {
  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[28rem] flex-col items-center justify-center rounded-lg border border-stone-200 bg-white/70 shadow-sm overflow-hidden gap-6 p-8 text-center">
      <div className="text-6xl">🤖</div>
      <h2 className="text-xl font-semibold text-stone-700">综测计算助手</h2>
      <p className="text-stone-500 max-w-md">
        点击下方按钮，即可在新窗口中打开杏铎AI综测计算助手，获取智能问答和综测计算帮助。
      </p>
      <a
        href={CHAT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-stone-800 px-6 py-3 text-white font-medium hover:bg-stone-700 transition-colors"
      >
        打开 AI 助手
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
    </div>
  );
}
