import type { PrismaClient as PrismaClientType } from '@prisma/client'
import process from 'node:process'
import { PrismaNeon } from '@prisma/adapter-neon'
import prismaPkg from '@prisma/client'

// Bewusst als Standard-Import mit anschließendem Auspacken:
// @prisma/client ist ein CommonJS-Modul. Lokal lässt der Bundler den
// benannten Import `import { PrismaClient }` durchgehen, auf Vercel
// bricht der Server damit beim Start ab:
//   "Named export 'PrismaClient' not found"
// Der Typ wird getrennt importiert — Typ-Importe verschwinden beim
// Übersetzen und sind von der Sache nicht betroffen.
const { PrismaClient } = prismaPkg

// Ein Client pro Prozess. Im Dev-Server (HMR) sonst würde jede
// Modul-Neuladung einen weiteren offenen Verbindungs-Pool erzeugen.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientType }

function createClient(): PrismaClientType {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
