export function renderPreloadLinks(files: string[]): string {
  let link = '';

  for (const file of files || []) {
    if (file.endsWith('.js')) {
      link += `<link rel="modulepreload" crossorigin href="${file}">`;
    } else if (file.endsWith('.css')) {
      link += `<link rel="stylesheet" href="${file}">`;
    }
  }

  return link;
}

const containerId = 'app';

const containerRE = new RegExp(
  `<div id="${containerId}"([\\s\\w\\-"'=[\\]]*)><\\/div>`,
);

export type PageDescriptor = {
  headTags?: string
  htmlAttrs?: string
  bodyAttrs?: string
  body?: string
};

export type DocParts = PageDescriptor & {
  initialState?: string
};

export function buildHtmlDocument(
  template: string,
  { htmlAttrs, bodyAttrs, headTags, body, initialState }: DocParts,
): string {
  // @ts-expect-error -- __DEV__ is injected by Vite.
  if (__DEV__) {
    if (!template.includes(`id="${containerId}"`)) {
      console.warn(
        `[SSR] Container with id "${containerId}" was not found in index.html`,
      );
    }
  }

  if (htmlAttrs) {
    template = template.replace('<html', `<html ${htmlAttrs} `);
  }

  if (bodyAttrs) {
    template = template.replace('<body', `<body ${bodyAttrs} `);
  }

  if (headTags) {
    template = template.replace('</head>', `\n${headTags}</head>`);
  }

  return template.replace(
    containerRE,
    // Use function parameter here to avoid replacing `$1` in body or initialState.
    // https://github.com/frandiox/vite-ssr/issues/123
    (_, d1) =>
      `<div id="${containerId}" data-server-rendered="true"${d1 || ''}>${
        body || ''
      }</div>\n\n  <script>window.__INITIAL_STATE__=${
        initialState || '\'{}\''
      }</script>`,
  );
}
