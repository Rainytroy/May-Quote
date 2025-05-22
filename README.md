# May-Quote

May-Quote 是一个基于现代 Web 技术构建的 AI 聊天应用。它采用纯前端架构，支持多种大型语言模型 API，并提供独特的引用功能、高级提示工程（通过神谕核心）、插件系统和富文本导出能力。

## 特性

- 🚀 **神谕 (Shenyu) 核心**: 强大的提示工程模块，支持可视化创建和编辑复杂提示流 (Cards)，以及提示模板的保存、加载和管理。
- 🤖 **多模型支持**: 支持多种主流 AI 模型 API (例如 DeepSeek R1/V3, 豆包 1.5 Thinking Pro, 豆包 1.5 Pro 256k 等)，用户可自由配置和切换。
- 🔗 **引用功能**: 支持将对话内容方便地引用到新对话中，保持上下文连贯性。
- 🔌 **插件系统**: 内置“平行AI分析插件”，可通过并行调用第二个AI服务来分析用户输入并提供辅助建议。
- 📤 **富文本导出**: 支持将对话导出为 Markdown、PDF 等多种格式。
- 🧠 **对话记忆与离线存储**: 使用 IndexedDB 自动在本地安全存储所有对话历史和用户模板，随时可以恢复和继续。
- 📱 **响应式设计**: 适配桌面和移动端多种屏幕尺寸。
- 🌓 **深色模式**: 支持明暗主题切换。
- ⚙️ **API 自定义**: 用户可配置自己的 API 密钥和模型参数。

## 技术栈

- React 18
- TypeScript
- IndexedDB (用于本地数据存储和模板管理)
- CSS3 (用于现代UI设计, 支持CSS变量)
- PWA支持 (可安装为桌面应用)

## 开始使用

1.  克隆仓库:
    ```bash
    git clone https://github.com/yourusername/May-Quote.git # 请替换为实际仓库地址
    cd May-Quote
    ```

2.  安装依赖 (在 chat-app 目录内):
    ```bash
    cd chat-app
    npm install
    ```

3.  启动开发服务器 (在 chat-app 目录内):
    ```bash
    npm start
    ```
    应用将在 `http://localhost:25050` (或 `.env` 文件中配置的端口) 启动。

4.  构建生产版本 (在 chat-app 目录内):
    ```bash
    npm run build
    ```

## 配置API

应用需要配置 API 密钥才能与 AI 模型交互。你可以在应用的设置面板中配置各种支持的 API，例如：

1.  **火山引擎 API**: 需要 ARK API 密钥。
2.  **DeepSeek 官方 API**: 需要 DeepSeek API 密钥。
3.  (以及其他在应用中支持的模型 API)

## 文件结构

```
May/
└── chat-app/            # 主应用 (May-Quote) 目录
    ├── public/          # 静态资源 (图标, HTML模板等)
    ├── src/             # 应用程序源代码
    │   ├── components/  # React 组件 (核心包括 Shenyu/, Chat/, Plugin/)
    │   ├── contexts/    # React 上下文
    │   ├── hooks/       # 自定义 React Hooks
    │   ├── services/    # 核心业务逻辑和服务
    │   ├── utils/       # 工具函数和特定服务 (如 IndexedDB 交互)
    │   └── ...          # 其他源代码文件 (类型定义, 页面, 样式等)
    ├── package.json     # 项目依赖和脚本
    └── README.md        # chat-app 的详细 README
```
有关 `chat-app/src/` 内部结构的更详细信息，请参阅 `chat-app/README.md`。

## 贡献

欢迎提交问题和拉取请求。对于重大更改，请先打开一个问题，讨论您希望更改的内容。

## 版本历史

- **v0.9.999** - May整合神谕正式发布。
- **v0.9.99** - 同步各处版本信息 (Git标签和package.json)。
- **0.7.3** - (曾记录于package.json) 文档更新和内部优化。
- **0.7.1** - 优化UI交互，改进开发者信息显示。
- **0.7.0** - 初始版本，支持多种AI模型, 包含基本的对话和引用功能。

## 许可证

[GNU General Public License v3.0](https://choosealicense.com/licenses/gpl-3.0/)

本项目采用GNU GPL v3.0许可证。这意味着您可以自由地使用、复制、分发和修改本软件，
但任何修改和衍生作品也必须在相同的许可证下分发，并且保持开源。
