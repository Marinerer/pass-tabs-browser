class BrowserTabs {
  /**
   * 创建新标签页
   * @param tab 标签页信息
   * @returns
   */
  static async create(tab: chrome.tabs.CreateProperties) {
    return new Promise<chrome.tabs.Tab>((resolve) => {
      browser.tabs.create(tab, (tab) => {
        resolve(tab)
      })
    })
  }

  /**
   * 查询标签页
   * @param queryInfo 查询条件
   * @returns
   */
  static async query(queryInfo: chrome.tabs.QueryInfo = {}) {
    return new Promise<chrome.tabs.Tab[]>((resolve) => {
      browser.tabs.query(queryInfo, (tabs) => {
        resolve(tabs)
      })
    })
  }

  /**
   * 关闭标签页
   * @param tabId 标签页ID
   * @returns
   */
  static async remove(tabId: number) {
    return new Promise<void>((resolve) => {
      browser.tabs.remove(tabId, () => {
        resolve()
      })
    })
  }

  /**
   * 更新标签页
   * @param tabId 标签页ID
   * @param updateProperties 更新属性
   * @returns
   */
  static async update(tabId: number, updateProperties: chrome.tabs.UpdateProperties) {
    return new Promise<chrome.tabs.Tab>((resolve) => {
      browser.tabs.update(tabId, updateProperties, (tab) => {
        resolve(tab!)
      })
    })
  }

  static onCreated(callback: (tab: chrome.tabs.Tab) => void) {
    browser.tabs.onCreated.addListener(callback)
  }

  static onUpdated(
    callback: (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => void
  ) {
    browser.tabs.onUpdated.addListener(callback)
  }

  static onRemoved(callback: (tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => void) {
    browser.tabs.onRemoved.addListener(callback)
  }
}

export default BrowserTabs
