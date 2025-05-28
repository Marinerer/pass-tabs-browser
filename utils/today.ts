import { MAX_HISTORY_COUNT } from './const'
import HistoryApi from './api/history'
import TabsApi from './api/tabs'
import type { TabItemsHandlers } from './types'
import { transformTabItem } from './index'

export const todayTabHandlers: TabItemsHandlers<'today'> = {
  async loadTabs() {
    const history = await getTodayHistory()
    return history.map((item) => transformTabItem<'today'>(item, 'lastVisitTime'))
  },

  async clickItem(item) {
    if (item?.url) {
      try {
        await TabsApi.create({ url: item.url });
      } catch (e) {
        console.error('[todayTabHandlers.clickItem]: Failed to create tab.', e);
      }
    }
  },

  async removeItem(item) {
    if (!item.url) return; // Guard against missing URL
    try {
      await HistoryApi.delete(item.url!);
    } catch (e) {
      console.error('[todayTabHandlers.removeItem]: Failed to delete history.', e);
    }
  },
}

async function getTodayHistory() {
  const startTime = new Date().setHours(0, 0, 0, 0)
  const history = await HistoryApi.search({
    text: '',
    startTime,
    maxResults: MAX_HISTORY_COUNT,
  });

  if (!history || history.length === 0) {
    return [];
  }

  // Deduplicate by URL, keeping the most recent visit
  const uniqueTabs = new Map<string, chrome.history.HistoryItem>();
  for (const item of history) {
    if (!item.url) continue; // Skip items without URL for deduplication key
    const existing = uniqueTabs.get(item.url);
    if (!existing || (item.lastVisitTime && existing.lastVisitTime && item.lastVisitTime > existing.lastVisitTime)) {
      uniqueTabs.set(item.url, item);
    }
  }
  return Array.from(uniqueTabs.values());
}
