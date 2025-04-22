import { TabType, TabItem } from '@/utils/types'

export function setupTabItems(
  itemsEl: HTMLElement,
  emptyEl: HTMLElement,
  callback: (id: string, action: 'click' | 'remove') => void | Promise<void>
) {
  // 绑定 tabItem 点击事件 (仅绑定一次)
  itemsEl.addEventListener('click', async function (this: HTMLElement, event: Event) {
    try {
      let target = event.target as HTMLElement
      while (target && target !== this) {
        if (target.classList.contains('tab-item-delete')) {
          const itemId = target.getAttribute('data-item-id') as string
          callback.call(target, itemId, 'remove')
          break
        } else if (target.classList.contains('tab-item')) {
          const itemId = target.getAttribute('data-item-id') as string
          callback.call(target, itemId, 'click')
          break
        } else {
          target = target.parentElement as HTMLElement
        }
      }
    } catch (err) {
      console.error(`[TabItemClick]:`, err)
    }
  })

  // 返回渲染函数 (多次调用)
  return <T extends TabType>(list: TabItem<T>[], isSearch: boolean = false) => {
    if (list.length === 0) {
      emptyEl.textContent = isSearch ? 'No matched ...' : 'No data ...'
      emptyEl.style.display = 'block'
      itemsEl.style.display = 'none'
      return
    }
    const items = list.map((item) => {
      return `
        <div class="tab-item" data-item-id="${item.id}">
          <div class="flex-shrink-0 mr-3">
              <img src="${item.favIconUrl}" alt="pass tabs" class="w-6 h-6">
          </div>
          <div class="flex-1 min-w-0">
              <h3 class="tab-item-title">${item.title}</h3>
              <div class="tab-item-meta">
                  <div class="tab-item-domain">${item.domain}</div>
                  <span class="tab-item-time">${item.time}</span>
              </div>
          </div>
          <button class="tab-item-delete" data-item-id="${item.id}">
              <svg class="w-5 h-5">
                  <use xlink:href="#icon-close"></use>
              </svg>
          </button>
      </div>
      `
    })
    itemsEl.innerHTML = items.join('')
    emptyEl.style.display = 'none'
    itemsEl.style.display = 'block'
  }
}
