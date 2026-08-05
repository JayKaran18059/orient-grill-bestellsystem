declare module '#auth-utils' {
  interface User {
    id: string
    orderId?: string
    completedOrderIds?: string[]
    /** Gesetzt, sobald sich die Session-Inhaberin per E-Mail/Passwort oder Google angemeldet hat */
    customerId?: string
    email?: string
    name?: string
  }
}

export {}
