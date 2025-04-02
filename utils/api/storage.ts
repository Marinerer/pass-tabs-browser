type ChangeCallback = (
  changes: { [key: string]: chrome.storage.StorageChange },
  areaName: chrome.storage.AreaName
) => void

/**
 * Chrome Storage 操作类
 */
class BrowserStorage {
  /**
   * 获取存储数据
   * @param key 键名
   * @returns 存储的值
   */
  static async get<T = { [key: string]: any }>(key?: string): Promise<T> {
    return new Promise((resolve, reject) => {
      browser.storage.local.get(key ?? null, (result) => {
        if (browser.runtime.lastError) {
          reject(browser.runtime.lastError)
        } else {
          if (key) {
            resolve(result[key] as T)
          } else {
            resolve(result as T)
          }
        }
      })
    })
  }

  /**
   * 设置存储数据
   * @param key 键名
   * @param value 值
   */
  static async set<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      browser.storage.local.set({ [key]: value }, () => {
        if (browser.runtime.lastError) {
          reject(browser.runtime.lastError)
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * 删除存储数据
   * @param key 键名
   */
  static async remove(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      browser.storage.local.remove(key, () => {
        if (browser.runtime.lastError) {
          reject(browser.runtime.lastError)
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * 清空所有存储数据
   */
  static async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      browser.storage.local.clear(() => {
        if (browser.runtime.lastError) {
          reject(browser.runtime.lastError)
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * 监听存储变化
   * @param callback 回调函数
   */
  static onChanged(callback: ChangeCallback) {
    chrome.storage.onChanged.addListener(callback)
  }
}

export default BrowserStorage
