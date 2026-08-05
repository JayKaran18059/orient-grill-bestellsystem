import { prisma } from '@nextorders/db'
import { createId } from '@paralleldrive/cuid2'
import { z } from 'zod'

const RequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Bitte E-Mail-Adresse und ein Passwort mit mindestens 8 Zeichen angeben.',
    })
  }

  const { email, password, name } = parsed.data

  const existing = await prisma.customer.findUnique({ where: { email } })
  if (existing) {
    throw createError({
      statusCode: 409,
      message: 'Für diese E-Mail-Adresse besteht bereits ein Konto.',
    })
  }

  const passwordHash = await hashPassword(password)
  const customer = await prisma.customer.create({
    data: { email, passwordHash, name },
  })

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
