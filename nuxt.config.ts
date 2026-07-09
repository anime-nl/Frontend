// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    modules: ['@nuxt/ui', '@nuxtjs/medusa'],
    css: ['~/assets/css/main.css'],
    compatibilityDate: '2025-07-15',
    devtools: {enabled: true},
    vite: {
        optimizeDeps: {
            include: [
                '@vue/devtools-core',
                '@vue/devtools-kit'
            ]
        }
    },
    medusa: {
        baseUrl: process.env.MEDUSA_URL || 'http://localhost:9000',
        global: true,
        server: false,
        debug: true,
        publishableKey: "pk_e6017b03723f328deb2b93a2a1cf547737e9b3eeb94cc66de4214f3c8dd304c8",
        auth: {
            type: 'session',
            jwtTokenStorageKey: 'medusa_auth_token',
            jwtTokenStorageMethod: 'local'
        }
    }
})