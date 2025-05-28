class BrowserHistory {
  static async search(
    query: chrome.history.HistoryQuery = { maxResults: 100 } as chrome.history.HistoryQuery
  ) {
    return new Promise<chrome.history.HistoryItem[]>((resolve, reject) => {
      browser.history.search(query, (results) => {
        if (browser.runtime.lastError) {
          reject(browser.runtime.lastError)
        } else {
          resolve(results)
        }
      })
    })
  }

  static async delete(url: string) {
    return new Promise<void>((resolve, reject) => {
      browser.history.deleteUrl({ url }, () => {
        if (browser.runtime.lastError) {
          reject(browser.runtime.lastError)
        } else {
          resolve()
        }
      })
    })
  }

  static async onRemoved(callback: (removed: chrome.history.RemovedResult) => void) {
    browser.history.onVisitRemoved.addListener(callback)
  }

  static onVisited(callback: (result: chrome.history.HistoryItem) => void) { // Added this method
    browser.history.onVisited.addListener(callback);
  }
}

export default BrowserHistory
