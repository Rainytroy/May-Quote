# SN43Demo 组件

此目录包含Shenyu SN43问卷式交互功能在May中的React实现版本。

## 目录结构

```
SN43Demo/
├── README.md               # 本文档
├── SN43DemoView.tsx        # 主视图组件
├── ConfigPanel/            # 配置面板相关组件
├── UserInterface/          # 用户界面相关组件
└── types.ts                # 类型定义文件
```

## 访问方式

SN43Demo页面可以通过URL参数访问：

```
[应用URL]?demo=shenyu
```

例如: `http://localhost:25050?demo=shenyu`

## 组件说明

SN43Demo是Shenyu SN43功能的React实现版本，提供问卷式交互功能，帮助用户更有效地使用AI服务。

### 主要功能

- 通过问卷式交互方式创建AI Agent
- 支持多个prompt blocks的配置和管理
- 提供用户友好的配置界面
- 支持历史记录管理

### 开发状态

此组件当前处于开发阶段，作为独立Demo存在，将在功能验证完成后集成到May主应用中。
