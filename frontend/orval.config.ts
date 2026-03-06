import { defineConfig } from 'orval';

export default defineConfig({
  server: {
    output: {
      mode: 'tags-split',
      target: 'sdk/server.ts',
      schemas: 'sdk/model',
      client: 'swr',
      baseUrl: 'http://localhost:5000',
      mock: true,
    },
    input: {
      target: '../backend/openapi.yaml',
    },
  },
  serverZod: {
    output: {
      mode: 'tags-split',
      client: 'zod',
      target: 'sdk/server.ts',
      fileExtension: '.zod.ts',
    },
    input: {
      target: '../backend/openapi.yaml',
    },
  },
});