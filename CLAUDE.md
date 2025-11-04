# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个浏览器扩展项目，用于快速切换和管理最近访问的浏览器标签页。支持 Chrome 和 Firefox 浏览器，提供三种标签视图：已关闭（Undo）、已打开（Opened）和今日访问（Today）。

## 技术栈

- **构建工具**: WXT (Web Extension Tools) - 用于开发浏览器扩展的框架
- **语言**: TypeScript
- **样式**: TailwindCSS + PostCSS
- **测试**: Vitest
- **包管理器**: pnpm

## 常用命令

### 开发
```bash
# Chrome 开发模式
pnpm dev

# Firefox 开发模式
pnpm dev:firefox
```

### 构建
```bash
# 构建 Chrome 版本
pnpm build

# 构建 Firefox 版本
pnpm build:firefox

# 打包 Chrome 版本（生成 .zip）
pnpm zip

# 打包 Firefox 版本（生成 .zip）
pnpm zip:firefox
```

### 测试和类型检查
```bash
# 运行测试
pnpm test

# 类型检查（不生成文件）
pnpm compile
```

### 发布
```bash
# 版本升级（交互式）
pnpm release
```

## 项目架构

### 核心入口点 (entrypoints/)

- **background.ts**: Service Worker，负责监听标签页和窗口事件
  - 缓存所有打开的标签页信息
  - 监听标签页创建、更新、关闭事件
  - 监听窗口关闭事件
  - 自动保存关闭的标签页到 storage

- **popup/**: 扩展弹窗界面
  - `index.html`: 弹窗的 HTML 结构
  - `main.ts`: 弹窗的主逻辑，处理标签页切换、搜索等交互
  - `style.css`: 弹窗样式

- **content.ts**: Content Script（当前较简单）

### 工具函数 (utils/)

- **types.ts**: TypeScript 类型定义
  - `TabType`: 标签页类型（'closed' | 'opened' | 'today'）
  - `TabItemsHandlers`: 定义每种标签页类型的操作接口

- **const.ts**: 常量配置
  - `MAX_TABS_COUNT`: 最大存储标签数（360）
  - `MAX_HISTORY_COUNT`: 最大历史记录数（500）
  - `TABS_MAP`: 三种标签类型的配置

- **closed.ts**: 已关闭标签页处理逻辑
  - 实现 `TabItemsHandlers<'closed'>` 接口
  - `saveClosedTab()`: 保存关闭的标签页到 storage
  - 支持点击恢复、删除操作

- **opened.ts**: 已打开标签页处理逻辑
  - 实现 `TabItemsHandlers<'opened'>` 接口
  - `switchTab()`: 切换到指定标签页和窗口

- **today.ts**: 今日访问历史处理逻辑
  - 实现 `TabItemsHandlers<'today'>` 接口
  - 查询今天（0:00 开始）的浏览历史

- **tabs.ts**: 标签页渲染和管理的核心逻辑
  - `useTabsRender()`: 创建标签页渲染函数，处理搜索、点击、删除

- **theme.ts**: 主题切换功能

- **index.ts**: 通用工具函数
  - URL 处理（`isExtensionUrl`, `isLocalUrl`, `getDomain`）
  - 数据转换（`transformTabItem`）
  - 去重（`uniqueItem`）

- **api/**: 浏览器 API 封装
  - `tabs.ts`: chrome.tabs API 封装
  - `windows.ts`: chrome.windows API 封装
  - `storage.ts`: chrome.storage API 封装
  - `history.ts`: chrome.history API 封装

### 组件 (components/)

- **TabGroup.ts**: 标签分组组件（Undo/Opened/Today 切换）
- **TabItems.ts**: 标签列表项渲染组件

## 代码规范

### Prettier 配置
- 不使用分号
- 单引号
- 2 空格缩进
- 每行最大 100 字符
- 尾随逗号（ES5 风格）

### 命名约定
- 变量和函数：驼峰命名法（camelCase）
- 类型和接口：帕斯卡命名法（PascalCase）
- 常量：大写下划线（UPPER_SNAKE_CASE）

## 架构模式

### Handler 模式
项目使用 Handler 模式统一管理三种标签类型的操作：

```typescript
interface TabItemsHandlers<T> {
  loadTabs(): Promise<TabItem<T>[]>
  clickItem(item: TabItem<T>): Promise<void>
  removeItem(item: TabItem<T>): Promise<void>
}
```

每种标签类型（closed/opened/today）都有对应的 handler 实现。

### 数据流
1. **Background** 监听事件 → 更新缓存 → 保存到 storage
2. **Popup** 加载数据 → 渲染列表 → 处理用户交互 → 调用 handler
3. **Handler** 执行操作 → 更新 storage/浏览器状态

### 存储策略
- 已关闭标签：存储在 `chrome.storage.local`（限制 360 条）
- 已打开标签：实时从 `chrome.tabs` API 查询
- 今日访问：实时从 `chrome.history` API 查询（限制 500 条）

## 重要约束

- **URL 过滤**: 不保存扩展内部 URL (`chrome://`, `chrome-extension://`) 和本地 URL (`file://`)
- **去重**: 已关闭标签按 URL 去重，避免重复保存相同页面
- **数量限制**: 关闭标签最多保存 360 条，超出后删除最早的记录

## 文件路径别名

使用 `@/` 作为 `src/` 的别名（由 WXT 配置）。
