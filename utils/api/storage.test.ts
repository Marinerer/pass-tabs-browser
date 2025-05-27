import { describe, it, expect, beforeEach, vi } from 'vitest'
import BrowserStorage from './storage' // Adjust path as necessary

// Mock browser.storage API
const mockStorageArea = () => {
  let store: { [key: string]: any } = {}
  return {
    get: vi.fn((keys, callback) => {
      // This mock implementation needs to accurately reflect how browser.storage.get behaves.
      // - If `keys` is null, the entire storage content is passed to the callback.
      // - If `keys` is a string (single key), an object with that key and its value (or empty if not found) is passed.
      // - If `keys` is an array of strings, an object with the requested keys and their values is passed.
      // The BrowserStorage class calls `browser.storage[area].get(key ?? null, ...)`
      // So `keys` will be either a string or null.
      const result: { [key: string]: any } = {}
      if (keys === null) {
        Object.assign(result, store)
      } else if (typeof keys === 'string') {
        if (store.hasOwnProperty(keys)) {
          result[keys] = store[keys]
        }
      } else if (Array.isArray(keys)) { // Though BrowserStorage doesn't use array type for `get`
        keys.forEach((key) => {
          if (store.hasOwnProperty(key)) {
            result[key] = store[key]
          }
        })
      }
      callback(result)
    }),
    set: vi.fn((items, callback) => {
      store = { ...store, ...items }
      callback()
    }),
    remove: vi.fn((keys, callback) => {
      const keyList = typeof keys === 'string' ? [keys] : keys
      keyList.forEach((key) => {
        delete store[key]
      })
      callback()
    }),
    clear: vi.fn((callback) => {
      store = {}
      callback()
    }),
    // Helper to check internal store for tests
    _getStore: () => store,
    _setStore: (newStore: any) => { store = newStore },
    _clearStore: () => { store = {} },
  }
}

const mockLocalStore = mockStorageArea()
const mockSyncStore = mockStorageArea()

// @ts-ignore
global.browser = {
  storage: {
    local: mockLocalStore,
    sync: mockSyncStore,
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(),
    },
  },
  runtime: {
    lastError: null as chrome.runtime.LastError | null | undefined,
  },
} as typeof chrome

describe('BrowserStorage', () => {
  beforeEach(() => {
    // Reset mocks and lastError before each test
    vi.clearAllMocks()
    mockLocalStore._clearStore()
    mockSyncStore._clearStore()
    // @ts-ignore
    global.browser.runtime.lastError = null
  })

  // Test suite for 'local' storage area
  describe('Local Storage Area', () => {
    const area = 'local'

    it('should get a value from local storage', async () => {
      mockLocalStore._setStore({ testKey: 'testValue' })
      const value = await BrowserStorage.get('testKey', area)
      expect(value).toBe('testValue')
      // BrowserStorage calls .get with the key as a string, not an array
      expect(mockLocalStore.get).toHaveBeenCalledWith('testKey', expect.any(Function))
    })

    it('should get all values from local storage if no key is provided', async () => {
      mockLocalStore._setStore({ key1: 'value1', key2: 'value2' })
      const values = await BrowserStorage.get(undefined, area)
      expect(values).toEqual({ key1: 'value1', key2: 'value2' })
      expect(mockLocalStore.get).toHaveBeenCalledWith(null, expect.any(Function))
    })

    it('should set a value to local storage', async () => {
      await BrowserStorage.set('testKey', 'testValue', area)
      expect(mockLocalStore.set).toHaveBeenCalledWith({ testKey: 'testValue' }, expect.any(Function))
      expect(mockLocalStore._getStore()).toEqual({ testKey: 'testValue' })
    })

    it('should remove a value from local storage', async () => {
      mockLocalStore._setStore({ testKey: 'testValue', anotherKey: 'anotherValue' })
      await BrowserStorage.remove('testKey', area)
      expect(mockLocalStore.remove).toHaveBeenCalledWith('testKey', expect.any(Function))
      expect(mockLocalStore._getStore()).toEqual({ anotherKey: 'anotherValue' })
    })

    it('should clear all values from local storage', async () => {
      mockLocalStore._setStore({ key1: 'value1', key2: 'value2' })
      await BrowserStorage.clear(area)
      expect(mockLocalStore.clear).toHaveBeenCalledWith(expect.any(Function))
      expect(mockLocalStore._getStore()).toEqual({})
    })
  })

  // Test suite for 'sync' storage area
  describe('Sync Storage Area', () => {
    const area = 'sync'

    it('should get a value from sync storage', async () => {
      mockSyncStore._setStore({ testKey: 'testValueSync' })
      const value = await BrowserStorage.get('testKey', area)
      expect(value).toBe('testValueSync')
      // BrowserStorage calls .get with the key as a string, not an array
      expect(mockSyncStore.get).toHaveBeenCalledWith('testKey', expect.any(Function))
    })

    it('should get all values from sync storage if no key is provided', async () => {
      mockSyncStore._setStore({ key1: 'value1Sync', key2: 'value2Sync' })
      const values = await BrowserStorage.get(undefined, area)
      expect(values).toEqual({ key1: 'value1Sync', key2: 'value2Sync' })
      expect(mockSyncStore.get).toHaveBeenCalledWith(null, expect.any(Function))
    })

    it('should set a value to sync storage', async () => {
      await BrowserStorage.set('testKey', 'testValueSync', area)
      expect(mockSyncStore.set).toHaveBeenCalledWith({ testKey: 'testValueSync' }, expect.any(Function))
      expect(mockSyncStore._getStore()).toEqual({ testKey: 'testValueSync' })
    })

    it('should remove a value from sync storage', async () => {
      mockSyncStore._setStore({ testKey: 'testValueSync', anotherKey: 'anotherValueSync' })
      await BrowserStorage.remove('testKey', area)
      expect(mockSyncStore.remove).toHaveBeenCalledWith('testKey', expect.any(Function))
      expect(mockSyncStore._getStore()).toEqual({ anotherKey: 'anotherValueSync' })
    })

    it('should clear all values from sync storage', async () => {
      mockSyncStore._setStore({ key1: 'value1Sync', key2: 'value2Sync' })
      await BrowserStorage.clear(area)
      expect(mockSyncStore.clear).toHaveBeenCalledWith(expect.any(Function))
      expect(mockSyncStore._getStore()).toEqual({})
    })
  })

  // Default area (local) tests
  describe('Default (Local) Storage Area', () => {
    it('should default to local storage for get if area is not provided', async () => {
      mockLocalStore._setStore({ testKey: 'defaultValue' })
      const value = await BrowserStorage.get('testKey') // No area specified
      expect(value).toBe('defaultValue')
      // BrowserStorage calls .get with the key as a string, not an array
      expect(mockLocalStore.get).toHaveBeenCalledWith('testKey', expect.any(Function))
    })

    it('should default to local storage for set if area is not provided', async () => {
      await BrowserStorage.set('defaultKey', 'defaultValue') // No area specified
      expect(mockLocalStore.set).toHaveBeenCalledWith({ defaultKey: 'defaultValue' }, expect.any(Function))
      expect(mockLocalStore._getStore()).toHaveProperty('defaultKey', 'defaultValue')
    })

    it('should default to local storage for remove if area is not provided', async () => {
      mockLocalStore._setStore({ defaultKey: 'testValue' })
      await BrowserStorage.remove('defaultKey') // No area specified
      expect(mockLocalStore.remove).toHaveBeenCalledWith('defaultKey', expect.any(Function))
      expect(mockLocalStore._getStore()).not.toHaveProperty('defaultKey')
    })

    it('should default to local storage for clear if area is not provided', async () => {
      mockLocalStore._setStore({ defaultKey: 'testValue' })
      await BrowserStorage.clear() // No area specified
      expect(mockLocalStore.clear).toHaveBeenCalledWith(expect.any(Function))
      expect(mockLocalStore._getStore()).toEqual({})
    })
  })

  // Error Handling Tests
  describe('Error Handling', () => {
    const area = 'local'
    const errorMessage = 'Simulated storage error'

    beforeEach(() => {
      // @ts-ignore
      global.browser.runtime.lastError = { message: errorMessage }
    })

    afterEach(() => {
      // @ts-ignore
      global.browser.runtime.lastError = null
    })

    it('should reject on get error', async () => {
      await expect(BrowserStorage.get('errorKey', area)).rejects.toEqual({ message: errorMessage })
    })

    it('should reject on set error', async () => {
      await expect(BrowserStorage.set('errorKey', 'errorValue', area)).rejects.toEqual({ message: errorMessage })
    })

    it('should reject on remove error', async () => {
      await expect(BrowserStorage.remove('errorKey', area)).rejects.toEqual({ message: errorMessage })
    })

    it('should reject on clear error', async () => {
      await expect(BrowserStorage.clear(area)).rejects.toEqual({ message: errorMessage })
    })
  })

  // onChanged is not modified by the subtask, but we can ensure it's callable
  describe('onChanged Listener', () => {
    it('should allow adding a listener to storage.onChanged', () => {
      const callback = vi.fn()
      BrowserStorage.onChanged(callback)
      expect(global.browser.storage.onChanged.addListener).toHaveBeenCalledWith(callback)
    })
  })
})
