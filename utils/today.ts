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
      await TabsApi.create({ url: item.url })
    }
  },

  async removeItem(item) {
    await HistoryApi.delete(item.url!)
  },
}

async function getTodayHistory() {
  const startTime = new Date().setHours(0, 0, 0, 0)
  const history = await HistoryApi.search({
    text: '',
    startTime,
    maxResults: MAX_HISTORY_COUNT,
  })
  return history || []
}
