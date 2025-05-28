/**
 * 实现与浏览器窗口交互，比如创建、修改和重新排列窗口。
 */
class BrowserWindows {
  static async getById(windowId: number): Promise<chrome.windows.Window> { // Renamed and specified return type
    return new Promise((resolve, reject) => {
      browser.windows.get(windowId, (foundWindow) => { // Parameter name changed for clarity
        if (browser.runtime.lastError) {
          reject(browser.runtime.lastError)
        } else {
          resolve(foundWindow)
        }
      })
    })
  }

  static async getAll(getInfo?: chrome.windows.GetAllGetInfoType): Promise<chrome.windows.Window[]> {
    return new Promise<chrome.windows.Window[]>((resolve, reject) => {
      const callback = (windows: chrome.windows.Window[]) => {
        if (browser.runtime.lastError) {
          reject(browser.runtime.lastError);
        } else {
          resolve(windows);
        }
      };
      // browser.windows.getAll can be called with (callback) or (getInfo, callback)
      if (typeof getInfo === 'object' && getInfo !== null) {
        browser.windows.getAll(getInfo, callback);
      } else {
        // If getInfo is not provided (or not an object), call getAll with only the callback.
        // This handles the case where getInfo is undefined.
        browser.windows.getAll(callback as any); // Use 'as any' if TS complains about overload match without getInfo
      }
    });
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
