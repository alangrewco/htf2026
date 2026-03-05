import { defineConfig } from 'orval';

export default defineConfig({
  petstore: {
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
});