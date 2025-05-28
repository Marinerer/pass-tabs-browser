import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { todayTabHandlers } from './today' // Adjust path
import HistoryApi from '@/utils/api/history' // Adjust path
import BrowserTabs from '@/utils/api/tabs' // Adjust path
import * as utilsIndex from '@/utils/index' // To spy on transformTabItem
import { TabItem, TabTodayData, TabMergedItem } from '@/utils/types' // Adjust path

// Mock dependencies
vi.mock('@/utils/api/history')
vi.mock('@/utils/api/tabs')

describe('todayTabHandlers', () => {
  let mockHistoryItems: chrome.history.HistoryItem[]
  const todayBaseTime = new Date(2024, 0, 15, 12, 0, 0).getTime(); // Jan 15, 2024, 12:00:00 PM

  beforeEach(() => {
    vi.clearAllMocks()
    vi.setSystemTime(todayBaseTime); // Set "current" time for "today" calculation

    mockHistoryItems = [
      { id: 'h1', url: 'http://today1.com', title: 'Today Visit 1', lastVisitTime: todayBaseTime - 1 * 60 * 60 * 1000 }, // 11 AM today
      { id: 'h2', url: 'http://today2.com', title: 'Today Visit 2', lastVisitTime: todayBaseTime - 2 * 60 * 60 * 1000 }, // 10 AM today
      { id: 'h3', url: 'http://yesterday.com', title: 'Yesterday Visit', lastVisitTime: todayBaseTime - 25 * 60 * 60 * 1000 }, // Yesterday
      { id: 'h4', url: 'http://today1.com', title: 'Today Visit 1 Duplicate', lastVisitTime: todayBaseTime - 30 * 60 * 1000 }, // 11:30 AM today, duplicate URL of h1
    ]
    // @ts-ignore
    HistoryApi.search.mockImplementation(async (query) => {
      const sTime = query.startTime!;
      // Use a fresh copy of mockHistoryItems for filtering to avoid test side-effects
      const currentMockItems = JSON.parse(JSON.stringify(mockHistoryItems)) as chrome.history.HistoryItem[];
      return currentMockItems.filter(item => item.lastVisitTime! >= sTime);
    });
    // @ts-ignore
    BrowserTabs.create.mockResolvedValue({ id: 123 } as chrome.tabs.Tab)
    // @ts-ignore
    HistoryApi.delete.mockResolvedValue(undefined) // Mock for HistoryApi.deleteUrl
  })

  afterEach(() => {
    vi.useRealTimers(); // Restore real timers
  });

  describe('loadTabs()', () => {
    let transformTabItemSpy: any;

    beforeEach(async () => {
        transformTabItemSpy = vi.spyOn(utilsIndex, 'transformTabItem');
    });

    afterEach(() => {
        transformTabItemSpy.mockRestore();
    });

    it('should load, filter for today, deduplicate, transform, and sort tabs', async () => {
      const result = await todayTabHandlers.loadTabs()

      expect(HistoryApi.search).toHaveBeenCalledWith({ text: '', maxResults: 500, startTime: new Date(2024, 0, 15, 0, 0, 0).getTime() })
      
      // Filtering for today: h1, h2, h4 should be considered. h3 (yesterday) should be out.
      // Deduplication: h1 and h4 have same URL. The one with later lastVisitTime (h4) should be kept.
      expect(result.length).toBe(2) // h2 and h4 (as h4 is later than h1 for same URL)
      
      // Sorting: By lastVisitTime descending. h4 (11:30 AM) then h2 (10 AM)
      expect(result[0].id).toBe('h4')
      expect(result[1].id).toBe('h2')
      
      expect(transformTabItemSpy).toHaveBeenCalledTimes(2);
      // Find from the original, non-cloned array for stable reference if needed for deep object containing checks
      const rawH4 = mockHistoryItems.find(item => item.id === 'h4'); 
      expect(transformTabItemSpy).toHaveBeenCalledWith(expect.objectContaining(rawH4), 'lastVisitTime');
    })

    it('should return an empty array if HistoryApi.search returns empty', async () => {
      // @ts-ignore
      HistoryApi.search.mockImplementation(async () => []); // Explicitly return empty for this test
      const result = await todayTabHandlers.loadTabs();
      expect(result).toEqual([]);
      expect(transformTabItemSpy).not.toHaveBeenCalled();
    })

    it('should return an empty array if no items are from today', async () => {
      const yesterdayItemsOnly: chrome.history.HistoryItem[] = [
        { id: 'h3', url: 'http://yesterday.com', title: 'Yesterday Visit', lastVisitTime: todayBaseTime - 25 * 60 * 60 * 1000 } 
      ];
      // @ts-ignore
      HistoryApi.search.mockImplementation(async (query) => { // Use mockImplementation for this specific test
        const sTime = query.startTime!;
        // This mock will now correctly filter based on the query's startTime
        return yesterdayItemsOnly.filter(item => item.lastVisitTime! >= sTime);
      });
      const result = await todayTabHandlers.loadTabs();
      expect(result).toEqual([]);
    });
  })

  describe('clickItem()', () => {
    const itemToClick: TabItem<'today'> = {
      id: 'h1',
      title: 'Today Visit 1',
      url: 'http://today1.com',
      domain: 'today1.com',
      favIconUrl: '',
      time: 'some time ago',
      type: 'today',
      lastVisitTime: todayBaseTime - 1 * 60 * 60 * 1000,
    }

    it('should create a new tab with the item URL', async () => {
      await todayTabHandlers.clickItem(itemToClick)
      expect(BrowserTabs.create).toHaveBeenCalledWith({ url: itemToClick.url })
    })
    
    it('should handle errors from BrowserTabs.create gracefully', async () => {
        // @ts-ignore
        BrowserTabs.create.mockRejectedValueOnce(new Error('Failed to create tab'));
        await expect(todayTabHandlers.clickItem(itemToClick)).resolves.toBeUndefined(); // Assuming errors are caught and logged
    });
  })

  describe('removeItem()', () => {
    const itemToRemove: TabItem<'today'> = {
      id: 'h1',
      title: 'Today Visit 1',
      url: 'http://today1.com', // URL must be defined for HistoryApi.delete
      domain: 'today1.com',
      favIconUrl: '',
      time: 'some other time ago',
      type: 'today',
      lastVisitTime: todayBaseTime - 1 * 60 * 60 * 1000,
    }

    it('should remove the URL from history using HistoryApi.delete', async () => {
      await todayTabHandlers.removeItem(itemToRemove)
      expect(HistoryApi.delete).toHaveBeenCalledWith(itemToRemove.url!)
    })

    it('should not call HistoryApi.delete if item URL is missing', async () => {
      const itemWithoutUrl: TabItem<'today'> = { ...itemToRemove, url: undefined };
      await todayTabHandlers.removeItem(itemWithoutUrl);
      expect(HistoryApi.delete).not.toHaveBeenCalled();
    });
    
    it('should handle errors from HistoryApi.delete gracefully', async () => {
        // @ts-ignore
        HistoryApi.delete.mockRejectedValueOnce(new Error('Failed to delete history'));
        await expect(todayTabHandlers.removeItem(itemToRemove)).resolves.toBeUndefined(); // Assuming errors are caught and logged
    });
  })
})
