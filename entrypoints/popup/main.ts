import './style.css'
import { TabItem, TabType } from '@/utils/types'
import { useTheme } from '@/utils/theme'
import { getTabType, setTabType, useTabsRender } from '@/utils/tabs'
import { setupTabGroup } from '@/components/TabGroup'
import { setupTabItems } from '@/components/TabItems'
import addInputListener from 'kitify/addInputListener'

// 初始化
document.addEventListener('DOMContentLoaded', async function () {
  const $theme = document.querySelector('#theme-toggle') as HTMLElement
  const $tagGroup = document.querySelector('#tab-group') as HTMLElement
  const $empty = document.querySelector('#empty') as HTMLElement
  const $list = document.querySelector('#tab-list') as HTMLElement
  const $search = document.querySelector('#search-input') as HTMLInputElement
  const $clearSearch = document.querySelector('#clear-search') as HTMLElement

  // 页签项点击/移除方法
  let onRemoveTabItem: any = null
  let onCLickTabItem: any = null
  // 当前选中的标签
  let activeTab = (await getTabType()) || 'closed'

  // 初始化主题
  useTheme($theme)
  // 创建页签列表渲染函数
  const itemsRender = setupTabItems($list, $empty, function (itemId, action) {
    if (action === 'remove') {
      onRemoveTabItem?.(itemId, activeTab)
    } else {
      onCLickTabItem?.(itemId, activeTab)
    }
  })
  // 初始化标签页渲染函数
  const { renderTabs, searchTabs, clickTabItem, deleteTabItem } = useTabsRender(
    activeTab,
    itemsRender
  )
  onRemoveTabItem = deleteTabItem
  onCLickTabItem = clickTabItem
  // 初始化标签组
  setupTabGroup($tagGroup, activeTab, async function (code) {
    activeTab = code
    await setTabType(code)
    await renderTabs(code)
  })

  // 搜索功能
  // $search.addEventListener('input', async function (this: HTMLInputElement) {
  addInputListener($search, function (value: string) {
    // const searchTerm = this.value.toLowerCase().trim()
    const searchTerm = value.toLowerCase().trim()
    // 显示/隐藏清空按钮
    if (searchTerm.length > 0) {
      $clearSearch.classList.remove('hidden')
    } else {
      $clearSearch.classList.add('hidden')
    }

    searchTabs(searchTerm, activeTab)
  })
  $clearSearch.addEventListener('click', async function () {
    $search.value = ''
    $search.dispatchEvent(new Event('input'))
    $search.focus()
  })
  //添加全局键盘事件监听器
  document.addEventListener('keydown', function (event) {
    // 检查是否按下了 / 键，并且不是在输入框中（避免干扰用户输入）
    if (event.key === '/' && document.activeElement !== $search) {
      // 阻止默认行为（避免 / 字符被输入到搜索框）
      event.preventDefault()
      // 聚焦到搜索框
      $search.focus()
    }
  })
})
