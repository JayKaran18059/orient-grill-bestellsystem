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
    public: {
      /** Adresse des Shops, für Verweise in E-Mails */
      siteUrl: '',
    },
  },
  i18n: {
    strategy: 'no_prefix',
  },
  compatibilityDate: '2025-07-15',
})
