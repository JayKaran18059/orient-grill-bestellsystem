import { defineConfig, env } from 'prisma/config'

// Nur für die Prisma-CLI (migrate/generate). Die Laufzeit-Verbindung
// läuft über den Neon-Adapter in src/client.ts.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
})
