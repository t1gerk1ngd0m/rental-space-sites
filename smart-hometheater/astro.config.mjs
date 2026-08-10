// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  redirects: {
    '/motomachi': { status: 301, destination: '/#yokohama' },
    '/ofuna': { status: 301, destination: '/#ofuna' },
  },
});
