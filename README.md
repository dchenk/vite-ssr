<p align="center">
  <img width="180" src="./logo.svg" alt="Vite SSR logo">
</p>

# Vite SSR

Simple yet powerful Server Side Rendering for React on Vite.

- Lightning Fast HMR powered by Vite, even in SSR mode.
- Consistent DX experience abstracting most of the SSR complexity.
- Small library that is un-opinionated about things like your page routing.
- Fast and SEO friendly thanks to SSR, with SPA takeover for snappy UX.
- Compatible with Vite's plugin ecosystem.

Vite SSR can be deployed to any Node.js or browser-like environment, including serverless platforms like Vercel, Netlify, or even Cloudflare Workers. It can also run with more traditional servers like Express.js or Fastify.

## Installation

Create a normal [Vite](https://vitejs.dev/guide/) project for React.

Then, add `vite-ssr` with your package manager (direct dependency) and your framework router.

```sh
npm i vite-ssr react react-router-dom
```

Make sure that `index.html` contains a root element with id `app`: `<div id="app"></div>` (or change the default container id in plugin options: `options.containerId`).

## Usage

Add Vite SSR plugin to your Vite config file (see [`vite.config.js`](./examples/react-apollo/vite.config.js) for a full example).

```js
// vite.config.js
import react from '@vitejs/plugin-react';
import viteSSR from 'vite-ssr-react/plugin.js';

export default {
  plugins: [viteSSR(), react()],
};
```

Then, simply import the main Vite SSR handler in your main entry file as follows. See full example for [React](./examples/react-apollo/src/main.jsx).

```js
import App from './App'; // React main app
import routes from './routes';
import viteSSR from 'vite-ssr';
// or from 'vite-ssr/vue' or 'vite-ssr/react', which slightly improves typings

export default viteSSR(App, { routes }, (context) => {
  /* Vite SSR main hook for custom logic */
  /* const { app, router, initialState, ... } = context */
});
```

That's right, in Vite SSR **there's only 1 single entry file** by default 🎉. It will take care of providing your code with the right environment.

If you need conditional logic that should only run in either client or server, use Vite's `import.meta.env.SSR` boolean variable and the tree-shaking will do the rest.

The third argument is Vite SSR's main hook, which runs only once at the start. It receives the SSR context and can be used to initialize the app or setup anything like state management or other plugins. The same SSR Context is passed to the main App component as a prop.

<details><summary>Available options</summary>
<p>

The previous handler accepts the following options as its second argument:

- `routes`: Array of routes, according to each framework's router (see [`vue-router`](https://next.router.vuejs.org/api/#routerecordraw) or [`react-router-config`](https://www.npmjs.com/package/react-router-config#route-configuration-shape)).
- `base`: Function that returns a string with the router base. Can be useful for i18n routes or when the app is not deployed at the domain root.
- `transformState`: Modify the state to be serialized or deserialized. See [State serialization](#state-serialization) for more information.
- `debug.mount`: Pass `false` to prevent mounting the app in the client. You will need to do this manually on your own but it's useful to see differences between SSR and hydration.

</p>
</details>

<details><summary>SSR Context</summary>
<p>

The context passed to the main hook (and to React's root component) contains:

- `initialState`: Object that can be mutated during SSR to save any data to be serialized. This same object and data can be read in the browser.
- `url`: Initial [URL](https://developer.mozilla.org/en-US/docs/Web/API/URL).
- `request`: Available during SSR.
- `redirect`: Isomorphic function to redirect to a different URL.
- `writeResponse`: Function to add status or headers to the `response` object (only in backend).

This context can also be accesed from any component by using `useContext` hook:

```js
import { useContext } from 'vite-ssr'

//...
function() {
  // In a component
  const { initialState, redirect } = useContext()
  // ...
}
```

</p>
</details>

<details><summary>Using separate entry files</summary>
<p>

Even though Vite SSR uses 1 single entry file by default, thus abstracting complexity from your app, you can still have separate entry files for client and server if you need more flexibility. This can happen when building a library on top of Vite SSR, for example.

Simply provide the entry file for the client in `index.html` (as you would normally do in an SPA) and pass the entry file for the server as a CLI flag: `vite-ssr [dev|build] --ssr <path/to/entry-server>`.

Then, import the main SSR handlers for the entry files from `vite-ssr/vue/entry-client` and `vite-ssr/vue/entry-server` instead. Use `vite-ssr/react/*` for React.

</p>
</details>

## SSR initial state and data fetching

The SSR initial state is the application data that is serialized as part of the server-rendered HTML for later hydration in the browser. This data is normally gathered using fetch or DB requests from your API code.

Vite SSR initial state consists of a plain JS object that is passed to your application and can be modified at will during SSR. This object will be serialized and later hydrated automatically in the browser, and passed to your app again so you can use it as a data source.

```js
export default viteSSR(App, { routes }, ({ initialState }) => {
  if (import.meta.env.SSR) {
    // Write in server
    initialState.myData = 'DB/API data';
  } else {
    // Read in browser
    console.log(initialState.myData); // => 'DB/API data'
  }

  // Provide the initial state to your stores, components, etc. as you prefer.
});
```

If you prefer having a solution for data fetching out of the box, have a look at [Vitedge](https://github.com/frandiox/vitedge). Otherwise, you can implement it as follows:

<details><summary>Initial state in Vue</summary>
<p>

Vue has multiple ways to provide the initial state to Vite SSR:

- Calling your API before entering a route (Router's `beforeEach` or `beforeEnter`) and populate `route.meta.state`. Vite SSR will get the first route's state and use it as the SSR initial state. See a full example [here](./examples/vue/src/main.js).

```js
export default viteSSR(App, { routes }, async ({ app }) => {
  router.beforEach(async (to, from) => {
    if (to.meta.state) {
      return; // Already has state
    }

    const response = await fetch('my/api/data/' + to.name);

    // This will modify initialState
    to.meta.state = await response.json();
  });
});
```

- Calling your API directly from Vue components using [`Suspense`](https://v3.vuejs.org/guide/migration/suspense.html), and storing the result in the SSR initial state. See a full example with `Suspense` [here](./examples/vue/src/pages/Homepage.vue). If you prefer Axios, there's also an example [here](https://github.com/frandiox/vite-ssr/discussions/66).

```js
import { useContext } from 'vite-ssr';
import { useRoute } from 'vue-router';
import { inject, ref } from 'vue';

// This is a custom hook to fetch data in components
export async function useFetchData(endpoint) {
  const { initialState } = useContext();
  const { name } = useRoute(); // this is just a unique key
  const state = ref(initialState[name] || null);

  if (!state.value) {
    state.value = await (await fetch(endpoint)).json();

    if (import.meta.env.SSR) {
      initialState[name] = state.value;
    }
  }

  return state;
}
```

</p>
</details>

<details><summary>Initial state in React</summary>
<p>

There are a few ways to provide initial state in React:

- Call your API and throw a promise in order to leverage React's Suspense (in both browser and server) anywhere in your components. Vite SSR is already adding Suspense to the root so you don't need to provide it.

```jsx
function App({ initialState }) {
  if (!initialState.ready) {
    const promise = getPageProps(route).then((state) => {
      Object.assign(initialState, state);
      initialState.ready = true;
    });

    // Throw the promise so Suspense can await it
    throw promise;
  }

  return <div>{initialState}</div>;
}
```

- Calling your API before entering a route and populate `route.meta.state`. Vite SSR will get the first route's state and use it as the SSR initial state. See a full example [here](./examples/react/src/api.jsx).

```jsx
function App({ router }) {
  // This router is provided by Vite SSR.
  // Use it to render routes and save initial state.

  return (
    <Routes>
      {router.routes.map((route) => {
        if (!route.meta.state) {
          // Call custom API and return a promise
          const promise = getPageProps(route).then((state) => {
            // This is similar to modifying initialState in the previous example
            route.meta.state = state
          })

          // Throw the promise so Suspense can await it
          throw promise
        }

        return (
          <Route key={route.path} path={route.path} element={
            <route.component props={...route.meta.state} />
          } />
        )
      })}
    </Routes>
  )
}
```

</p>
</details>

### State serialization

Vite SSR simply uses `JSON.stringify` to serialize the state, escapes certain characters to prevent XSS and saves it in the DOM. This behavior can be overriden by using the `transformState` hook in case you need to support dates, regexp or function serialization:

```js
import viteSSR from 'vite-ssr';
import App from './app';
import routes from './routes';

export default viteSSR(App, {
  routes,
  transformState(state) {
    if (import.meta.env.SSR) {
      // Transform during SSR.
      // state.apolloCache = state.apolloCache.extract();
      return state;
    } else {
      // Transform in browser.
      return state;
    }
  },
});
```

## Accessing `response` and `request` objects

In development, both `response` and `request` objects are passed to the main hook during SSR:

```js
export default viteSSR(App, { routes }, ({ initialState, request, response }) => {
  // Access request cookies, etc.
});
```

In production, you control the server so you must pass these objects to the rendering function in order to have them available in the main hook:

```js
import render from './dist/server';

//...

const { html } = await render(url, {
  manifest,
  preload: true,
  request,
  response,
  // Anything here will be available in the main hook.
  initialState: { hello: 'world' }, // Optional prefilled state
});
```

Beware that, in development, Vite uses plain Node.js + Connect for middleware. Therefore, the `request` and `response` objects might differ from your production environment if you use any server framework such as Fastify, Express.js or Polka. If you want to use your own server during development, check [Middleware Mode](#middleware-mode).

### Editing Response and redirects

It's possible to set status and headers to the response with `writeResponse` utility. For redirects, the `redirect` utility works both in SSR (server redirect) and browser (history push):

```js
import { useContext } from 'vite-ssr'

// In a component
function () {
  const { redirect, writeResponse } = useContext()

  if (/* ... */) {
    redirect('/another-page', 302)
  }

  if (import.meta.env.SSR && /* ... */) {
    writeResponse({
      status: 404,
      headers: {}
    })
  }

  // ...
}
```

In the browser, this will just behave as a normal Router push.

## Head tags and global attributes

Use your framework's utilities to handle head tags and attributes for html and body elements.

<details><summary>Vue Head</summary>
<p>

Install [`@vueuse/head`](https://github.com/vueuse/head) as follows:

```js
import { createHead } from '@vueuse/head';

export default viteSSR(App, { routes }, ({ app }) => {
  const head = createHead();
  app.use(head);

  return { head };
});

// In your components:
// import { useHead } from '@vueuse/head'
// ... useHead({ ... })
```

</p>
</details>

<details><summary>React Helmet</summary>
<p>

Use [`react-helmet-async`](https://github.com/staylor/react-helmet-async) from your components (similar usage to `react-helmet`). The provider is already added by Vite SSR.

```jsx
import { Helmet } from 'react-helmet-async';

// ...
<>
  <Helmet>
    <html lang="en" />
    <meta charSet="utf-8" />
    <title>Home</title>
    <link rel="canonical" href="http://mysite.com/example" />
  </Helmet>
</>;
```

</p>
</details>

## Development

There are two ways to run the app locally for development:

- SPA mode: `vite dev` command runs Vite directly without any SSR.
- SSR mode: `vite-ssr dev` command spins up a local SSR server. It supports similar attributes to Vite CLI, e.g. `vite-ssr --port 1337 --open`.

SPA mode will be slightly faster but the SSR one will have closer behavior to a production environment.

### Middleware Mode

If you want to run your own dev server (e.g. Express.js) instead of Vite's default Node + Connect, you can use Vite SSR in middleware mode:

```js
const express = require('express');
const { createSsrServer } = require('vite-ssr/dev/server');

async function createServer() {
  const app = express();

  // Create vite-ssr server in middleware mode.
  const viteServer = await createSsrServer({
    server: { middlewareMode: 'ssr' },
  });

  // Use vite's connect instance as middleware
  app.use(viteServer.middlewares);

  app.listen(3000);
}

createServer();
```

## Production

Run `vite-ssr build` for buildling your app. This will create 2 builds (client and server) that you can import and use from your Node backend. See an Express.js example server [here](./examples/node-server/index.js), or a serverless function deployed to Vercel [here](https://github.com/frandiox/vitesse-ssr-template/blob/master/serverless/api/index.js).

<details><summary>Keeping index.html in the client build</summary>
<p>

In an SSR app, `index.html` is already embedded in the server build, and is thus removed from the client build in order to prevent serving it by mistake. However, if you would like to keep `index.html` in the client build (e.g. when using server side routing to selectively use SSR for a subset of routes), you can set `build.keepIndexHtml` to `true` in the plugin options:

```js
// vite.config.js

export default {
  plugins: [
    viteSSR({
      build: {
        keepIndexHtml: true,
      },
    }),
    [...]
  ],
}
```

</p>
</details>

## Custom Typings

You can define your own typings with `vite-ssr`. To declare custom types, the file mostly needs to `import` or `export` something not to break other types.
Example transforming `request` and `response` to types of `express`:

```ts
import { Request, Response } from 'express';

declare module 'vite-ssr-react' {
  export interface Context {
    request: Request;
    response: Response;
  }
}
```
