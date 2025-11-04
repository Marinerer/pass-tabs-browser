import { TabType, TabItem, SortType } from './types'
import { TAB_SORT_TYPE } from './const'
import StoreApi from './api/storage'

/**
 * 获取排序类型
 */
export async function getSortType() {
  const sortType = await StoreApi.get<SortType>(TAB_SORT_TYPE)
  return sortType || 'recent'
}

/**
 * 设置排序类型
 */
export async function setSortType(sortType: SortType) {
  if (!sortType) return
  await StoreApi.set(TAB_SORT_TYPE, sortType)
}

/**
 * 提取一级域名（主域名）
 * 例如: www.google.com -> google.com
 *       mail.google.com -> google.com
 *       github.com -> github.com
 */
function getBaseDomain(domain: string): string {
  if (!domain) return ''

  // 移除端口号
  const domainWithoutPort = domain.split(':')[0]

  // 分割域名
  const parts = domainWithoutPort.split('.')

  // 如果只有一段或两段，直接返回
  if (parts.length <= 2) {
    return domainWithoutPort
  }

  // 处理特殊的双层TLD（如 .co.uk, .com.cn, .net.cn 等）
  const doubleTLDs = ['co', 'com', 'net', 'org', 'gov', 'edu', 'ac']
  const lastPart = parts[parts.length - 1]
  const secondLastPart = parts[parts.length - 2]

  // 如果是双层TLD，取最后三段；否则取最后两段
  if (doubleTLDs.includes(secondLastPart) && parts.length > 2) {
    return parts.slice(-3).join('.')
  }

  // 默认取最后两段（一级域名 + 顶级域名）
  return parts.slice(-2).join('.')
}

/**
 * 按时间排序（最近的在前面）
 */
function sortByRecent<T extends TabType>(items: TabItem<T>[]): TabItem<T>[] {
  return items.slice().sort((a, b) => {
    // 根据不同的 tab 类型使用不同的时间字段
    const aTime = 'closedAt' in a ? a.closedAt : 'lastVisitTime' in a ? a.lastVisitTime || 0 : 0
    const bTime = 'closedAt' in b ? b.closedAt : 'lastVisitTime' in b ? b.lastVisitTime || 0 : 0
    return bTime - aTime
  })
}

/**
 * 按一级域名分组排序
 */
function sortByDomain<T extends TabType>(items: TabItem<T>[]): TabItem<T>[] {
  return items.slice().sort((a, b) => {
    // 提取一级域名
    const aBaseDomain = getBaseDomain(a.domain)
    const bBaseDomain = getBaseDomain(b.domain)

    // 先按一级域名排序
    const domainCompare = aBaseDomain.localeCompare(bBaseDomain)
    if (domainCompare !== 0) {
      return domainCompare
    }

    // 同一级域名下，再按完整域名排序（将子域名聚合）
    const subDomainCompare = a.domain.localeCompare(b.domain)
    if (subDomainCompare !== 0) {
      return subDomainCompare
    }

    // 同域名下按时间排序
    const aTime = 'closedAt' in a ? a.closedAt : 'lastVisitTime' in a ? a.lastVisitTime || 0 : 0
    const bTime = 'closedAt' in b ? b.closedAt : 'lastVisitTime' in b ? b.lastVisitTime || 0 : 0
    return bTime - aTime
  })
}

/**
 * 按标题字母顺序排序
 */
function sortByAlphabetical<T extends TabType>(items: TabItem<T>[]): TabItem<T>[] {
  return items.slice().sort((a, b) => {
    const titleA = (a.title || '').toLowerCase()
    const titleB = (b.title || '').toLowerCase()
    return titleA.localeCompare(titleB)
  })
}

/**
 * 对标签列表进行排序
 */
export function sortTabItems<T extends TabType>(
  items: TabItem<T>[],
  sortType: SortType
): TabItem<T>[] {
  if (!items || items.length === 0) {
    return items
  }

  switch (sortType) {
    case 'recent':
      return sortByRecent(items)
    case 'domain':
      return sortByDomain(items)
    case 'alphabetical':
      return sortByAlphabetical(items)
    default:
      return items
  }
}
