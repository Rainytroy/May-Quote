# May-Quote Chat 应用

May-Quote 是一个纯前端的 AI 聊天应用，构建于 React 和 TypeScript 之上。它支持多种大型语言模型，提供高级的提示工程能力、上下文记忆、多格式导出以及独特的引用和插件功能。

## 功能特性

- 🔒 **纯前端实现**：无需后端服务器，所有对话数据和用户配置均安全存储在客户端（使用 IndexedDB）。
- 🚀 **神谕 (Shenyu) 核心**：强大的提示工程模块，支持：
    - 可视化创建和编辑复杂提示流 (Cards)。
    - 提示模板的保存、加载和管理。
    - 结构化输出处理。
- 🧠 **上下文记忆**：保持对话连贯性，AI能理解之前的对话内容。
- 🔗 **引用功能**: 支持将历史对话内容方便地引用到当前输入中。
- 🤖 **多模型支持**: 支持多种主流大型语言模型 API（例如 DeepSeek、豆包系列等），用户可自由切换。
- ⚙️ **API 自定义**：用户可配置自己的 API 密钥和模型参数。
- 🔌 **插件系统**: 内置“平行AI分析插件”，可通过并行调用第二个AI服务来分析用户输入并提供辅助建议。
- 📋 **内置剪贴板**：保存和管理重要内容片段。
- 📤 **多格式导出**：支持将对话导出为 Markdown、PDF 和 Word 等格式。
- 🌓 **深色模式**：支持明暗主题切换。
- 📱 **响应式设计**：适配各种设备尺寸。
- 💾 **离线存储**: 使用 IndexedDB 在本地安全存储所有对话数据和模板。

## 开发环境设置

### 前提条件

- Node.js >= 14.0.0
- npm >= 7.0.0

### 安装步骤

1.  克隆仓库 (如果尚未操作):
    ```bash
    git clone https://github.com/yourusername/May-Quote.git # 请替换为实际仓库地址
    cd May-Quote/chat-app
    ```

2.  安装依赖:
    ```bash
    npm install
    ```

3.  启动开发服务器:
    开发服务器将在 http://localhost:25050 启动（端口可在 `.env` 文件中配置）。
    ```bash
    npm start
    ```

## 项目结构 (src/)

```
src/
├── App.tsx            # 应用主入口组件
├── Routes.tsx         # 应用路由配置
│
├── components/        # UI组件
│   ├── Shenyu/        # 核心的神谕 (Shenyu) 组件 (UI, 核心逻辑, 类型定义)
│   ├── Chat/          # 通用聊天界面组件 (消息列表, 输入框等)
│   ├── Plugin/        # 插件系统 (如平行AI分析插件)
│   ├── Export/        # 导出功能相关组件
│   ├── Settings/      # 应用设置相关组件
│   ├── ModeSelector/  # 聊天模式选择组件
│   └── UI/            # 通用基础UI组件 (对话框, 菜单等)
│
├── contexts/          # React Context (如 ModeContext, ReferenceContext)
│
├── hooks/             # 自定义 React Hooks (如 useChat, useConversations)
│
├── pages/             # 页面级组件 (如 TemplateManagerPage)
│
├── services/          # 核心业务逻辑和服务
│   ├── ShenyuExecutionService.ts # 神谕执行服务
│   └── ai-service.ts    # AI模型API调用服务
│
├── styles/            # 全局样式和主题
│
├── types/             # 全局 TypeScript 类型定义
│
└── utils/             # 工具函数和特定服务
    ├── templateDbService.ts # 基于 IndexedDB 的模板存储服务
    ├── db.ts          # IndexedDB 基础设置
    └── ...            # 其他工具函数 (日期, 导出等)
```

## 许可证

[GNU General Public License v3.0](https://choosealicense.com/licenses/gpl-3.0/)

本项目采用GNU GPL v3.0许可证。这意味着您可以自由地使用、复制、分发和修改本软件，
但任何修改和衍生作品也必须在相同的许可证下分发，并且保持开源。
