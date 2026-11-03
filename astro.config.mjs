import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://hammad-tayyab.github.io',
  base: '/mlsa-web',
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
  },
});
