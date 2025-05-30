import { TabType, TabItemData } from './types'
/**
 * 生成随机ID
 */
export const randomId = () => Math.floor(Math.random() * Date.now()).toString(36)

/**
 * 判断是否为扩展页面
 */
export const isExtensionUrl = (url: string) =>
  url.startsWith('chrome://') ||
  url.startsWith('chrome-extension://') ||
  url.startsWith('chrome-devtools://') ||
  url.startsWith('edge://') ||
  url.startsWith('about:') ||
  url.startsWith('view-source:')

export function isLocalUrl(url: string) {
  try {
    const { hostname, protocol } = new URL(url)
    return (
      ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname) ||
      hostname.startsWith('192.168.') ||
      protocol === 'file:'
    )
  } catch (error) {
    return false
  }
}

/**
 * 转义HTML, 防止XSS攻击
 */
export const escapeHTML = (str: string) => {
  if (!str) return ''

  return str.replace(/[&<>'"]/g, (tag) => {
    const charsToReplace = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    }
    return charsToReplace[tag as keyof typeof charsToReplace]
  })
}

/**
 * 格式化相对时间
 */
export const formatRelativeTime = (time: number | string) => {
  const current = new Date(time).getTime()
  const diff = Math.floor((Date.now() - current) / 1000)
  if (diff < 60) return diff < 30 ? `a few seconds age` : `${diff} seconds ago`
  if (diff < 3600) {
    const minute = Math.floor(diff / 60)
    return minute > 1 ? `${minute} minutes ago` : `a minute ago`
  }
  if (diff < 86400) {
    const hour = Math.floor(diff / 3600)
    return hour > 1 ? `${hour} hours ago` : `an hour ago`
  }
  if (diff < 604800) {
    const day = Math.floor(diff / 86400)
    return day > 1 ? `${day} days ago` : `a day ago`
  }
  return new Date(time).toLocaleDateString()
}

/**
 * 从URL中获取域名
 */
export const getDomainFromUrl = (url: string) => {
  if (typeof url !== 'string') return ''
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch (error) {
    return url.split('?')[0]
  }
}

export function transformTabItem<T extends TabType>(
  data: TabItemData<T>,
  timeKey: keyof TabItemData<T>
) {
  return {
    ...data,
    //@ts-ignore
    favIconUrl: data.favIconUrl || 'icon/32.png', // HistoryItem 类型没有 favIconUrl
    title: escapeHTML(data.title || data.url!),
    domain: getDomainFromUrl(data.url!),
    time: formatRelativeTime(data[timeKey] as number),
  }
}

export function uniqueItem<T extends Record<string, any>>(arr: T[], key: keyof T = 'id') {
  if (!arr || !arr.length) return []

  const result: T[] = []
  const map = new Map()
  for (const item of arr) {
    if (!map.has(item[key])) {
      map.set(item[key], true)
      result.push(item)
    }
  }
  return result
}
