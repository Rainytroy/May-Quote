# May-Quote

May-Quote是一个基于现代Web技术构建的AI聊天应用，支持多种大型语言模型API，并提供独特的引用和导出功能。

## 特性

- **多模型支持**: 支持六种不同的AI模型:
  - DeepSeek R1/V3（火山引擎版）
  - DeepSeek R1/V3（官方API版）
  - 豆包 1.5 Thinking Pro
  - 豆包 1.5 Pro 256k

- **引用功能**: 支持将对话内容引用到新对话中，保持上下文连贯性

- **富文本导出**: 支持将对话导出为Markdown、PDF等多种格式

- **对话记忆**: 自动保存所有对话历史，随时可以恢复和继续

- **响应式设计**: 适配桌面和移动端多种屏幕尺寸

- **离线存储**: 使用IndexedDB在本地安全存储所有对话数据

- **模型适配系统**: 智能处理不同模型的特殊要求和限制

## 技术栈

- React 18
- TypeScript
- IndexedDB (用于本地数据存储)
- CSS3 (用于现代UI设计)
- PWA支持 (可安装为桌面应用)

## 开始使用

1. 克隆仓库:
   ```
   git clone https://github.com/yourusername/May-Quote.git
   cd May-Quote
   ```

2. 安装依赖:
   ```
   cd chat-app
   npm install
   ```

3. 启动开发服务器:
   ```
   npm start
   ```

4. 构建生产版本:
   ```
   npm run build
   ```

## 配置API

应用需要配置API密钥才能正常工作。你可以在设置面板中配置以下API:

1. **火山引擎API**: 需要ARK API密钥
2. **DeepSeek官方API**: 需要DeepSeek API密钥

## 文件结构

```
May/
└── chat-app/            # 主应用目录
    ├── public/          # 静态资源
    ├── src/             # 源代码
    │   ├── components/  # React组件
    │   ├── contexts/    # React上下文
    │   ├── hooks/       # 自定义钩子
    │   ├── services/    # 服务层
    │   ├── styles/      # 样式文件
    │   ├── utils/       # 实用工具
    │   └── types/       # TypeScript类型定义
    └── package.json     # 项目依赖
```

## 贡献

欢迎提交问题和拉取请求。对于重大更改，请先打开一个问题，讨论您希望更改的内容。

## 版本历史

- **0.7.1** - 当前版本，优化UI交互，改进开发者信息显示
- **0.7.0** - 初始版本，支持六种AI模型, 包含基本的对话和引用功能

## 许可证

[GNU General Public License v3.0](https://choosealicense.com/licenses/gpl-3.0/)

本项目采用GNU GPL v3.0许可证。这意味着您可以自由地使用、复制、分发和修改本软件，
但任何修改和衍生作品也必须在相同的许可证下分发，并且保持开源。
