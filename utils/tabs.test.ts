import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getTabType, setTabType, clickTabItem, deleteTabItem, useTabsRender } from './tabs' // Adjust path
import StoreApi from '@/utils/api/storage'   // Mocked
import HistoryApi from '@/utils/api/history' // Mocked
import TabsApi from '@/utils/api/tabs'       // Mocked
import WindowsApi from '@/utils/api/windows'   // Mocked
import { TAB_CLOSED_KEY, DEFAULT_TAB_TYPE } from '@/utils/const'
import { TabType, TabItem, TabItemsHandlers } from '@/utils/types'

// Mock entire API modules
vi.mock('@/utils/api/storage')
vi.mock('@/utils/api/history')
vi.mock('@/utils/api/tabs')
vi.mock('@/utils/api/windows')

// Mock individual handlers that tabsMap would use
const mockClosedTabHandlers: TabItemsHandlers<'closed'> = {
  loadTabs: vi.fn(),
  clickItem: vi.fn(),
  removeItem: vi.fn(),
}
const mockOpenedTabHandlers: TabItemsHandlers<'opened'> = {
  loadTabs: vi.fn(),
  clickItem: vi.fn(),
  removeItem: vi.fn(),
}
const mockTodayTabHandlers: TabItemsHandlers<'today'> = {
  loadTabs: vi.fn(),
  clickItem: vi.fn(),
  removeItem: vi.fn(),
}

// Mock the tabsMap itself by dynamically importing and spying, or by directly mocking its usage.
// For simplicity in this environment, we'll assume tabsMap is an internal detail and
// test the exported functions that *use* it by mocking the handlers directly where needed.
// The actual `tabsMap` object is not directly exported or manipulated by `useTabsRender`'s consumers.
// Instead, useTabsRender accesses it internally. We can mock the handlers.

// We need to mock the internal `tabsMap` object.
// One way is to mock the modules it imports if they are used to construct it.
// Or, if `tabs.ts` itself exports `tabsMap` (it does not), we could spy on it.
// For now, we'll mock the handlers and assume they are correctly wired up.
// The clickTabItem and deleteTabItem exported functions will be tested against these mocks.

vi.mock('@/utils/closed', () => ({ closedTabHandlers: mockClosedTabHandlers }))
vi.mock('@/utils/opened', () => ({ openedTabHandlers: mockOpenedTabHandlers }))
vi.mock('@/utils/today', () => ({ todayTabHandlers: mockTodayTabHandlers }))


describe('Utility Functions in utils/tabs.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTabType()', () => {
    it('should retrieve the stored tab type from StoreApi', async () => {
      // @ts-ignore
      StoreApi.get.mockResolvedValue('opened')
      const result = await getTabType()
      expect(StoreApi.get).toHaveBeenCalledWith(DEFAULT_TAB_TYPE)
      expect(result).toBe('opened')
    })
  })

  describe('setTabType()', () => {
    it('should store the given tab type using StoreApi', async () => {
      await setTabType('closed')
      expect(StoreApi.set).toHaveBeenCalledWith(DEFAULT_TAB_TYPE, 'closed')
    })

    it('should not store if tab type is falsy', async () => {
      await setTabType(null as any)
      expect(StoreApi.set).not.toHaveBeenCalled()
      await setTabType(undefined as any)
      expect(StoreApi.set).not.toHaveBeenCalled()
    })
  })

  describe('clickTabItem() (exported helper)', () => {
    it('should call closedTabHandlers.clickItem for "closed" type', async () => {
      const item = { id: 'c1' } as TabItem<'closed'>
      await clickTabItem<'closed'>(item, 'closed')
      expect(mockClosedTabHandlers.clickItem).toHaveBeenCalledWith(item)
    })
    it('should call openedTabHandlers.clickItem for "opened" type', async () => {
      const item = { id: 1 } as TabItem<'opened'>
      await clickTabItem<'opened'>(item, 'opened')
      expect(mockOpenedTabHandlers.clickItem).toHaveBeenCalledWith(item)
    })
    it('should call todayTabHandlers.clickItem for "today" type', async () => {
      const item = { id: 'h1' } as TabItem<'today'>
      await clickTabItem<'today'>(item, 'today')
      expect(mockTodayTabHandlers.clickItem).toHaveBeenCalledWith(item)
    })

    it('should log error if handler method throws', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const item = { id: 'c1' } as TabItem<'closed'>
      // @ts-ignore
      mockClosedTabHandlers.clickItem.mockRejectedValueOnce(new Error('Test Click Error'))
      await clickTabItem<'closed'>(item, 'closed')
      expect(consoleErrorSpy).toHaveBeenCalledWith('[closedTabItemClick]:', expect.any(Error))
      consoleErrorSpy.mockRestore()
    })
  })

  describe('deleteTabItem() (exported helper)', () => {
     it('should call closedTabHandlers.removeItem for "closed" type', async () => {
      const item = { id: 'c1' } as TabItem<'closed'>
      await deleteTabItem<'closed'>(item, 'closed')
      expect(mockClosedTabHandlers.removeItem).toHaveBeenCalledWith(item)
    })
    it('should call openedTabHandlers.removeItem for "opened" type', async () => {
      const item = { id: 1 } as TabItem<'opened'>
      await deleteTabItem<'opened'>(item, 'opened')
      expect(mockOpenedTabHandlers.removeItem).toHaveBeenCalledWith(item)
    })
    it('should call todayTabHandlers.removeItem for "today" type', async () => {
      const item = { id: 'h1' } as TabItem<'today'>
      await deleteTabItem<'today'>(item, 'today')
      expect(mockTodayTabHandlers.removeItem).toHaveBeenCalledWith(item)
    })

    it('should log error if handler method throws', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const item = { id: 'c1' } as TabItem<'closed'>
      // @ts-ignore
      mockClosedTabHandlers.removeItem.mockRejectedValueOnce(new Error('Test Remove Error'))
      await deleteTabItem<'closed'>(item, 'closed')
      expect(consoleErrorSpy).toHaveBeenCalledWith('[closedTabItemDelete]:', expect.any(Error))
      consoleErrorSpy.mockRestore()
    })
  })

  describe('useTabsRender()', () => {
    const mockRenderFn = vi.fn()
    const initialTabType: TabType = 'opened'
    const mockInitialTabs: TabItem<'opened'>[] = [{ id: 1, title: 'Initial Tab', url: 'http://initial.com' } as TabItem<'opened'>]
    const mockClosedTabsData: TabItem<'closed'>[] = [{ id: 'c1', title: 'Closed Tab 1', url: 'http://c1.com'} as TabItem<'closed'>]

    beforeEach(() => {
      mockRenderFn.mockClear()
      // @ts-ignore
      mockOpenedTabHandlers.loadTabs.mockResolvedValue([...mockInitialTabs])
      // @ts-ignore
      mockClosedTabHandlers.loadTabs.mockResolvedValue([...mockClosedTabsData])
      // @ts-ignore
      mockTodayTabHandlers.loadTabs.mockResolvedValue([]) // Default to empty for today
    })

    it('should call loadTabs for activeTab and render on initialization', async () => {
      const { renderTabs } = useTabsRender<'opened'>(initialTabType, mockRenderFn)
      // Need to wait for the initial renderTabs call within useTabsRender to complete
      await vi.waitUntil(() => mockOpenedTabHandlers.loadTabs.mock.calls.length > 0);
      await vi.waitUntil(() => mockRenderFn.mock.calls.length > 0);


      expect(mockOpenedTabHandlers.loadTabs).toHaveBeenCalled()
      expect(mockRenderFn).toHaveBeenCalledWith(mockInitialTabs)
    })

    describe('returned renderTabs(tabType)', () => {
      it('should load and render tabs for the specified tabType and update activeTab', async () => {
        const { renderTabs } = useTabsRender<'opened'>(initialTabType, mockRenderFn)
        // Wait for initial render
        await vi.waitUntil(() => mockRenderFn.mock.calls.length > 0);
        mockRenderFn.mockClear(); // Clear after initial render

        await renderTabs('closed')
        expect(mockClosedTabHandlers.loadTabs).toHaveBeenCalled()
        expect(mockRenderFn).toHaveBeenCalledWith(mockClosedTabsData)
        // activeTab state is internal to useTabsRender, but its effect is seen in event listeners
      })
    })

    describe('returned searchTabs(keyword, tabType)', () => {
      const searchOpenedTabs: TabItem<'opened'>[] = [
        { id: 1, title: 'Apple Page', url: 'http://apple.com' } as TabItem<'opened'>,
        { id: 2, title: 'Banana Site', url: 'http://banana.com' } as TabItem<'opened'>,
        { id: 3, title: 'Another Apple', url: 'http://anotherapple.com' } as TabItem<'opened'>,
      ]
      beforeEach(() => {
        // @ts-ignore
        mockOpenedTabHandlers.loadTabs.mockResolvedValue([...searchOpenedTabs])
      })

      it('should render all items for tabType if keyword is empty', async () => {
        const { searchTabs, renderTabs: initialRender } = useTabsRender<'opened'>('opened', mockRenderFn)
        await vi.waitUntil(() => mockRenderFn.mock.calls.length > 0); // Wait for initial load
        mockRenderFn.mockClear()

        await searchTabs('', 'opened')
        expect(mockRenderFn).toHaveBeenCalledWith(searchOpenedTabs, true)
      })
      
      it('should filter items by title/url for matching keyword', async () => {
        const { searchTabs, renderTabs: initialRender } = useTabsRender<'opened'>('opened', mockRenderFn)
        await vi.waitUntil(() => mockRenderFn.mock.calls.length > 0);
        mockRenderFn.mockClear()
        
        await searchTabs('apple', 'opened')
        const expectedFiltered = searchOpenedTabs.filter(t => t.title?.toLowerCase().includes('apple') || t.url?.toLowerCase().includes('apple'))
        expect(mockRenderFn).toHaveBeenCalledWith(expectedFiltered, true)
      })

      it('should render empty list for non-matching keyword', async () => {
        const { searchTabs, renderTabs: initialRender } = useTabsRender<'opened'>('opened', mockRenderFn)
        await vi.waitUntil(() => mockRenderFn.mock.calls.length > 0);
        mockRenderFn.mockClear()

        await searchTabs('xyznonexistent', 'opened')
        expect(mockRenderFn).toHaveBeenCalledWith([], true)
      })

      it('should call loadTabs if data for tabType is not cached', async () => {
        // @ts-ignore
        mockClosedTabHandlers.loadTabs.mockClear(); // Ensure it hasn't been called yet for 'closed'
        const { searchTabs } = useTabsRender<'opened'>('opened', mockRenderFn) // Initialized with 'opened'
        await vi.waitUntil(() => mockRenderFn.mock.calls.length > 0); // Wait for initial load of 'opened'
        mockRenderFn.mockClear()

        await searchTabs('test', 'closed') // Search on 'closed' type
        expect(mockClosedTabHandlers.loadTabs).toHaveBeenCalled()
        expect(mockRenderFn).toHaveBeenCalledWith(expect.any(Array), true)
      })
    })

    describe('returned clickTabItem(itemIdOrObject, tabType)', () => {
      const itemToClick = { id: 1, title: 'Test Tab', url: 'http://test.com' } as TabItem<'opened'>;
      beforeEach(() => {
        // @ts-ignore
        mockOpenedTabHandlers.loadTabs.mockResolvedValue([itemToClick]); // Ensure cache can be populated
        // @ts-ignore
        mockOpenedTabHandlers.clickItem.mockClear();
      });

      it('should call handler.clickItem with full item if ID string is provided (cache miss)', async () => {
        const { clickTabItem: hookClick, renderTabs: initialRender } = useTabsRender<'opened'>('opened', mockRenderFn);
        // Initial render to populate cache for 'opened'
        await vi.waitUntil(() => mockOpenedTabHandlers.loadTabs.mock.calls.length > 0);
        
        await hookClick('1', 'opened');
        expect(mockOpenedTabHandlers.clickItem).toHaveBeenCalledWith(itemToClick);
      });
      
      it('should call handler.clickItem with full item if ID string is provided (cache hit)', async () => {
        const { clickTabItem: hookClick, renderTabs: initialRender } = useTabsRender<'opened'>('opened', mockRenderFn);
        await initialRender('opened'); // Ensure cache is populated for 'opened'
        await vi.waitUntil(() => mockOpenedTabHandlers.loadTabs.mock.calls.length > 0);
        (mockOpenedTabHandlers.loadTabs as vi.Mock).mockClear(); // Clear after population

        await hookClick('1', 'opened');
        expect(mockOpenedTabHandlers.loadTabs).not.toHaveBeenCalled(); // Should not load again if cache hit
        expect(mockOpenedTabHandlers.clickItem).toHaveBeenCalledWith(itemToClick);
      });

      it('should call handler.clickItem directly if full TabItem object is provided', async () => {
        const { clickTabItem: hookClick } = useTabsRender<'opened'>('opened', mockRenderFn);
        await hookClick(itemToClick, 'opened');
        expect(mockOpenedTabHandlers.clickItem).toHaveBeenCalledWith(itemToClick);
      });
    })
    
    describe('returned deleteTabItem(itemIdOrObject, tabType)', () => {
      const itemToDelete = { id: 1, title: 'Delete Me', url: 'http://delete.com' } as TabItem<'opened'>;
       beforeEach(() => {
        // @ts-ignore
        mockOpenedTabHandlers.loadTabs.mockResolvedValue([itemToDelete]);
        // @ts-ignore
        mockOpenedTabHandlers.removeItem.mockClear();
      });

      it('should call handler.removeItem with full item if ID string is provided (cache populated)', async () => {
        const { deleteTabItem: hookDelete, renderTabs: initialRender } = useTabsRender<'opened'>('opened', mockRenderFn);
        await initialRender('opened'); // Populate cache
        await vi.waitUntil(() => mockOpenedTabHandlers.loadTabs.mock.calls.length > 0);
        
        await hookDelete('1', 'opened');
        expect(mockOpenedTabHandlers.removeItem).toHaveBeenCalledWith(itemToDelete);
      });
      
      it('should call handler.removeItem directly if full TabItem object is provided', async () => {
        const { deleteTabItem: hookDelete } = useTabsRender<'opened'>('opened', mockRenderFn);
        await hookDelete(itemToDelete, 'opened');
        expect(mockOpenedTabHandlers.removeItem).toHaveBeenCalledWith(itemToDelete);
      });
    })

    describe('Event Listener Callbacks (onChangedData)', () => {
      let storeChangedCallback: ((changes: any, area: string) => void) | undefined = undefined;
      let historyRemovedCallback: ((removedInfo: any) => void) | undefined = undefined;
      let tabsRemovedCallback: ((tabId: number) => void) | undefined = undefined;
      let windowsRemovedCallback: ((windowId: number) => void) | undefined = undefined;

      beforeEach(() => {
        // Capture the callbacks registered by onChangedData
        // @ts-ignore
        StoreApi.onChanged.mockImplementation(cb => { storeChangedCallback = cb; });
        // @ts-ignore
        HistoryApi.onRemoved.mockImplementation(cb => { historyRemovedCallback = cb; });
        // @ts-ignore
        TabsApi.onRemoved.mockImplementation(cb => { tabsRemovedCallback = cb; });
        // @ts-ignore
        WindowsApi.onRemoved.mockImplementation(cb => { windowsRemovedCallback = cb; });
      });
      
      it('StoreApi.onChanged should trigger renderTabs if activeTab is "closed" and key matches', async () => {
        const { renderTabs: hookRenderTabs } = useTabsRender<'closed'>('closed', mockRenderFn);
        await vi.waitUntil(() => mockClosedTabHandlers.loadTabs.mock.calls.length > 0);
        mockRenderFn.mockClear();
        (mockClosedTabHandlers.loadTabs as vi.Mock).mockClear();

        expect(storeChangedCallback).toBeDefined();
        storeChangedCallback!({ [TAB_CLOSED_KEY]: { oldValue: [], newValue: [] } }, 'local');
        
        // Wait for the async renderTabs within the event handler
        await vi.waitUntil(() => (mockClosedTabHandlers.loadTabs as vi.Mock).mock.calls.length > 0);
        expect(mockClosedTabHandlers.loadTabs).toHaveBeenCalled();
        expect(mockRenderFn).toHaveBeenCalled();
      });

      it('HistoryApi.onRemoved should trigger renderTabs if activeTab is "today"', async () => {
        const { renderTabs: hookRenderTabs } = useTabsRender<'today'>('today', mockRenderFn);
        await vi.waitUntil(() => mockTodayTabHandlers.loadTabs.mock.calls.length > 0);
        mockRenderFn.mockClear();
        (mockTodayTabHandlers.loadTabs as vi.Mock).mockClear();
        
        expect(historyRemovedCallback).toBeDefined();
        historyRemovedCallback!({ allHistory: true });
        await vi.waitUntil(() => (mockTodayTabHandlers.loadTabs as vi.Mock).mock.calls.length > 0);
        expect(mockTodayTabHandlers.loadTabs).toHaveBeenCalled();
        expect(mockRenderFn).toHaveBeenCalled();
      });
      
      it('TabsApi.onRemoved should trigger renderTabs if activeTab is "opened"', async () => {
        const { renderTabs: hookRenderTabs } = useTabsRender<'opened'>('opened', mockRenderFn);
        await vi.waitUntil(() => mockOpenedTabHandlers.loadTabs.mock.calls.length > 0);
        mockRenderFn.mockClear();
        (mockOpenedTabHandlers.loadTabs as vi.Mock).mockClear();
        
        expect(tabsRemovedCallback).toBeDefined();
        tabsRemovedCallback!(123);
        await vi.waitUntil(() => (mockOpenedTabHandlers.loadTabs as vi.Mock).mock.calls.length > 0);
        expect(mockOpenedTabHandlers.loadTabs).toHaveBeenCalled();
        expect(mockRenderFn).toHaveBeenCalled();
      });

      it('WindowsApi.onRemoved should trigger renderTabs if activeTab is "opened"', async () => {
        const { renderTabs: hookRenderTabs } = useTabsRender<'opened'>('opened', mockRenderFn);
        await vi.waitUntil(() => mockOpenedTabHandlers.loadTabs.mock.calls.length > 0);
        mockRenderFn.mockClear();
        (mockOpenedTabHandlers.loadTabs as vi.Mock).mockClear();
        
        expect(windowsRemovedCallback).toBeDefined();
        windowsRemovedCallback!(1);
        await vi.waitUntil(() => (mockOpenedTabHandlers.loadTabs as vi.Mock).mock.calls.length > 0);
        expect(mockOpenedTabHandlers.loadTabs).toHaveBeenCalled();
        expect(mockRenderFn).toHaveBeenCalled();
      });
    })
  })
})
