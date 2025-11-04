import TabsApi from './api/tabs'
import WindowsApi from './api/windows'
import type { TabItemsHandlers } from './types'
import { transformTabItem } from './helpers'

export const openedTabHandlers: TabItemsHandlers<'opened'> = {
  async loadTabs() {
    const tabs = await getOpenedTabs()
    return tabs.map((item) => transformTabItem<'opened'>(item, 'lastAccessed'))
  },

  async clickItem(item) {
    await switchTab(item)
  },

  async removeItem(item) {
    await TabsApi.remove(item.id!)
  },
}

async function getOpenedTabs() {
  const tabs = await TabsApi.query({})
  return tabs || []
}

async function switchTab(tab: chrome.tabs.Tab) {
  if (!tab?.id) return
  // 切换标签页
  await TabsApi.update(tab.id, { active: true })
  // 切换窗口
  if (tab.windowId !== chrome.windows.WINDOW_ID_NONE) {
    await WindowsApi.update(tab.windowId, { focused: true })
  }
}
