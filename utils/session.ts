import StoreApi from './api/storage'
import TabsApi from './api/tabs'
import WindowsApi from './api/windows'
import { randomId, isExtensionUrl, isLocalUrl, transformTabItem } from './helpers'

const SESSIONS_KEY = 'pass_sessions' as const // Session集合存储键名
const AUTO_SAVE_SESSION_KEY = 'pass_auto_save_session' as const // 自动保存的 Session 存储键名
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000 // 自动保存间隔(5分钟)

// Session 相关类型定义
export interface SessionTabData {
  id: string
  title: string
  url: string
  favIconUrl: string
  windowId: number
}

export interface SessionData {
  id: string
  name: string
  description?: string
  createdAt: number
  updatedAt: number
  tabs: SessionTabData[]
  windowsCount: number
}

export interface AutoSaveSessionData {
  timestamp: number
  tabs: SessionTabData[]
  isAbnormalClose: boolean
}

export const sessionTabHandlers = {
  async loadTabs() {
    // Session 标签页由 Session 管理页面单独处理
    return []
  },

  async clickItem(item: any): Promise<void> {
    // 打开单个标签
    await TabsApi.create({ url: item.url })
  },

  async removeItem(item: any): Promise<void> {
    // Session 标签页的删除由 Session 管理页面处理
  },
}

/**
 * 获取所有 Session
 */
export async function getSessions(): Promise<SessionData[]> {
  const sessions = await StoreApi.get<SessionData[]>(SESSIONS_KEY)
  return sessions || []
}

/**
 * 保存 Session 列表
 */
export async function saveSessions(sessions: SessionData[]): Promise<void> {
  await StoreApi.set(SESSIONS_KEY, sessions)
}

/**
 * 创建新 Session
 */
export async function createSession(name: string, description?: string): Promise<SessionData> {
  const tabs = await TabsApi.query({})
  const validTabs = tabs.filter((tab) => tab.url && !isExtensionUrl(tab.url))

  // 统计窗口数量
  const windowIds = new Set(validTabs.map((tab) => tab.windowId))

  const sessionTabs: SessionTabData[] = validTabs.map((tab) => ({
    id: `${Date.now()}-${randomId()}`,
    title: tab.title || tab.url || '',
    url: tab.url || '',
    favIconUrl: tab.favIconUrl || 'icon/32.png',
    windowId: tab.windowId,
  }))

  const now = Date.now()
  const session: SessionData = {
    id: `session-${now}-${randomId()}`,
    name,
    description,
    createdAt: now,
    updatedAt: now,
    tabs: sessionTabs,
    windowsCount: windowIds.size,
  }

  const sessions = await getSessions()
  sessions.unshift(session)
  await saveSessions(sessions)

  return session
}

/**
 * 更新 Session
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<Pick<SessionData, 'name' | 'description' | 'tabs'>>
): Promise<void> {
  const sessions = await getSessions()
  const index = sessions.findIndex((s) => s.id === sessionId)

  if (index === -1) return

  sessions[index] = {
    ...sessions[index],
    ...updates,
    updatedAt: Date.now(),
  }

  await saveSessions(sessions)
}

/**
 * 删除 Session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const sessions = await getSessions()
  const newSessions = sessions.filter((s) => s.id !== sessionId)
  await saveSessions(newSessions)
}

/**
 * 恢复 Session（打开所有标签页）
 */
export async function restoreSession(sessionId: string, openInNewWindow = false): Promise<void> {
  const sessions = await getSessions()
  const session = sessions.find((s) => s.id === sessionId)

  if (!session || !session.tabs.length) return

  try {
    if (openInNewWindow) {
      // 按窗口分组恢复
      const tabsByWindow = new Map<number, SessionTabData[]>()
      session.tabs.forEach((tab) => {
        if (!tabsByWindow.has(tab.windowId)) {
          tabsByWindow.set(tab.windowId, [])
        }
        tabsByWindow.get(tab.windowId)!.push(tab)
      })

      // 为每个窗口创建新窗口
      for (const [, tabs] of tabsByWindow) {
        const urls = tabs.map((tab) => tab.url)
        await WindowsApi.create({ url: urls })
      }
    } else {
      // 在当前窗口打开所有标签
      for (const tab of session.tabs) {
        await TabsApi.create({ url: tab.url })
      }
    }
  } catch (e) {
    console.error('[restoreSession]:', e)
  }
}

/**
 * 从 Session 中删除指定标签
 */
export async function removeTabFromSession(sessionId: string, tabId: string): Promise<void> {
  const sessions = await getSessions()
  const session = sessions.find((s) => s.id === sessionId)

  if (!session) return

  session.tabs = session.tabs.filter((tab) => tab.id !== tabId)
  session.updatedAt = Date.now()

  await saveSessions(sessions)
}

/**
 * 自动保存当前会话
 */
export async function autoSaveCurrentSession(isAbnormalClose = false): Promise<void> {
  const tabs = await TabsApi.query({})
  const validTabs = tabs.filter((tab) => tab.url && !isExtensionUrl(tab.url))

  const sessionTabs: SessionTabData[] = validTabs.map((tab) => ({
    id: `${Date.now()}-${randomId()}`,
    title: tab.title || tab.url || '',
    url: tab.url || '',
    favIconUrl: tab.favIconUrl || 'icon/32.png',
    windowId: tab.windowId,
  }))

  const autoSaveData: AutoSaveSessionData = {
    timestamp: Date.now(),
    tabs: sessionTabs,
    isAbnormalClose,
  }

  await StoreApi.set(AUTO_SAVE_SESSION_KEY, autoSaveData)
}

/**
 * 获取自动保存的会话
 */
export async function getAutoSavedSession(): Promise<AutoSaveSessionData | null> {
  const data = await StoreApi.get<AutoSaveSessionData>(AUTO_SAVE_SESSION_KEY)
  return data || null
}

/**
 * 清除自动保存的会话
 */
export async function clearAutoSavedSession(): Promise<void> {
  await StoreApi.remove(AUTO_SAVE_SESSION_KEY)
}

/**
 * 恢复自动保存的会话
 */
export async function restoreAutoSavedSession(): Promise<void> {
  const autoSaved = await getAutoSavedSession()
  if (!autoSaved || !autoSaved.tabs.length) return

  try {
    // 按窗口分组恢复
    const tabsByWindow = new Map<number, SessionTabData[]>()
    autoSaved.tabs.forEach((tab) => {
      if (!tabsByWindow.has(tab.windowId)) {
        tabsByWindow.set(tab.windowId, [])
      }
      tabsByWindow.get(tab.windowId)!.push(tab)
    })

    // 为每个窗口创建新窗口
    for (const [, tabs] of tabsByWindow) {
      const urls = tabs.map((tab) => tab.url)
      await WindowsApi.create({ url: urls })
    }

    // 清除自动保存的数据
    await clearAutoSavedSession()
  } catch (e) {
    console.error('[restoreAutoSavedSession]:', e)
  }
}
