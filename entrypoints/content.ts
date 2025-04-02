export default defineContentScript({
  matches: ['*://*/*'],
  main(ctx) {
    console.log('Hello content.', document.title)
    browser.runtime.onMessage.addListener((message) => {
      console.log('message', message)
    })
  },
})
