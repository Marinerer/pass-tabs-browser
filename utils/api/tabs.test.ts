import { describe, it, expect, vi, beforeEach } from 'vitest'
import BrowserTabs from './tabs' // Adjust path as necessary

// Mock browser API for tabs
// @ts-ignore
global.browser = {
  tabs: {
    create: vi.fn(),
    query: vi.fn(),
    remove: vi.fn(),
    update: vi.fn(),
    onCreated: {
      addListener: vi.fn(),
    },
    onUpdated: {
      addListener: vi.fn(),
    },
    onRemoved: {
      addListener: vi.fn(),
    },
  },
  runtime: {
    lastError: null as chrome.runtime.LastError | null | undefined,
  },
} as typeof chrome

describe('BrowserTabs API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // @ts-ignore
    global.browser.runtime.lastError = null
  })

  describe('create', () => {
    it('should create a new tab with given properties and resolve with the tab object', async () => {
      const mockTab = { id: 1, url: 'http://example.com' }
      // @ts-ignore
      global.browser.tabs.create.mockImplementation((props, callback) => {
        if (callback) callback(mockTab as chrome.tabs.Tab) // Browser API often uses callbacks
        return Promise.resolve(mockTab as chrome.tabs.Tab) // Some wrappers might return Promise
      })

      const properties = { url: 'http://example.com' }
      const result = await BrowserTabs.create(properties)

      expect(global.browser.tabs.create).toHaveBeenCalledWith(properties, expect.any(Function))
      expect(result).toEqual(mockTab)
    })

    it('should reject if browser.runtime.lastError is set during create', async () => {
      const errorMessage = 'Create tab failed'
      // @ts-ignore
      global.browser.runtime.lastError = { message: errorMessage }
       // @ts-ignore
      global.browser.tabs.create.mockImplementation((props, callback) => {
        if (callback) callback(undefined) // Simulate error by not returning a tab
        return Promise.resolve(undefined) 
      })

      const properties = { url: 'http://error.com' }
      await expect(BrowserTabs.create(properties)).rejects.toEqual({ message: errorMessage })
    })
  })

  describe('query', () => {
    it('should query tabs with given options and resolve with an array of tabs', async () => {
      const mockTabs = [{ id: 1, url: 'http://example.com' }]
      // @ts-ignore
      global.browser.tabs.query.mockImplementation((options, callback) => {
        callback(mockTabs as chrome.tabs.Tab[])
      })

      const queryOptions = { active: true }
      const result = await BrowserTabs.query(queryOptions)

      expect(global.browser.tabs.query).toHaveBeenCalledWith(queryOptions, expect.any(Function))
      expect(result).toEqual(mockTabs)
    })

    it('should reject if browser.runtime.lastError is set during query', async () => {
      const errorMessage = 'Query tabs failed'
      // @ts-ignore
      global.browser.runtime.lastError = { message: errorMessage }
      // @ts-ignore
      global.browser.tabs.query.mockImplementation((options, callback) => {
        callback([])
      })

      const queryOptions = { active: true }
      await expect(BrowserTabs.query(queryOptions)).rejects.toEqual({ message: errorMessage })
    })
  })

  describe('remove', () => {
    it('should remove a tab by id and resolve', async () => {
      // @ts-ignore
      global.browser.tabs.remove.mockImplementation((tabId, callback) => {
        if (callback) callback()
        return Promise.resolve()
      })

      const tabId = 1
      await BrowserTabs.remove(tabId)

      expect(global.browser.tabs.remove).toHaveBeenCalledWith(tabId, expect.any(Function))
    })

    it('should reject if browser.runtime.lastError is set during remove', async () => {
      const errorMessage = 'Remove tab failed'
      // @ts-ignore
      global.browser.runtime.lastError = { message: errorMessage }
      // @ts-ignore
      global.browser.tabs.remove.mockImplementation((tabId, callback) => {
        if (callback) callback()
        return Promise.resolve()
      })


      const tabId = 1
      await expect(BrowserTabs.remove(tabId)).rejects.toEqual({ message: errorMessage })
    })
  })

  describe('update', () => {
    it('should update a tab with given properties and resolve with the updated tab', async () => {
      const mockUpdatedTab = { id: 1, url: 'http://updated.example.com' }
       // @ts-ignore
      global.browser.tabs.update.mockImplementation((tabId, props, callback) => {
        if (callback) callback(mockUpdatedTab as chrome.tabs.Tab)
        return Promise.resolve(mockUpdatedTab as chrome.tabs.Tab)
      })

      const tabId = 1
      const properties = { url: 'http://updated.example.com' }
      const result = await BrowserTabs.update(tabId, properties)

      expect(global.browser.tabs.update).toHaveBeenCalledWith(tabId, properties, expect.any(Function))
      expect(result).toEqual(mockUpdatedTab)
    })

    it('should reject if browser.runtime.lastError is set during update', async () => {
      const errorMessage = 'Update tab failed'
      // @ts-ignore
      global.browser.runtime.lastError = { message: errorMessage }
      // @ts-ignore
      global.browser.tabs.update.mockImplementation((tabId, props, callback) => {
        if (callback) callback(undefined)
        return Promise.resolve(undefined)
      })

      const tabId = 1
      const properties = { url: 'http://error.com' }
      await expect(BrowserTabs.update(tabId, properties)).rejects.toEqual({ message: errorMessage })
    })
  })

  describe('Event Listeners', () => {
    it('onCreated should register a listener with browser.tabs.onCreated.addListener', () => {
      const callback = vi.fn()
      BrowserTabs.onCreated(callback)
      expect(global.browser.tabs.onCreated.addListener).toHaveBeenCalledWith(callback)
    })

    it('onUpdated should register a listener with browser.tabs.onUpdated.addListener', () => {
      const callback = vi.fn()
      BrowserTabs.onUpdated(callback)
      expect(global.browser.tabs.onUpdated.addListener).toHaveBeenCalledWith(callback)
    })

    it('onRemoved should register a listener with browser.tabs.onRemoved.addListener', () => {
      const callback = vi.fn()
      BrowserTabs.onRemoved(callback)
      expect(global.browser.tabs.onRemoved.addListener).toHaveBeenCalledWith(callback)
    })
  })
})
