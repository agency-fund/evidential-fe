import {defineConfig} from 'orval';

export default defineConfig({
    "xnginapi": {
        input: {
            target: 'openapi.json'
        },
        output: {
            client: 'swr',
            httpClient: 'fetch',
            mode: 'tags',
            target: './src/api/methods.ts',
            override: {
                mutator: {
                    path: './src/services/orval-fetch.ts',
                    name: 'orvalFetch',
                },
            },
        }
    },
});
