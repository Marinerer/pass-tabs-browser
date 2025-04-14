import { TabType, TabItem, TabItemsHandlers } from '@/utils/types'
import { TAB_CLOSED_KEY, DEFAULT_TAB_TYPE } from '@/utils/const'
import StoreApi from '@/utils/api/storage'
import HistoryApi from '@/utils/api/history'
import TabsApi from '@/utils/api/tabs'
import WindowsApi from '@/utils/api/windows'
import { closedTabHandlers } from '@/utils/closed'
import { openedTabHandlers } from '@/utils/opened'
import { todayTabHandlers } from '@/utils/today'

const tabsMap: Record<TabType, TabItemsHandlers<TabType>> = {
  closed: closedTabHandlers,
  opened: openedTabHandlers,
  today: todayTabHandlers,
}

// 获取当前标签页
export async function getTabType() {
  const tab = await StoreApi.get<TabType>(DEFAULT_TAB_TYPE)
  return tab
}

export async function setTabType(tab: TabType) {
  if (!tab) return
  // 设置当前标签页
  await StoreApi.set(DEFAULT_TAB_TYPE, tab)
}

function getTabItemById(id: string, items: any[]) {
  return items.find((item) => String(item.id) === id)
}

export async function clickTabItem<T extends TabType>(tabItem: TabItem<T>, tabType: T) {
  try {
    await tabsMap[tabType].clickItem(tabItem)
  } catch (err) {
    console.error(`[${tabType}TabItemClick]:`, err)
  }
}
export async function deleteTabItem<T extends TabType>(tabItem: TabItem<T>, tabType: T) {
  try {
    await tabsMap[tabType].removeItem(tabItem)
  } catch (err) {
    console.error(`[${tabType}TabItemDelete]:`, err)
  }
}

type TabDataCacheMap = { [K in TabType]: TabItem<K>[] }
export function useTabsRender<T extends TabType>(
  activeTab: T,
  render: (list: TabItem<T>[], isSearch?: boolean) => void | Promise<void>
) {
  // 缓存 tab 数据
  let dataCache: TabDataCacheMap = {} as TabDataCacheMap

  // 渲染 tab 列表
  const renderTabs = async (tabType: T) => {
    activeTab = tabType
    //! WARN: 存在类型问题
    dataCache[tabType] = (await tabsMap[tabType].loadTabs()) as unknown as TabDataCacheMap[T]
    await render(dataCache[tabType]!)
  }

  // 搜索页签
  const searchTabs = async (keyword: string, tabType: TabType) => {
    if (typeof keyword !== 'string') return

    if (!dataCache[tabType]) {
      //@ts-ignore
      dataCache[tab] = await tabsMap[tabType].loadTabs()
    }
    // 支持多个关键词搜索
    const keywords = keyword.toLowerCase().split(' ')
    const result =
      keywords.length > 0
        ? dataCache[tabType]?.filter((item) => {
            const title = item.title!.toLowerCase()
            const url = item.url!.toLowerCase()
            return keywords.every((keyword) => title.includes(keyword) || url.includes(keyword))
          })
        : dataCache[tabType]
    await render(result as TabItem<T>[], true)
  }

  // 点击页签
  const onClick = async <T extends TabType>(tabItem: string | TabItem<T>, tabType: T) => {
    if (!tabItem) return
    if (typeof tabItem === 'string') {
      tabItem = getTabItemById(tabItem, dataCache[tabType]!) as TabItem<T>
    }
    await clickTabItem(tabItem, tabType)
  }

  // 删除页签
  const onDelete = async <T extends TabType>(tabItem: string | TabItem<T>, tabType: T) => {
    if (!tabItem) return
    if (typeof tabItem === 'string') {
      tabItem = getTabItemById(tabItem, dataCache[tabType]!) as TabItem<T>
    }
    await deleteTabItem(tabItem, tabType)
  }

  // 监听数据变化
  function onChangedData() {
    // 1. 监听关闭的标签数据变化, 并更新 closed 列表
    StoreApi.onChanged(async (changes, area) => {
      if (changes[TAB_CLOSED_KEY] && area === 'local' && activeTab === 'closed') {
        await renderTabs(activeTab)
      }
    })
    // 2. 监听历史记录变化, 并更新 today 列表
    HistoryApi.onRemoved(async (removeInfo) => {
      if (activeTab === 'today') {
        await renderTabs(activeTab)
      }
    })
    // 3. 监听标签页变化, 并更新 opened 列表
    TabsApi.onRemoved(async (tabId) => {
      if (activeTab === 'opened') {
        await renderTabs(activeTab)
      }
    })
    // 3. 监听窗口变化, 并更新 opened 列表
    WindowsApi.onRemoved(async (windowId) => {
      if (activeTab === 'opened') {
        await renderTabs(activeTab)
      }
    })
  }
  onChangedData()
  renderTabs(activeTab)

  return {
    renderTabs,
    searchTabs,
    clickTabItem: onClick,
    deleteTabItem: onDelete,
  }
}
