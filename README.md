# 智慧备课助手

一款基于 AI 的教学资源生成工具，帮助教师快速生成多种类型的教学材料。

## 功能特点

- **一键生成多种教学资源**：教案、导学案、PPT大纲、课堂游戏、教学逐字稿
- **智能理解教材**：支持上传教材图片或粘贴文字内容
- **个性化定制**：根据学生特点和教学风格调整生成内容
- **多格式导出**：支持 Markdown、HTML 下载，可用 Word 编辑
- **流式生成体验**：实时查看生成进度，无需等待

## 快速开始

### 环境要求

- Node.js 18+
- pnpm

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

创建 `.env.local` 文件：

```env
# 豆包 API（必须）
COZE_API_BASE=https://ark.cn-beijing.volces.com/api/v3
COZE_API_KEY=your_api_key

# Supabase（可选，用于数据持久化）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# S3 对象存储（可选，用于文件上传）
S3_ENDPOINT=your_s3_endpoint
S3_REGION=your_region
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your_bucket_name
```

### 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:5000

## 使用说明

### 基本使用

1. **选择输出类型**：勾选需要生成的教学资源类型（教案、导学案、PPT大纲等）
2. **填写课程信息**：输入学科、年级、课程主题
3. **添加教材内容**：粘贴文字或上传教材图片
4. **生成资源**：点击生成按钮，等待 AI 完成
5. **导出使用**：选择 Markdown 或 HTML 格式下载

### 高级功能

- **学生类型预设**：选择基础班、提高班、竞赛班或艺术班，AI 会调整内容难度和风格
- **教学风格预设**：选择严谨专业型、幽默风趣型、温和引导型等
- **课程设计类型**：选择一题到底、情境体验式、项目式学习等教学设计模式

## 技术栈

- **框架**：Next.js 16 (App Router)
- **语言**：TypeScript 5
- **UI 组件**：shadcn/ui + Radix UI
- **样式**：Tailwind CSS 4
- **AI 集成**：豆包大模型

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── generate-lesson/   # 教学资源生成 API
│   │   ├── upload/            # 文件上传 API
│   │   └── understand/       # 图片理解 API
│   ├── page.tsx              # 主页面
│   └── layout.tsx            # 布局组件
├── components/               # UI 组件
├── lib/                      # 工具函数
└── styles/                   # 全局样式
```

## License

MIT
