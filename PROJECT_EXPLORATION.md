# Pass Tabs Browser 项目结构详细探索报告

## 1. 项目概述
- 类型: Chrome/Firefox 浏览器扩展
- 功能: 快速切换和管理最近访问的浏览器标签页
- 三种视图: 已关闭(Undo) / 已打开(Opened) / 今日访问(Today)

## 2. 目录结构关键文件

### entrypoints/ (入口点)
- background.ts: Service Worker - 监听浏览器事件，保存关闭的标签
- content.ts: Content Script - 页面注入脚本（目前简化）
- popup/index.html: 弹窗HTML结构
- popup/main.ts: 弹窗主逻辑
- popup/style.css: TailwindCSS样式

### utils/ (工具和业务逻辑)
- types.ts: 类型定义系统
- const.ts: 常量配置
- index.ts: 通用工具函数
- tabs.ts: 标签页渲染管理引擎
- closed.ts: 已关闭标签Handler实现
- opened.ts: 已打开标签Handler实现
- today.ts: 今日访问Handler实现
- theme.ts: 主题切换
- api/: 浏览器API封装（storage, tabs, history, windows）

### components/ (UI组件)
- TabGroup.ts: 标签分组组件（Undo/Opened/Today切换）
- TabItems.ts: 标签列表渲染组件

## 3. 核心设计模式 - Handler模式

### 统一接口定义 (types.ts)
```
interface TabItemsHandlers<T extends TabType> {
  loadTabs(): Promise<TabItem<T>[]>      # 加载数据
  clickItem(item: TabItem<T>): Promise<void>  # 点击处理
  removeItem(item: TabItem<T>): Promise<void> # 删除处理
}
```

### 三种Handler实现
1. closedTabHandlers (closed.ts)
   - loadTabs: 从Storage加载已关闭标签
   - clickItem: 恢复标签（删除记录+打开新标签）
   - removeItem: 删除标签记录

2. openedTabHandlers (opened.ts)
   - loadTabs: 实时查询chrome.tabs
   - clickItem: 激活标签和窗口
   - removeItem: 关闭标签

3. todayTabHandlers (today.ts)
   - loadTabs: 查询今天00:00以后的历史记录
   - clickItem: 在新标签页打开
   - removeItem: 删除历史记录

## 4. 分层架构

UI层 (popup/main.ts)
  ↓
业务逻辑层 (Handler: closed/opened/today)
  ↓
API封装层 (api: storage/tabs/history/windows)

## 5. 数据流

### 用户点击已关闭标签的恢复流程
setupTabItems回调
  → popup/main.ts的clickTabItem()
  → closedTabHandlers.clickItem()
  → saveClosedTab()删除+TabsApi.create()打开
  → Storage变化触发onChanged监听
  → 自动renderTabs('closed')重新加载

### background.ts事件监听流程
browser.tabs.onRemoved
  → saveClosedTab(tabInfo)
  → 保存到Storage
  → popup的onChanged监听
  → 自动更新UI

## 6. 存储策略

| 类型   | 存储    | 来源     | 限制  |
| ------ | ------- | -------- | ----- |
| closed | Storage | 手动     | 360条 |
| opened | 内存    | 实时查询 | 无    |
| today  | 内存    | 实时查询 | 500条 |

## 7. 关键类型定义 (types.ts)

TabType: 'closed' | 'opened' | 'today'

TabClosedData (已关闭标签):
- id: string (时间戳-随机数)
- title: string
- url: string
- favIconUrl: string
- closedAt: number

TabItem<T>: 转换后的标签项，包含:
- domain: 提取的域名
- time: 格式化的相对时间
- favIconUrl: 网站图标
- + 原始数据

## 8. closed.ts核心实现

saveClosedTab(tab):
1. 生成唯一ID: ${Date.now()}-${randomId()}
2. 添加到数组头部（最新优先）
3. 按URL去重
4. 超过360条删除最早的记录
5. 保存到Storage

closedTabHandlers:
- loadTabs: 从Storage加载 + 转换
- clickItem: 调用openTab() → 删除+打开
- removeItem: 从Storage删除该条记录

## 9. background.ts关键事件

tabsCache: Record<string, TabCacheItem>
  - 缓存所有打开的标签

invalidTab(tab):
  - 过滤扩展内部URL (chrome://, edge://, about:)
  - 过滤本地URL (localhost, 127.0.0.1, file://)

事件处理:
- onCreated: 新建标签时缓存
- onUpdated: 加载完成时更新缓存
- onRemoved: 关闭时保存到Storage
- window onRemoved: 窗口关闭时保存所有标签

## 10. popup/main.ts初始化流程

1. useTheme($theme) - 初始化主题
2. setupTabItems() - 创建列表渲染函数
3. useTabsRender() - 创建渲染管理引擎
4. setupTabGroup() - 创建标签分组UI
5. addInputListener() - 搜索功能
6. 键盘快捷键绑定 (/ 键聚焦搜索框)

## 11. useTabsRender() 核心功能

dataCache: 缓存各标签类型的数据

renderTabs(tabType):
  - 调用handler.loadTabs()获取数据
  - 缓存到dataCache
  - 调用render函数更新UI

searchTabs(keyword, tabType):
  - 支持空格分隔的多关键词
  - 过滤dataCache中的数据
  - 调用render(filtered, true)

clickTabItem(tabItem, tabType):
  - 调用handler.clickItem()

deleteTabItem(tabItem, tabType):
  - 调用handler.removeItem()

onChangedData():
  - 监听Storage变化 → renderTabs('closed')
  - 监听History变化 → renderTabs('today')
  - 监听Tabs变化 → renderTabs('opened')
  - 监听Window变化 → renderTabs('opened')

## 12. TabGroup.ts组件

setupTabGroup(element, active, callback):
1. 根据TABS_MAP生成标签HTML
2. 为active标签添加active类
3. 绑定click事件
   - 移除其他标签的active类
   - 添加当前标签的active类
   - 调用callback(tabType)

## 13. TabItems.ts组件

setupTabItems(itemsEl, emptyEl, callback):
1. 绑定事件委托（仅一次）
   - 判断点击目标是tab-item还是tab-item-delete
   - 调用callback(itemId, action)

2. 返回render函数（多次调用）
   - 显示空状态或列表
   - 生成HTML: 图标+标题+域名+时间+删除按钮
   - 插入itemsEl

## 14. 工具函数 (index.ts)

URL处理:
- isExtensionUrl(url) - 判断扩展内部URL
- isLocalUrl(url) - 判断本地URL
- getDomainFromUrl(url) - 提取域名

数据转换:
- transformTabItem(data, timeKey) - 转换为TabItem
- escapeHTML(str) - HTML转义防XSS
- formatRelativeTime(time) - 相对时间格式

数据操作:
- uniqueItem(arr, key) - 数组去重
- randomId() - 随机ID生成

## 15. API封装层

storage.ts:
- get<T>(key): Promise<T>
- set<T>(key, value): Promise<void>
- remove(key): Promise<void>
- onChanged(callback): void

tabs.ts:
- create(tab): Promise<Tab>
- query(queryInfo): Promise<Tab[]>
- remove(tabId): Promise<void>
- update(tabId, updateProperties): Promise<Tab>
- onCreated/onUpdated/onRemoved: 事件监听

history.ts:
- search(query): Promise<HistoryItem[]>
- delete(url): Promise<void>
- onRemoved(callback): void

windows.ts:
- update(windowId, updateInfo): Promise<Window>
- onRemoved(callback): void

## 16. theme.ts主题系统

useTheme(toggleEl):
1. 获取存储的主题偏好
2. 应用主题（存储偏好 > 系统偏好）
3. 绑定切换按钮事件

存储键: COLOR_THEME_KEY = 'pass_color_theme'

## 17. popup HTML结构

560px x 560px容器

结构:
- header: Logo + 搜索框 + 主题按钮
- nav.tab-group: 标签分组 (ul#tab-group)
- main: 列表区域
  - div#empty: 空状态
  - div#tab-list: 列表项

列表项HTML结构:
<div class="tab-item" data-item-id="${id}">
  <img src="${favIconUrl}" />
  <h3>${title}</h3>
  <div>${domain}</div>
  <span>${time}</span>
  <button class="tab-item-delete" data-item-id="${id}" />
</div>

## 18. 样式系统 (TailwindCSS)

容器: 560px固定宽度，320-560px高度，flex column

tab-group-item:
- active: border-b-2 primary-500, text primary-600
- 非active: border-b-2 transparent, text gray-500

tab-item:
- 背景: gray-50 (dark: gray-700)
- hover: gray-100 (dark: gray-600)
- 删除按钮仅hover时显示

滚动条: 自定义webkit样式，圆角设计

## 19. 常量配置 (const.ts)

MAX_TABS_COUNT = 360        # 最大关闭标签数
MAX_HISTORY_COUNT = 500     # 最大历史记录数
TAB_CLOSED_KEY = 'pass_closed_tabs'
COLOR_THEME_KEY = 'pass_color_theme'
DEFAULT_TAB_TYPE = 'pass_tab_type'

TABS_MAP:
  closed: { title: '已关闭', text: 'Undo' }
  opened: { title: '已打开', text: 'Opened' }
  today: { title: '今日访问', text: 'Today' }
