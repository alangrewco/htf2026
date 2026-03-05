import { defineConfig } from 'orval';

export default defineConfig({
  petstore: {
    output: {
      mode: 'tags-split',
      target: 'sdk/server.ts',
      schemas: 'sdk/model',
      client: 'swr',
      mock: true,
    },
    input: {
      target: '../backend/openapi.yaml',
    },
  },
});