import { defineConfig } from 'orval';

export default defineConfig({
  xnginapi: {
    input: {
      target: 'openapi.json',
      filters: {
        mode: 'include',
        tags: ['Admin'],
      },
    },
    output: {
      client: 'swr',
      httpClient: 'fetch',
      mode: 'tags',
      target: './src/api/methods.ts',
      biome: true,
      override: {
        mutator: {
          path: './src/services/orval-fetch.ts',
          name: 'orvalFetch',
        },
      },
    },
  },
  xnginapiZod: {
    input: {
      target: 'openapi.json',
      filters: {
        mode: 'include',
        tags: ['Admin'],
      },
    },
    output: {
      client: 'zod',
      httpClient: 'fetch',
      mode: 'tags',
      target: './src/api/methods.ts',
      fileExtension: '.zod.ts',
      biome: true,
    },
  },
});
