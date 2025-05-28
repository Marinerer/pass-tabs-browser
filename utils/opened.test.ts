import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { openedTabHandlers } from './opened' // Adjust path
import BrowserTabs from '@/utils/api/tabs' // Adjust path
import * as utilsIndex from '@/utils/index' // To spy on transformTabItem
import { TabItem, TabOpenedData, TabMergedItem } from '@/utils/types' // Adjust path

// Mock dependencies
vi.mock('@/utils/api/tabs')

// Mock browser.windows if needed for clickItem, assuming it's part of global.browser
// @ts-ignore
if (!global.browser) global.browser = {};
// @ts-ignore
if (!global.browser.windows) {
  // @ts-ignore
  global.browser.windows = { 
    update: vi.fn(),
    WINDOW_ID_NONE: -1, // Define WINDOW_ID_NONE for tests if source uses browser.windows.WINDOW_ID_NONE
  };
}


describe('openedTabHandlers', () => {
  let mockOpenedTabs: chrome.tabs.Tab[]

  beforeEach(() => {
    vi.clearAllMocks()
    mockOpenedTabs = [
      { id: 1, url: 'http://opened1.com', title: 'Opened Tab 1', favIconUrl: 'icon1.png', index: 0, pinned: false, highlighted: false, windowId: 1, active: false, incognito: false, discarded: false, autoDiscardable: true, lastAccessed: 3000 } as chrome.tabs.Tab,
      { id: 2, url: 'http://opened2.com', title: 'Opened Tab 2', favIconUrl: 'icon2.png', index: 1, pinned: false, highlighted: false, windowId: 1, active: true, incognito: false, discarded: false, autoDiscardable: true, lastAccessed: 2000 } as chrome.tabs.Tab,
      { id: 3, url: 'chrome://extensions', title: 'Extensions Page', favIconUrl: '', index: 2, pinned: false, highlighted: false, windowId: 1, active: false, incognito: false, discarded: false, autoDiscardable: true, lastAccessed: 1000 } as chrome.tabs.Tab, // Should be filtered out
    ]
    // @ts-ignore
    BrowserTabs.query.mockResolvedValue(mockOpenedTabs)
    // @ts-ignore
    BrowserTabs.update.mockImplementation((tabId, updateProps, callback) => {
      const updatedTab = { id: tabId, ...updateProps } as chrome.tabs.Tab;
      if (callback) {
        // @ts-ignore runtime.lastError would be set by browser if error occurred
        if (global.browser.runtime.lastError) callback(undefined);
        else callback(updatedTab);
      }
      // This mock doesn't need to return a Promise if the source (BrowserTabs.update) uses the callback.
    });
    
    // @ts-ignore
    global.browser.windows.update = vi.fn((windowId, updateInfo, callback) => {
      const updatedWindow = { id: windowId, ...updateInfo } as chrome.windows.Window;
      if (callback) {
         // @ts-ignore runtime.lastError would be set by browser if error occurred
        if (global.browser.runtime.lastError) callback(undefined);
        else callback(updatedWindow);
      }
    });
    // @ts-ignore
    global.browser.windows.WINDOW_ID_NONE = -1;
    
    // @ts-ignore
    BrowserTabs.remove.mockImplementation((tabId, callback) => {
      if (callback) {
        // @ts-ignore
        if (global.browser.runtime.lastError) callback(); // No specific value on success for remove
        else callback();
      }
    });
  })

  describe('loadTabs()', () => {
    let transformTabItemSpy: any;
    let isExtensionUrlSpy: any;

    beforeEach(async () => {
        transformTabItemSpy = vi.spyOn(utilsIndex, 'transformTabItem');
        isExtensionUrlSpy = vi.spyOn(utilsIndex, 'isExtensionUrl');
    });

    afterEach(() => {
        transformTabItemSpy.mockRestore();
        isExtensionUrlSpy.mockRestore();
    });

    it('should load, filter, and transform tabs from BrowserTabs.query', async () => {
      isExtensionUrlSpy.mockImplementation((url: string) => url.startsWith('chrome://'));

      const result = await openedTabHandlers.loadTabs()

      expect(BrowserTabs.query).toHaveBeenCalledWith({}) // Default query
      
      // Check filtering: Tab with id 3 (chrome://extensions) should be filtered out
      expect(result.length).toBe(mockOpenedTabs.length - 1)
      expect(result.find(t => t.id === 3)).toBeUndefined()
      expect(isExtensionUrlSpy).toHaveBeenCalledTimes(mockOpenedTabs.length)

      // Check transformation (minimal check)
      expect(transformTabItemSpy).toHaveBeenCalledTimes(mockOpenedTabs.length - 1) // Only non-extension URLs
      const expectedTransformedTab = mockOpenedTabs.find(t => t.id === 1);
      expect(transformTabItemSpy).toHaveBeenCalledWith(expectedTransformedTab, 'lastAccessed');
      expect(result[0].id).toBe(1) // Transformed item still has id
    })

    it('should return an empty array if BrowserTabs.query returns empty', async () => {
      // @ts-ignore
      BrowserTabs.query.mockResolvedValue([])
      const result = await openedTabHandlers.loadTabs()
      expect(result).toEqual([])
      expect(transformTabItemSpy).not.toHaveBeenCalled()
    })
  })

  describe('clickItem()', () => {
    const itemToClick: TabItem<'opened'> = {
      id: 2, // Corresponds to mockOpenedTabs[1]
      title: 'Opened Tab 2',
      url: 'http://opened2.com',
      domain: 'opened2.com',
      favIconUrl: 'icon2.png',
      time: 'some time ago',
      type: 'opened',
      // @ts-ignore These are from chrome.tabs.Tab, expected by the handler
      windowId: 1,
      index: 1,
    }

    it('should update tab to active and focus its window', async () => {
      await openedTabHandlers.clickItem(itemToClick)

      expect(BrowserTabs.update).toHaveBeenCalledWith(itemToClick.id, { active: true }); // TabsApi.update is called with 2 arguments
      // @ts-ignore
      expect(global.browser.windows.update).toHaveBeenCalledWith(itemToClick.windowId, { focused: true }, expect.any(Function)); // browser.windows.update is called with 3
    })
    
    it('should handle errors from BrowserTabs.update gracefully', async () => {
        // @ts-ignore
        BrowserTabs.update.mockImplementationOnce((tabId, updateProps, callback) => {
            // @ts-ignore
            global.browser.runtime.lastError = { message: 'Failed to update tab' };
            if (callback) callback(undefined);
        });
        await expect(openedTabHandlers.clickItem(itemToClick)).resolves.toBeUndefined(); 
         // @ts-ignore
        expect(global.browser.windows.update).not.toHaveBeenCalled(); 
    });

    it('should handle errors from browser.windows.update gracefully', async () => {
        // This test relies on WindowsApi.update correctly handling lastError.
        // So, browser.windows.update mock should just set lastError and call the callback.
        // @ts-ignore
        global.browser.windows.update.mockImplementationOnce((id, props, cb) => {
          // @ts-ignore
          global.browser.runtime.lastError = { message: 'Failed to focus window' };
          if(cb) cb(undefined); 
        });
        await expect(openedTabHandlers.clickItem(itemToClick)).resolves.toBeUndefined();
    });
  })

  describe('removeItem()', () => {
    const itemToRemove: TabItem<'opened'> = {
      id: 1, // Corresponds to mockOpenedTabs[0]
      title: 'Opened Tab 1',
      url: 'http://opened1.com',
      domain: 'opened1.com',
      favIconUrl: 'icon1.png',
      time: 'some other time ago',
      type: 'opened',
      // @ts-ignore
      windowId: 1,
      // @ts-ignore
      index: 0,
    }

    it('should remove the tab using BrowserTabs.remove', async () => {
      await openedTabHandlers.removeItem(itemToRemove)
      expect(BrowserTabs.remove).toHaveBeenCalledWith(itemToRemove.id)
    })
    
    it('should handle errors from BrowserTabs.remove gracefully', async () => {
        // @ts-ignore
        BrowserTabs.remove.mockRejectedValueOnce(new Error('Failed to remove tab'));
        await expect(openedTabHandlers.removeItem(itemToRemove)).resolves.toBeUndefined(); // Assuming errors are caught and logged
    });
  })
})
