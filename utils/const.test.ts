import { describe, it, expect } from 'vitest'
import * as constants from './const' // Adjust path as necessary

describe('Constants', () => {
  it('should have MAX_TABS_COUNT defined correctly', () => {
    expect(constants.MAX_TABS_COUNT).toBe(360)
  })

  it('should have MAX_HISTORY_COUNT defined correctly', () => {
    expect(constants.MAX_HISTORY_COUNT).toBe(500)
  })

  it('should have TAB_CLOSED_KEY defined correctly', () => {
    expect(constants.TAB_CLOSED_KEY).toBe('pass_closed_tabs')
  })

  it('should have COLOR_THEME_KEY defined correctly', () => {
    expect(constants.COLOR_THEME_KEY).toBe('pass_color_theme')
  })

  it('should have DEFAULT_TAB_TYPE defined correctly', () => {
    expect(constants.DEFAULT_TAB_TYPE).toBe('pass_tab_type')
  })

  it('should have SETTINGS_MAX_STORED_TABS_KEY defined correctly', () => {
    expect(constants.SETTINGS_MAX_STORED_TABS_KEY).toBe('settings_max_stored_tabs')
  })

  it('should have SETTINGS_CHROME_SYNC_ENABLED_KEY defined correctly', () => {
    expect(constants.SETTINGS_CHROME_SYNC_ENABLED_KEY).toBe('settings_chrome_sync_enabled')
  })

  it('should have TABS_MAP defined correctly', () => {
    expect(constants.TABS_MAP).toEqual({
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
    })
  })

  // Verify that keys are unique if that's an implicit requirement
  it('all storage keys should be unique', () => {
    const keys = [
      constants.TAB_CLOSED_KEY,
      constants.COLOR_THEME_KEY,
      constants.DEFAULT_TAB_TYPE,
      constants.SETTINGS_MAX_STORED_TABS_KEY,
      constants.SETTINGS_CHROME_SYNC_ENABLED_KEY,
    ]
    const uniqueKeys = new Set(keys)
    expect(uniqueKeys.size).toBe(keys.length)
  })
})
