import type { TabCacheItem, TabClosedData, TabItemData, TabItemsHandlers } from './types'
import { TAB_CLOSED_KEY, MAX_TABS_COUNT } from './const'
import StoreApi from './api/storage'
import TabsApi from './api/tabs'
import { randomId, transformTabItem, uniqueItem } from './helpers'

export const closedTabHandlers: TabItemsHandlers<'closed'> = {
  async loadTabs() {
    const data = await getClosedTabsFromStore()
    return data.map((item) => transformTabItem<'closed'>(item, 'closedAt'))
  },

  async clickItem(item): Promise<void> {
    await openTab(item)
  },

  async removeItem(item): Promise<void> {
    await removeClosedTabInStore(item)
  },
}

/**
 * 保存关闭的标签
 * @param tab 标签对象
 */
export async function saveClosedTab(tab: TabCacheItem) {
  if (!tab.url) return

  try {
    // 获取存储数据
    let tabs = await getClosedTabsFromStore()

    // 创建新标签
    const now = Date.now()
    const newTab: TabClosedData = {
      id: `${now}-${randomId()}`,
      title: tab.title,
      url: tab.url,
      favIconUrl: tab.favIconUrl,
      closedAt: now,
    }

    // 添加到存储
    tabs.unshift(newTab)
    // 超过最大数量, 删除最早记录
    if (tabs.length > MAX_TABS_COUNT) {
      tabs = tabs.slice(0, MAX_TABS_COUNT)
    }
    // 更新&去重
    await StoreApi.set(TAB_CLOSED_KEY, uniqueItem(tabs, 'url'))
  } catch (e) {
    console.error('[saveClosedTab]:', e)
  }
}

async function getClosedTabsFromStore() {
  const tabs = await StoreApi.get<TabClosedData[]>(TAB_CLOSED_KEY)
  return tabs || []
}

async function openTab(tab: TabItemData<'closed'>) {
  if (!tab?.url) return

  // 从存储中移除标签
  await removeClosedTabInStore(tab)
  // 打开新标签页
  await TabsApi.create({ url: tab.url })
}

async function removeClosedTabInStore(tab: TabItemData<'closed'>) {
  if (!tab?.id) return
  // 获取存储数据
  const tabs = await getClosedTabsFromStore()
  // 移除指定标签
  const newTabs = tabs.filter((item) => item.id !== tab.id)
  //更新存储
  await StoreApi.set(TAB_CLOSED_KEY, newTabs)
  return newTabs
}
