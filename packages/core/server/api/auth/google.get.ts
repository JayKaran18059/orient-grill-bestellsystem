import { prisma } from '@nextorders/db'
import { createId } from '@paralleldrive/cuid2'

export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email', 'profile'],
  },
  async onSuccess(event, { user: googleUser }) {
    const email = googleUser.email as string | undefined
    const googleId = googleUser.sub as string | undefined
    const name = googleUser.name as string | undefined

    if (!email || !googleId) {
      return sendRedirect(event, '/login?fehler=google')
    }

    let customer = await prisma.customer.findUnique({ where: { googleId } })

    if (!customer) {
      // Gibt es schon ein Konto mit dieser E-Mail (z.B. per Passwort
      // angelegt)? Dann Google-Login damit verknüpfen statt ein
      // zweites Konto zu erzeugen.
      const byEmail = await prisma.customer.findUnique({ where: { email } })
      customer = byEmail
        ? await prisma.customer.update({ where: { id: byEmail.id }, data: { googleId } })
        : await prisma.customer.create({ data: { email, googleId, name } })
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

    return sendRedirect(event, '/konto')
  },
  onError(event) {
    return sendRedirect(event, '/login?fehler=google')
  },
})
