import { TABS_MAP } from '@/utils/const'
import { TabType } from '@/utils/types'

export function setupTabGroup(
  element: HTMLElement,
  active: TabType,
  callback: (type: TabType) => Promise<void> | void
) {
  if (!element) return

  // 渲染标签组
  const content = Object.entries(TABS_MAP).map(([key, val]) => {
    return `<li class="tab-group-item ${active === key ? 'active' : ''}" data-code="${key}">
    ${val.text}
    </li>`
  })
  element.innerHTML = content.join('')

  const $items = element.querySelectorAll<HTMLElement>('.tab-group-item')
  $items.forEach((item) => {
    item.addEventListener('click', async function (this: HTMLElement) {
      // 移除所有标签的激活状态
      $items.forEach((tab) => {
        tab.classList.remove('active')
      })

      // 为当前点击的标签添加激活状态
      this.classList.add('active')

      // 触发回调函数
      const code = this.getAttribute('data-code') as TabType
      if (code) {
        await callback(code)
      }
    })
  })
}
