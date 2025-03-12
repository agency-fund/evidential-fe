import { defineConfig } from 'orval';

// Rewrites orvalFetch imports to use @/ instead of relative paths.
const rewriteImports = (filenames: string[]) => {
  const fs = require('fs');

  for (const filename of filenames) {
    const content = fs.readFileSync(filename, 'utf8');
    if (!content.includes('orvalFetch')) {
      continue;
    }
    const updated = content.replace(/["'][.][.][/]services[/]orval-fetch['"]/g, '"@/services/orval-fetch"');
    fs.writeFileSync(filename, updated, 'utf8');
    console.log(`Updated custom fetcher import in ${filename}`);
  }
};

export default defineConfig({
  xnginapi: {
    input: {
      target: 'openapi.json',
      filters: {
        mode: 'include',
        tags: ['Admin'],
      },
    },
    hooks: {
      afterAllFilesWrite: [rewriteImports],
    },
    output: {
      client: 'swr',
      httpClient: 'fetch',
      mode: 'tags',
      target: './src/api/methods.ts',
      biome: true,
      override: {
        fetch: {
          includeHttpResponseReturnType: false,
        },
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
