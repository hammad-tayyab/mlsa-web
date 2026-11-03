import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mlsaclubgiki.tech',
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
  },
});

