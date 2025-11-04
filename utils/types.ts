import { TAB_CLOSED_KEY, TABS_MAP, SORT_OPTIONS } from './const'

export type TabType = keyof typeof TABS_MAP
export type SortType = keyof typeof SORT_OPTIONS

// 临时存储的 tab 数据
export interface TabCacheItem {
  url: string
  title: string
  favIconUrl: string
  windowId: number
}

// 扩展 tab 数据项
export interface TabMergedItem {
  domain: string
  time: string
  favIconUrl: string
}

// 保存的 closed 数据
export interface TabClosedData {
  id: string
  title: string
  url: string
  favIconUrl: string
  closedAt: number
}

// tabItem 源数据
export type TabItemData<T extends TabType> = T extends 'closed'
  ? TabClosedData
  : T extends 'opened'
  ? chrome.tabs.Tab
  : T extends 'today'
  ? chrome.history.HistoryItem
  : never

// tabItem 转换后的数据
export type TabItem<T extends TabType> = TabItemData<T> & TabMergedItem

/**
 * tab 列表操作
 */
export interface TabItemsHandlers<T extends TabType> {
  /**
   * 加载 tab 列表数据
   */
  loadTabs(): Promise<TabItem<T>[]>
  /**
   * 点击 tab 列表项
   */
  clickItem(item: TabItem<T>): Promise<void>
  /**
   * 移除 tab 列表项
   */
  removeItem(item: TabItem<T>): Promise<void>
}
export interface TabItemsHandlerMap {
  closed: TabItemsHandlers<'closed'>
  opened: TabItemsHandlers<'opened'>
  today: TabItemsHandlers<'today'>
}

export interface StorageData {
  [TAB_CLOSED_KEY]: TabClosedData[]
}
