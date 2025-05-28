import TabsApi from './api/tabs'
import WindowsApi from './api/windows'
import type { TabItemsHandlers } from './types'
import { transformTabItem } from './index'
import * as utilsIndex from './index'; // Moved import to top

export const openedTabHandlers: TabItemsHandlers<'opened'> = {
  async loadTabs() {
    const tabs = await getOpenedTabs();
    // Filter out extension URLs before mapping
    return tabs.filter(tab => tab.url && !utilsIndex.isExtensionUrl(tab.url))
               .map((item) => transformTabItem<'opened'>(item, 'lastAccessed'));
  },

  async clickItem(item) {
    try {
      await switchTab(item as chrome.tabs.Tab); // Cast item to chrome.tabs.Tab
    } catch (e) {
      console.error('[openedTabHandlers.clickItem]: Error switching tab.', e);
    }
  },

  async removeItem(item) {
    if (!item.id) return; // Ensure item.id exists before trying to remove
    try {
      await TabsApi.remove(item.id!);
    } catch (e) {
      console.error('[openedTabHandlers.removeItem]: Error removing tab.', e);
    }
  },
}

async function getOpenedTabs() {
  const tabs = await TabsApi.query({});
  // Filter out extension URLs is now done in the handler directly using getOpenedTabs
  return tabs || [];
}

async function switchTab(tab: chrome.tabs.Tab) {
  if (!tab?.id) return;
  try {
    // 切换标签页
    await TabsApi.update(tab.id, { active: true });
    // 切换窗口
    const WINDOW_ID_NONE = -1; 
    if (tab.windowId !== WINDOW_ID_NONE && tab.windowId !== undefined) { 
        await WindowsApi.update(tab.windowId, { focused: true });
    }
  } catch (e) {
    console.error('[switchTab]: Failed to switch tab or focus window.', e);
    throw e; 
  }
}
