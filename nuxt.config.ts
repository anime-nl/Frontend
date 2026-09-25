// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    ssr: true,
    modules: ['@nuxt/ui', '@nuxtjs/medusa'],
    css: ['~/assets/css/main.css'],
    compatibilityDate: '2025-07-15',
    devtools: {enabled: true},
    vite: {
        optimizeDeps: {
            include: [
                '@vue/devtools-core',
                '@vue/devtools-kit',
                'qs'
            ]
        }
    },
    medusa: {
        baseUrl: process.env.MEDUSA_URL || 'http://localhost:9000',
        global: true,
        server: false,
        debug: true,
        publishableKey: process.env.MEDUSA_PUBLISHABLE_KEY,
        auth: {
            type: 'session',
            jwtTokenStorageKey: 'medusa_auth_token',
            jwtTokenStorageMethod: 'local'
        }
    },
    runtimeConfig: {
        // URL the Nuxt server uses to reach Medusa; differs from MEDUSA_URL inside the dev container
        medusaServerUrl: process.env.MEDUSA_SERVER_URL || process.env.MEDUSA_URL,
        medusaPublishableKey: process.env.MEDUSA_PUBLISHABLE_KEY,
        medusaSalesChannelId: process.env.MEDUSA_SALES_CHANNEL_ID,
        // SMTP server for the /support forms
        smtpHost: process.env.SMTP_HOST,
        smtpPort: Number(process.env.SMTP_PORT) || 587,
        smtpUser: process.env.SMTP_USER,
        smtpPass: process.env.SMTP_PASS,
        public: {
            supportEmail: 'info@animenl.nl'
        }
    }
})