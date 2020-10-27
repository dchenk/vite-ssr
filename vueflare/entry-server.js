import { createSSRApp } from 'vue'
import renderer from '@vue/server-renderer'
import createRouter from './router'

export default function (App, { routes }, hook) {
  return async function ({ url }) {
    const router = createRouter({ type: 'server', routes })
    const app = createSSRApp(App)
    app.use(router)

    router.push(url)

    if (hook) {
      await hook({ app, router })
    }

    await router.isReady()

    const html = await renderer.renderToString(app)

    if (html) {
      // This string is replaced at build time.
      return { html: `__HTML__` }
    }

    return { html: `` }
  }
}