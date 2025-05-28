import { TabType, TabItemData } from './types'
/**
 * 生成随机ID
 */
export const randomId = () => Math.floor(Math.random() * Date.now()).toString(36)

/**
 * 判断是否为扩展页面
 */
export const isExtensionUrl = (url: string) => {
  if (typeof url !== 'string' || !url) return false;
  return url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('chrome-devtools://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('view-source:')
}
/**
 * 转义HTML, 防止XSS攻击
 */
export const escapeHTML = (str: string) => {
  if (typeof str !== 'string') return str as any; // Return as passed if not string
  if (!str) return ''; // Now this handles empty string after type check

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
export const formatRelativeTime = (time: number | string | null | undefined) => {
  if (time === null || time === undefined || Number.isNaN(new Date(time as any).getTime())) {
    return '';
  }
  const current = new Date(time as any).getTime();
  const diff = Math.floor((Date.now() - current) / 1000);

  // Handle future dates
  if (diff < 0) {
    const d = new Date(time as any);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  }

  if (diff < 60) return diff < 30 ? `a few seconds ago` : `${diff} seconds ago`; // Corrected "age" to "ago"
  if (diff < 3600) {
    const minute = Math.floor(diff / 60);
    return minute > 1 ? `${minute} minutes ago` : `a minute ago`;
  }
  if (diff < 86400) {
    const hour = Math.floor(diff / 3600);
    return hour > 1 ? `${hour} hours ago` : `an hour ago`;
  }
  if (diff < 604800) { // Less than 7 days
    const day = Math.floor(diff / 86400);
    return day > 1 ? `${day} days ago` : `a day ago`;
  }
  // Format for dates older than 7 days
  const d = new Date(time as any);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

/**
 * 从URL中获取域名
 */
export const getDomainFromUrl = (url: string) => {
  if (typeof url !== 'string') return ''; // Return empty string for non-string input
  try {
    const urlObj = new URL(url);
    // Keep 'www.' if it's the only part before a TLD (e.g., www.com is unlikely but technically possible)
    // or if the hostname is just 'www'.
    // A more common case is removing www. from www.example.com -> example.com
    // If hostname is 'www.example.com', result is 'example.com'
    // If hostname is 'example.com', result is 'example.com'
    // If hostname is 'www.bbc.co.uk', result is 'bbc.co.uk'
    const hostname = urlObj.hostname;
    if (hostname.startsWith('www.') && hostname.split('.').length > 2) {
        return hostname.substring(4);
    }
    return hostname;
  } catch (error) {
    // For invalid URLs that cannot be parsed by new URL(), return the original URL string
    // or a part of it if we can heuristically determine a "domain-like" part.
    // Current behavior returns url.split('?')[0], which might not be ideal.
    // Returning the original URL as per test expectation for "completely invalid..."
    return url; 
  }
}

export function transformTabItem<T extends TabType>(
  data: TabItemData<T>,
  timeKey: keyof TabItemData<T>
  // type: T // Add type parameter to include in the result
) {
  const title = data.title || data.url || ''; // Ensure title is at least empty string before escape
  const url = data.url || ''; // Ensure url is at least empty string for getDomainFromUrl

  return {
    ...data,
    favIconUrl: ('favIconUrl' in data && data.favIconUrl) ? data.favIconUrl : 'icon/32.png',
    title: escapeHTML(title),
    domain: getDomainFromUrl(url),
    time: formatRelativeTime(data[timeKey] as number),
    // type: type, // Add type to the transformed object
  };
}
