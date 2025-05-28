class BrowserTabs {
  /**
   * 创建新标签页
   * @param tab 标签页信息
   * @returns
   */
  static async create(tab: chrome.tabs.CreateProperties) {
    return new Promise<chrome.tabs.Tab>((resolve, reject) => {
      browser.tabs.create(tab, (createdTab) => {
        if (browser.runtime.lastError) {
          reject(browser.runtime.lastError);
        } else {
          resolve(createdTab);
        }
      })
    })
  }

  /**
   * 查询标签页
   * @param queryInfo 查询条件
   * @returns
   */
  static async query(queryInfo: chrome.tabs.QueryInfo = {}) {
    return new Promise<chrome.tabs.Tab[]>((resolve, reject) => {
      browser.tabs.query(queryInfo, (tabs) => {
        if (browser.runtime.lastError) {
          reject(browser.runtime.lastError);
        } else {
          resolve(tabs);
        }
      })
    })
  }

  /**
   * 关闭标签页
   * @param tabId 标签页ID
   * @returns
   */
  static async remove(tabId: number) {
    return new Promise<void>((resolve, reject) => {
      browser.tabs.remove(tabId, () => {
        if (browser.runtime.lastError) {
          reject(browser.runtime.lastError);
        } else {
          resolve();
        }
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
    return new Promise<chrome.tabs.Tab>((resolve, reject) => {
      browser.tabs.update(tabId, updateProperties, (updatedTab) => {
        if (browser.runtime.lastError) {
          reject(browser.runtime.lastError);
        } else {
          resolve(updatedTab!); // tab can be undefined if error, but lastError check handles it
        }
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
