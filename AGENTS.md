# 项目上下文

## 项目概述

**智慧曲园 · 第二课堂综测计算器**：基于《曲阜师范大学"智慧曲园"第二课堂成绩单制度》文件（见 `assets/第二课堂评分细则.docx`）实现的综合测评计算系统。学生按九大模块录入活动记录，系统按规则引擎自动计算综测得分并生成"第二课堂成绩单"。

核心业务规则（源自文件）：
- 九大模块：社会实践（每假期一次、按档计分）、志愿服务（按时长计分）、各级表彰（不含奖学金、同事项不累计、团队减半）、科研创作、文体活动、学术竞赛、等级证书、宣传作品（同文章不累计）、其他加分项
- 只有 `approved` 状态的记录参与计分；每模块有封顶分；总分满分 87（35/55/75 三档等级线）
- 审核流转：pending → approved / rejected（模拟"谁主办、谁审核"）
- 注：原文件未含具体分值表，规则引擎中的分值为按文件描述构建的合理默认值，集中在 `src/lib/rules.ts` 可查可改

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4

## 目录结构

```
├── assets/                 # 需求源文件（评分细则 docx）
├── data/                   # 运行时数据（records.json，gitignore，损坏/缺失时自动重置为种子数据）
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本（清端口后 tsx watch src/server.ts）
│   ├── prepare.sh          # 预处理脚本
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局（page.tsx 四 Tab：成绩单/录入/细则/AI助手）
│   ├── app/api/            # REST API
│   │   ├── records/        # GET 列表 / POST 新增；[id]/ PATCH 审核 / DELETE 删除
│   │   ├── score/          # GET 计算综测得分（含各模块明细、计入/剔除记录）
│   │   └── rules/          # GET 规则元数据（供前端动态渲染表单）
│   │   └── chat/           # AI 问答接入点：coze-coding-dev-sdk 流式对话，模型在文件顶部 MODEL 常量改
│   ├── components/ui/      # Shadcn UI 组件库
│   ├── components/zongce/  # 业务组件（transcript-view / record-form / records-table / rules-view / ai-assistant）
│   ├── lib/
│   │   ├── rules.ts        # ★ 规则引擎核心：九模块分值表、封顶、去重、团队减半配置
│   │   ├── scoring.ts      # 计分逻辑：只算 approved、按分值表取分、封顶、去重、减半
│   │   ├── store.ts        # 文件存储（data/records.json）：串行化写锁 + tmp/rename 原子写 + 损坏自愈
│   │   └── types.ts        # ActivityRecord / ScoreResult 等类型
│   └── server.ts           # 自定义服务端入口（tsx watch）
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
├── DESIGN.md               # 设计风格文档（档案纸/印章红主题）
└── tsconfig.json           # TypeScript 配置
```

## 关键入口 / 核心模块

- 改分值/档位/封顶：`src/lib/rules.ts`（MODULE_MAP，纯配置）
- 改计分逻辑：`src/lib/scoring.ts`
- API 均为 `force-dynamic`，数据持久化在 `data/records.json`（首次访问自动写入 5 条种子演示数据）

## 运行与预览

- 预览：`.coze [dev]` → `scripts/build.sh` + `scripts/dev.sh`，端口读 `.preview`（5000）
- 本地开发：`pnpm dev`（dev.sh 自带端口清理，勿手动起多个 dev 实例）
- 验收：test_run（lint + ts-check + 探活 + 全接口 curl 冒烟）

## 常见问题和预防

- **勿并行起多个 dev server**：两个 `tsx watch` 实例交叉写 `data/records.json` 会导致数据损坏/写丢失（已踩坑）。store 已加串行写锁 + 原子写 + 损坏自愈，但仍应保持单实例。
- `data/` 已加入 `.gitignore`，勿提交运行时数据。
- 前端调用后端一律相对路径 `/api/...`。

## 用户偏好与长期约束

- **项目语言默认中文**：UI 文案、API 错误信息、metadata、`<html lang="zh-CN">` 均保持简体中文，新增功能时不得引入英文文案。

- 项目文件（如 app 目录、pages 目录、components 等）默认初始化到 `src/` 目录下。

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码；优先复用当前作用域已声明的变量、函数、类型和导入，禁止引用未声明标识符或拼错变量名。
- 禁止隐式 `any` 和 `as any`；函数参数、返回值、解构项、事件对象、`catch` 错误在使用前应有明确类型或先完成类型收窄，并清理未使用的变量和导入。

### next.config 配置规范

- 配置的路径不要写死绝对路径，必须使用 path.resolve(__dirname, ...)、import.meta.dirname 或 process.cwd() 动态拼接。

### Hydration 问题防范

1. 严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。**必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染**；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。
2. **禁止使用 head 标签**，优先使用 metadata，详见文档：https://nextjs.org/docs/app/api-reference/functions/generate-metadata
   1. 三方 CSS、字体等资源可在 `globals.css` 中顶部通过 `@import` 引入或使用 next/font
   2. preload, preconnect, dns-prefetch 通过 ReactDOM 的 preload、preconnect、dns-prefetch 方法引入
   3. json-ld 可阅读 https://nextjs.org/docs/app/guides/json-ld

## UI 设计与组件规范 (UI & Styling Standards)

- 模板默认预装核心组件库 `shadcn/ui`，位于`src/components/ui/`目录下
- Next.js 项目**必须默认**采用 shadcn/ui 组件、风格和规范，**除非用户指定用其他的组件和规范。**
