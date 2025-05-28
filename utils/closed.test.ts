import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { closedTabHandlers, saveClosedTab } from './closed' // Adjust path
import BrowserStorage from '@/utils/api/storage' // Adjust path
import BrowserTabs from '@/utils/api/tabs' // Adjust path
import * as utilsIndex from '@/utils/index' // To spy on transformTabItem, randomId
import { TAB_CLOSED_KEY, MAX_TABS_COUNT } from '@/utils/const' // Adjust path
import { TabClosedData, TabItem, TabMergedItem } from '@/utils/types' // Adjust path

// Mock dependencies
vi.mock('@/utils/api/storage')
vi.mock('@/utils/api/tabs')

describe('closedTabHandlers', () => {
  let mockClosedTabs: (TabClosedData & TabMergedItem)[]

  beforeEach(() => {
    vi.clearAllMocks()
    mockClosedTabs = [
      { id: 'c1', title: 'Closed Tab 1', url: 'http://closed1.com', closedAt: 1000, favIconUrl: '' },
      { id: 'c2', title: 'Closed Tab 2', url: 'http://closed2.com', closedAt: 2000, favIconUrl: '' },
      { id: 'c3', title: 'Closed Tab 3', url: 'http://closed3.com', closedAt: 500, favIconUrl: '' },
    ]
    // @ts-ignore
    BrowserStorage.get.mockResolvedValue(mockClosedTabs)
    // @ts-ignore
    BrowserStorage.set.mockResolvedValue(undefined)
    // @ts-ignore
    BrowserTabs.create.mockResolvedValue({ id: 123 } as chrome.tabs.Tab)
  })

  describe('loadTabs()', () => {
    it('should load, transform, and sort tabs from BrowserStorage', async () => {
      const transformTabItemSpy = vi.spyOn(utilsIndex, 'transformTabItem')
      
      const result = await closedTabHandlers.loadTabs()

      expect(BrowserStorage.get).toHaveBeenCalledWith(TAB_CLOSED_KEY)
      expect(transformTabItemSpy).toHaveBeenCalledTimes(mockClosedTabs.length)
      
      // Check sorting (closedAt descending)
      expect(result[0].closedAt).toBe(2000) // c2
      expect(result[1].closedAt).toBe(1000) // c1
      expect(result[2].closedAt).toBe(500)  // c3

      // Check transformation (minimal check, details are in transformTabItem.test.ts)
      expect(result[0].id).toBe('c2') // Transformed item still has id
      expect(transformTabItemSpy).toHaveBeenCalledWith(mockClosedTabs.find(t => t.id === 'c2'), 'closedAt')

      transformTabItemSpy.mockRestore()
    })

    it('should return an empty array if no data is stored', async () => {
      // @ts-ignore
      BrowserStorage.get.mockResolvedValue(null)
      const result = await closedTabHandlers.loadTabs()
      expect(result).toEqual([])
    })

    it('should return an empty array if stored data is empty', async () => {
      // @ts-ignore
      BrowserStorage.get.mockResolvedValue([])
      const result = await closedTabHandlers.loadTabs()
      expect(result).toEqual([])
    })
  })

  describe('clickItem()', () => {
    const itemToClick: TabItem<'closed'> = {
      id: 'c1',
      title: 'Closed Tab 1',
      url: 'http://closed1.com',
      closedAt: 1000,
      domain: 'closed1.com',
      favIconUrl: '',
      time: 'some time ago',
      type: 'closed',
    }

    it('should create a new tab and remove the item from storage', async () => {
      await closedTabHandlers.clickItem(itemToClick)

      expect(BrowserTabs.create).toHaveBeenCalledWith({ url: itemToClick.url })
      expect(BrowserStorage.get).toHaveBeenCalledWith(TAB_CLOSED_KEY)
      
      const expectedRemainingTabs = mockClosedTabs.filter(t => t.id !== itemToClick.id)
      expect(BrowserStorage.set).toHaveBeenCalledWith(TAB_CLOSED_KEY, expectedRemainingTabs)
    })

     it('should handle item not found in storage gracefully', async () => {
      const itemNotInStorage: TabItem<'closed'> = { ...itemToClick, id: 'c4' };
      await closedTabHandlers.clickItem(itemNotInStorage);

      expect(BrowserTabs.create).toHaveBeenCalledWith({ url: itemNotInStorage.url });
      expect(BrowserStorage.get).toHaveBeenCalledWith(TAB_CLOSED_KEY);
      // Set should be called with the original list if item not found
      expect(BrowserStorage.set).toHaveBeenCalledWith(TAB_CLOSED_KEY, mockClosedTabs);
    });
  })

  describe('removeItem()', () => {
    const itemToRemove: TabItem<'closed'> = {
      id: 'c1',
      title: 'Closed Tab 1',
      url: 'http://closed1.com',
      closedAt: 1000,
      domain: 'closed1.com',
      favIconUrl: '',
      time: 'some time ago',
      type: 'closed',
    }

    it('should remove the specified item from storage', async () => {
      await closedTabHandlers.removeItem(itemToRemove)

      expect(BrowserStorage.get).toHaveBeenCalledWith(TAB_CLOSED_KEY)
      const expectedRemainingTabs = mockClosedTabs.filter(t => t.id !== itemToRemove.id)
      expect(BrowserStorage.set).toHaveBeenCalledWith(TAB_CLOSED_KEY, expectedRemainingTabs)
    })

    it('should handle item not found in storage gracefully during remove', async () => {
      const itemNotInStorage: TabItem<'closed'> = { ...itemToRemove, id: 'c4' };
      await closedTabHandlers.removeItem(itemNotInStorage);

      expect(BrowserStorage.get).toHaveBeenCalledWith(TAB_CLOSED_KEY);
      // Set should be called with the original list if item not found
      expect(BrowserStorage.set).toHaveBeenCalledWith(TAB_CLOSED_KEY, mockClosedTabs);
    });
  })
})

describe('saveClosedTab()', () => {
  const tabInfo: chrome.tabs.Tab = {
    id: 101,
    url: 'http://originaltab.com',
    title: 'Original Tab',
    favIconUrl: 'http://originaltab.com/icon.png',
    index: 0, pinned: false, highlighted: false, windowId: 1, active: true, incognito: false, discarded: false, autoDiscardable: true
  }
  let randomIdSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    BrowserStorage.get.mockResolvedValue([]); // Start with empty closed tabs list
    // @ts-ignore
    BrowserStorage.set.mockResolvedValue(undefined);
    randomIdSpy = vi.spyOn(utilsIndex, 'randomId').mockReturnValue('randomId123');
    vi.setSystemTime(new Date(2024, 0, 15, 12, 0, 0).getTime()); // For consistent closedAt
  });

  afterEach(() => {
    randomIdSpy.mockRestore();
    vi.useRealTimers();
  });

  it('should save a new closed tab with generated id and current time', async () => {
    await saveClosedTab(tabInfo);

    expect(BrowserStorage.get).toHaveBeenCalledWith(TAB_CLOSED_KEY);
    expect(randomIdSpy).toHaveBeenCalled();
    
    const mockNow = new Date(2024, 0, 15, 12, 0, 0).getTime();
    const expectedSavedTab: Partial<TabClosedData & TabMergedItem> = {
      id: `${mockNow}-randomId123`, // Composite ID
      url: tabInfo.url,
      title: tabInfo.title,
      favIconUrl: tabInfo.favIconUrl,
      closedAt: new Date(2024, 0, 15, 12, 0, 0).getTime(),
    };

    expect(BrowserStorage.set).toHaveBeenCalledWith(
      TAB_CLOSED_KEY,
      expect.arrayContaining([expect.objectContaining(expectedSavedTab)])
    );
    const calls = (BrowserStorage.set as vi.Mock).mock.calls;
    expect(calls[0][1].length).toBe(1); // Ensure only one tab is in the list
  });

  it('should add to existing list of closed tabs', async () => {
    const existingTabs = [
      { id: 'old1', url: 'old.com', title: 'Old', closedAt: 100, favIconUrl: '' }
    ];
    // @ts-ignore
    BrowserStorage.get.mockResolvedValue(existingTabs);

    await saveClosedTab(tabInfo);

    const calls = (BrowserStorage.set as vi.Mock).mock.calls;
    expect(calls[0][1].length).toBe(2); // old1 + new tab
    // New tab is prepended, then list is sorted by closedAt desc.
    const mockNow = new Date(2024, 0, 15, 12, 0, 0).getTime();
    const newTabId = `${mockNow}-randomId123`;
    // The list is sorted by closedAt descending. Newest (mockNow) should be first.
    expect(calls[0][1][0]).toMatchObject({ id: newTabId, closedAt: mockNow });
    expect(calls[0][1][1]).toMatchObject({ id: 'old1' }); // Existing older tab
  });

  it(`should respect MAX_TABS_COUNT and remove oldest if list exceeds limit`, async () => {
    const fullExistingTabs: (TabClosedData & TabMergedItem)[] = [];
    for (let i = 0; i < MAX_TABS_COUNT; i++) {
      fullExistingTabs.push({ id: `tab${i}`, url: `url${i}`, title: `Title ${i}`, closedAt: 1000 + i * 100, favIconUrl: '' });
    }
    // Oldest tab is tab0 with closedAt: 1000
    // @ts-ignore
    BrowserStorage.get.mockResolvedValue([...fullExistingTabs]); // mutable copy

    await saveClosedTab(tabInfo); // This should make the list MAX_TABS_COUNT + 1 before trimming

    const calls = (BrowserStorage.set as vi.Mock).mock.calls;
    const savedList = calls[0][1] as (TabClosedData & TabMergedItem)[];
    
    expect(savedList.length).toBe(MAX_TABS_COUNT);
    expect(savedList.find(t => t.id === 'tab0')).toBeUndefined(); // Oldest should be removed
    const mockNow = new Date(2024, 0, 15, 12, 0, 0).getTime();
    const newTabId = `${mockNow}-randomId123`;
    expect(savedList.find(t => t.id === newTabId)).toBeDefined(); // Newest should be present
    // Verify the new tab is indeed the one with the latest closedAt time (which is now the first element)
    expect(savedList[0].id).toBe(newTabId);
  });

  it('should not save if tab URL is missing (as per current source logic)', async () => {
    const tabWithoutUrl = { ...tabInfo, url: undefined };
    await saveClosedTab(tabWithoutUrl);
    expect(BrowserStorage.set).not.toHaveBeenCalled();
  });
  
  it('should not save if tab URL is an extension URL', async () => {
    const extensionTabInfo = { ...tabInfo, url: 'chrome://extensions' };
    vi.spyOn(utilsIndex, 'isExtensionUrl').mockReturnValueOnce(true);
    await saveClosedTab(extensionTabInfo);
    expect(BrowserStorage.set).not.toHaveBeenCalled();
    (utilsIndex.isExtensionUrl as vi.Mock).mockRestore();
  });
});
