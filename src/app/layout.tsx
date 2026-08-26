import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '智慧曲园 · 第二课堂综测计算器',
    template: '%s | 智慧曲园综测',
  },
  description:
    '基于《第二课堂成绩单》制度设计的综合测评计算工具：录入九大模块活动记录，自动按评分细则计分，生成个人成绩单。',
  keywords: ['第二课堂成绩单', '综合测评', '综测计算器', '智慧曲园', '第二课堂', '评分细则'],
  authors: [{ name: '智慧曲园综测计算器' }],
  generator: 'Coze Code',
  openGraph: {
    title: '智慧曲园 · 第二课堂综测计算器',
    description: '录入第二课堂活动，自动计算综合测评得分。',
    siteName: '智慧曲园综测计算器',
    locale: 'zh_CN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN">
      <body className={`antialiased`}>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap"
        />
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
