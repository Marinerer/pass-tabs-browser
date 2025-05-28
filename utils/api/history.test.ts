import { describe, it, expect, vi, beforeEach } from 'vitest'
import HistoryApi from './history' // Adjust path as necessary

// Mock browser API
// @ts-ignore
global.browser = {
  history: {
    search: vi.fn(),
    onVisited: {
      addListener: vi.fn(),
    },
    onVisitRemoved: {
      addListener: vi.fn(),
    },
  },
  runtime: {
    lastError: null as chrome.runtime.LastError | null | undefined,
  },
} as typeof chrome

describe('HistoryApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // @ts-ignore
    global.browser.runtime.lastError = null
  })

  describe('search', () => {
    it('should call browser.history.search with correct parameters and resolve with results', async () => {
      const mockHistoryItems = [{ id: '1', url: 'http://example.com', title: 'Example' }]
      // @ts-ignore
      global.browser.history.search.mockImplementation((query, callback) => {
        callback(mockHistoryItems)
      })

      const queryOptions = { text: 'example', maxResults: 10 }
      const result = await HistoryApi.search(queryOptions)

      expect(global.browser.history.search).toHaveBeenCalledWith(queryOptions, expect.any(Function))
      expect(result).toEqual(mockHistoryItems)
    })

    it('should reject if browser.runtime.lastError is set during search', async () => {
      const errorMessage = 'Search failed'
      // @ts-ignore
      global.browser.runtime.lastError = { message: errorMessage }
      // @ts-ignore
      global.browser.history.search.mockImplementation((query, callback) => {
        // Callback might still be called by the browser API before error is processed by the wrapper
        callback([]) 
      })
      
      const queryOptions = { text: 'error_case' }
      await expect(HistoryApi.search(queryOptions)).rejects.toEqual({ message: errorMessage })
      expect(global.browser.history.search).toHaveBeenCalledWith(queryOptions, expect.any(Function))
    })
  })

  describe('onVisited', () => {
    it('should register a listener with browser.history.onVisited.addListener', () => {
      const callback = vi.fn()
      HistoryApi.onVisited(callback)
      expect(global.browser.history.onVisited.addListener).toHaveBeenCalledWith(callback)
    })
  })

  describe('onRemoved', () => {
    it('should register a listener with browser.history.onVisitRemoved.addListener', () => {
      const callback = vi.fn()
      HistoryApi.onRemoved(callback)
      expect(global.browser.history.onVisitRemoved.addListener).toHaveBeenCalledWith(callback)
    })
  })
})
