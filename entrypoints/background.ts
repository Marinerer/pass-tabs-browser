import TabsApi from '@/utils/api/tabs'
import WindowsApi from '@/utils/api/windows'
import { isExtensionUrl, isLocalUrl } from '@/utils/helpers'
import { saveClosedTab } from '@/utils/closed'

import { TabCacheItem } from '@/utils/types'

export default defineBackground(() => {
  //@see https://developer.chrome.com/docs/extensions/develop/concepts/activeTab
  // ;(browser.action ?? browser.browserAction).onClicked.addListener(async (tab) => {})
  // console.log('Hello background!', { id: browser.runtime.id })

  // 缓存tab信息
  const tabsCache: Record<string, TabCacheItem> = {}

  function setTabsCache(tab: Record<string, any> = {}) {
    if (!tab) return

    const { url, title = 'Unkown', favIconUrl = '', id, windowId } = tab
    tabsCache[id!] = {
      url,
      title,
      favIconUrl,
      windowId,
    }
  }

  /**
   * 无效的Tab
   * 1.url存在; 2.非内部url; 3.非本地url
   */
  function invalidTab(tab: TabCacheItem) {
    return !tab?.url || isExtensionUrl(tab.url) || isLocalUrl(tab.url)
  }

  // 缓存打开的所有tab信息
  TabsApi.query({}).then((tabs) => {
    tabs.forEach((tab) => setTabsCache(tab))
  })

  // 监听tab的创建
  TabsApi.onCreated((tab) => {
    setTabsCache(tab)
  })
  // 监听tab的更新
  TabsApi.onUpdated((tabId, changeInfo, tab) => {
    if (tabId && changeInfo?.status === 'complete') {
      setTabsCache(tab)
    }
  })
  // 监听tab的关闭事件
  TabsApi.onRemoved(async (tabId) => {
    try {
      const tabInfo = tabsCache[tabId] || {}

      // 过滤无效tab
      if (invalidTab(tabInfo)) {
        delete tabsCache[tabId]
        return
      }

      // 保存关闭的tab信息
      await saveClosedTab(tabInfo)
      // 删除缓存
      delete tabsCache[tabId]
    } catch (err) {
      console.error('saveClosedTab: ', err)
    }
  })
  // 监听窗口的关闭事件
  WindowsApi.onRemoved(async (windowId) => {
    // 从缓存中获取 windowId 对应的 tabs 列表
    const tabs = Object.entries(tabsCache).filter(([_, tabInfo]) => tabInfo.windowId === windowId)
    // 遍历并保存关闭的 tab 信息
    for (const [tabId, tabInfo] of tabs) {
      // 过滤无效tab
      if (invalidTab(tabInfo)) {
        delete tabsCache[tabId]
        continue
      }
      // 保存关闭的tab信息
      await saveClosedTab(tabInfo)
      // 删除缓存
      delete tabsCache[tabId]
    }
  })
})
