import { prisma } from '@nextorders/db'
import { createId } from '@paralleldrive/cuid2'
import { z } from 'zod'

const RequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Bitte E-Mail-Adresse und Passwort angeben.',
    })
  }

  const { email, password } = parsed.data

  const invalidCredentialsError = createError({
    statusCode: 401,
    message: 'Ungültige Zugangsdaten.',
  })

  const customer = await prisma.customer.findUnique({ where: { email } })
  if (!customer?.passwordHash) {
    // Kein Konto mit dieser E-Mail oder nur per Google angemeldet:
    // gleiche Fehlermeldung wie bei falschem Passwort, damit sich nicht
    // erraten lässt, welche E-Mail-Adressen registriert sind.
    throw invalidCredentialsError
  }

  const valid = await verifyPassword(customer.passwordHash, password)
  if (!valid) {
    throw invalidCredentialsError
  }

  const { user } = await getUserSession(event)
  await setUserSession(event, {
    user: {
      ...user,
      id: user?.id ?? createId(),
      customerId: customer.id,
      email: customer.email,
      name: customer.name ?? undefined,
    },
  })

  return { ok: true }
})
