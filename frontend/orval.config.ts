import { defineConfig } from 'orval';

export default defineConfig({
  server: {
    output: {
      mode: 'tags-split',
      target: 'sdk/server.ts',
      schemas: 'sdk/model',
      client: 'swr',
      // baseUrl: 'https://htf2026-backend-4mqbzcv3ya-uc.a.run.app/api/v1',
      baseUrl: 'http://localhost:8080/api/v1',
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