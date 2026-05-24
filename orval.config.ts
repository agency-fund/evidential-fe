import { defineConfig } from 'orval';
import { OpenAPIObject } from 'openapi3-ts/oas30';
import { JSONPath } from 'jsonpath-plus';

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

// JSONPath expressions matching OpenAPI documentation fields anywhere in the spec.
const STRIP_PATHS: ReadonlyArray<string> = [
  '$..description',
  '$..summary',
  '$..example',
  '$..examples',
  '$..externalDocs',
];

// Keys whose immediate children are user-defined names rather than OpenAPI
// keywords. We skip matches inside these maps so that an API field literally
// named "description" (or a schema named "examples", etc.) isn't removed.
const NAME_MAPS = new Set([
  'callbacks',
  'examples',
  'headers',
  'links',
  'parameters',
  'paths',
  'properties',
  'requestBodies',
  'responses',
  'schemas',
  'securitySchemes',
]);

const removeOpenApiDocsZodCannotTreeshake = (doc: OpenAPIObject): OpenAPIObject => {
  const cloned = structuredClone(doc);
  for (const path of STRIP_PATHS) {
    const matches = JSONPath({ path, json: cloned, resultType: 'all' });
    for (const m of matches) {
      const segments = m.pointer.split('/');
      const grandparent = segments[segments.length - 2];
      if (NAME_MAPS.has(grandparent)) continue;
      m.parent[m.parentProperty] = '';
    }
  }
  return cloned;
};

export default defineConfig({
  xnginapi: {
    input: {
      target: 'openapi.json',
      filters: {
        mode: 'include',
        tags: ['Admin', 'Admin: Third-Party Tools Integrations'],
      },
      override: {
        transformer: removeOpenApiDocsZodCannotTreeshake,
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
      override: {
        transformer: removeOpenApiDocsZodCannotTreeshake,
      },
    },
    output: {
      client: 'zod',
      httpClient: 'fetch',
      mode: 'tags',
      target: './src/api/methods.ts',
      fileExtension: '.zod.ts',
      biome: true,
      override: {
        zod: {
          generate: {
            header: false,
            param: false,
            query: false,
            response: false,
            body: true,
          },
        },
      },
    },
  },
});
