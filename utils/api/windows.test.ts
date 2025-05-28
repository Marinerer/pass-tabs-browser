import { describe, it, expect, vi, beforeEach } from 'vitest'
import WindowsApi from './windows' // Adjust path as necessary

// Mock browser API for windows
// @ts-ignore
global.browser = {
  windows: {
    getAll: vi.fn(),
    onRemoved: {
      addListener: vi.fn(),
    },
  },
  runtime: {
    lastError: null as chrome.runtime.LastError | null | undefined,
  },
} as typeof chrome

describe('WindowsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // @ts-ignore
    global.browser.runtime.lastError = null
  })

  describe('getAll', () => {
    it('should call browser.windows.getAll and resolve with an array of window objects', async () => {
      const mockWindows = [{ id: 1, focused: true, type: 'normal' }] as chrome.windows.Window[]
      // @ts-ignore
      global.browser.windows.getAll.mockImplementation((arg1, arg2) => {
        const callback = typeof arg1 === 'function' ? arg1 : arg2;
        // Simulate browser behavior: callback is called even if lastError is set.
        // The wrapper is responsible for checking lastError.
        callback(mockWindows); 
      });

      // Test WindowsApi.getAll() without arguments
      const result1 = await WindowsApi.getAll()
      expect(global.browser.windows.getAll).toHaveBeenCalledWith(expect.any(Function))
      expect(result1).toEqual(mockWindows)
      
      vi.clearAllMocks(); // Clear mocks for the next call

      // Test WindowsApi.getAll({}) with empty options object
      // @ts-ignore
      global.browser.windows.getAll.mockImplementation((arg1, arg2) => {
        const callback = typeof arg1 === 'function' ? arg1 : arg2;
        callback(mockWindows);
      });
      const result2 = await WindowsApi.getAll({})
      expect(global.browser.windows.getAll).toHaveBeenCalledWith({}, expect.any(Function))
      expect(result2).toEqual(mockWindows)

      vi.clearAllMocks();

      // Test WindowsApi.getAll({windowTypes: ['normal']}) with specific options
      const queryOptions = { windowTypes: ['normal'] } as chrome.windows.GetAllGetInfoType;
      // @ts-ignore
      global.browser.windows.getAll.mockImplementation((arg1, arg2) => {
        const callback = typeof arg1 === 'function' ? arg1 : arg2;
        callback(mockWindows);
      });
      const result3 = await WindowsApi.getAll(queryOptions)
      expect(global.browser.windows.getAll).toHaveBeenCalledWith(queryOptions, expect.any(Function))
      expect(result3).toEqual(mockWindows)

    })

    it('should reject if browser.runtime.lastError is set during getAll', async () => {
      const errorMessage = 'Get all windows failed'
      // @ts-ignore
      global.browser.runtime.lastError = { message: errorMessage }
      // @ts-ignore
      global.browser.windows.getAll.mockImplementation((arg1, arg2) => {
        const callback = typeof arg1 === 'function' ? arg1 : arg2;
        // Simulate browser behavior: callback is called, but lastError is set.
        callback([]); // Provide empty array or undefined, wrapper should check lastError
      });

      await expect(WindowsApi.getAll()).rejects.toEqual({ message: errorMessage })
      // Test with options as well
      await expect(WindowsApi.getAll({})).rejects.toEqual({ message: errorMessage })
    })
  })

  describe('onRemoved', () => {
    it('should register a listener with browser.windows.onRemoved.addListener', () => {
      const callback = vi.fn()
      WindowsApi.onRemoved(callback)
      expect(global.browser.windows.onRemoved.addListener).toHaveBeenCalledWith(callback)
    })
  })
})
