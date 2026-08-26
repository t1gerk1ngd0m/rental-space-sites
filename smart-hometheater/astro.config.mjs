// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://smart-hometheater.com',
  compressHTML: false,
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  vite: {
    build: {
      cssMinify: false,
    },
  },
  redirects: {
    '/motomachi': { status: 301, destination: '/#yokohama' },
    '/ofuna': { status: 301, destination: '/#ofuna' },
  },
});
