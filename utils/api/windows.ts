/**
 * 实现与浏览器窗口交互，比如创建、修改和重新排列窗口。
 */
class BrowserWindows {
  static async get<T>(key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      browser.windows.get(Number(key), (result) => {
        if (browser.runtime.lastError) {
          reject(browser.runtime.lastError)
        } else {
          resolve(result as T)
        }
      })
    })
  }

  static async remove(windowId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      browser.windows.remove(windowId, () => {
        if (browser.runtime.lastError) {
          reject(browser.runtime.lastError)
        } else {
          resolve()
        }
      })
    })
  }

  static async update(
    windowId: number,
    updateProperties: chrome.windows.UpdateInfo
  ): Promise<chrome.windows.Window> {
    return new Promise((resolve, reject) => {
      browser.windows.update(windowId, updateProperties, (result) => {
        if (browser.runtime.lastError) {
          reject(browser.runtime.lastError)
        } else {
          resolve(result)
        }
      })
    })
  }

  static onRemoved(callback: (windowId: number) => void) {
    browser.windows.onRemoved.addListener(callback)
  }

  static onCreated(callback: (window: chrome.windows.Window) => void) {
    browser.windows.onCreated.addListener(callback)
  }
}

export default BrowserWindows
