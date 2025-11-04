export const MAX_TABS_COUNT = 360 // 最大存储标签数量
export const MAX_HISTORY_COUNT = 500 // 查询最大历史记录数量
export const TAB_CLOSED_KEY = 'pass_closed_tabs' as const // 关闭标签存储键名
export const COLOR_THEME_KEY = 'pass_color_theme'
export const DEFAULT_TAB_TYPE = 'pass_tab_type' as const // 默认标签分类
export const TAB_SORT_TYPE = 'pass_tab_sort_type' as const // 标签排序类型

export const TABS_MAP = {
  closed: {
    title: '已关闭',
    text: 'Undo',
  },
  opened: {
    title: '已打开',
    text: 'Opened',
  },
  today: {
    title: '今日访问',
    text: 'Today',
  },
} as const

export const SORT_OPTIONS = {
  recent: {
    label: 'Recent',
    title: '按时间排序',
  },
  domain: {
    label: 'By domain',
    title: '按域名排序',
  },
  alphabetical: {
    label: 'Alphabetical',
    title: '按字母排序',
  },
} as const
