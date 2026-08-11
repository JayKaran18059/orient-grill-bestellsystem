export default defineNuxtConfig({
  modules: [
    '@nuxtjs/i18n',
    'nuxt-auth-utils',
    '@pinia/nuxt',
  ],
  runtimeConfig: {
    apiUrl: '',
    apiToken: '',
    /** Schlüssel für den E-Mail-Versand (Resend). Leer = kein Versand. */
    resendApiKey: '',
    /** Absender, z.B. 'Orient Grill <bestellung@orient-grill.de>' */
    mailAbsender: '',
    /** Geheimer Stripe-Schlüssel (sk_...). Leer = keine Online-Zahlung. */
    stripeSecretKey: '',
    /** Geheimnis des Stripe-Webhooks (whsec_...) */
    stripeWebhookSecret: '',
    public: {
      /** Adresse des Shops, für Verweise in E-Mails */
      siteUrl: '',
      /**
       * Öffentlicher Stripe-Schlüssel (pk_...). Der gehört in den
       * Browser, das ist keine Nachlässigkeit. Ist er leer, blendet die
       * Kasse die Online-Bezahlkacheln aus.
       */
      stripePublishableKey: '',
    },
  },
  i18n: {
    strategy: 'no_prefix',
  },
  compatibilityDate: '2025-07-15',
})
