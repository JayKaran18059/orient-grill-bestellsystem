export default defineNuxtConfig({
  extends: ['@nextorders/ui', '@nextorders/core'],
  runtimeConfig: {
    public: {
      channelId: 'web-app',
    },
  },
  // Dunkel als Standard — die Schaufenster-Seite des Orient Grill ist
  // durchgehend dunkel, und die Markengestaltung (Schwarz, Gold) ist
  // darauf ausgelegt. Umschalten bleibt möglich.
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  },

  router: {
    options: {
      scrollBehaviorType: 'smooth',
    },
  },
  compatibilityDate: '2025-07-15',
})
