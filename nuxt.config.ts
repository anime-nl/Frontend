// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    ssr: true,
    modules: ['@nuxt/ui', '@nuxtjs/sitemap', '@nuxt/eslint', 'nuxt-gtag'],
    css: ['~/assets/css/main.css'],
    compatibilityDate: '2025-07-15',
    devtools: {enabled: true},
    app: {
        head: {
            htmlAttrs: {lang: 'en'},
            title: 'AnimeNL',
            titleTemplate: '%s | AnimeNL',
            link: [
                // favicon.ico covers legacy browsers that ignore <link> tags; icon.png is the full-resolution
                // source (1024x1024) for browsers, bookmarks and search engines that support larger icons
                {rel: 'icon', href: '/favicon.ico', sizes: '48x48'},
                {rel: 'icon', type: 'image/png', href: '/icon.png', sizes: '1024x1024'},
                {rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180'}
            ]
        }
    },
    site: {
        // Used to build the sitemap and absolute URLs; only cosmetic locally since the sitemap isn't crawled there
        url: process.env.SITE_URL || 'https://animenl.nl',
        name: 'AnimeNL'
    },
    sitemap: {
        // Product URLs change as the Medusa catalog changes, so they are fetched at request time instead of at build
        sources: ['/api/sitemap-urls']
    },
    gtag: {
        id: process.env.GA_MEASUREMENT_ID || '',
        // Never track the dev container or a build without a measurement id
        enabled: process.env.NODE_ENV === 'production' && !!process.env.GA_MEASUREMENT_ID,
        // Loading is deferred until the visitor grants consent, see app/components/cookieConsentBanner.vue
        initMode: 'manual',
        initCommands: [
            [
                'consent',
                'default',
                {
                    analytics_storage: 'denied',
                    ad_storage: 'denied',
                    ad_user_data: 'denied',
                    ad_personalization: 'denied',
                    wait_for_update: 500
                }
            ]
        ]
    },
    vite: {
        optimizeDeps: {
            include: ['@vue/devtools-core', '@vue/devtools-kit', 'qs']
        }
    },
    icon: {
        // Nuxt Icon's `local` auto-discovery only recognizes a fixed list of collection names, which
        // does not include `pinhead` or `at-icons`; naming every collection explicitly bundles all of them.
        serverBundle: {
            collections: [
                'lucide',
                'flat-color-icons',
                'mdi',
                'material-symbols',
                'material-symbols-light',
                'game-icons',
                'simple-icons',
                'pinhead',
                'at-icons'
            ]
        }
    },
    runtimeConfig: {
        // URL the Nuxt server uses to reach Medusa; differs from MEDUSA_URL inside the dev container
        medusaServerUrl: process.env.MEDUSA_SERVER_URL || process.env.MEDUSA_URL,
        medusaPublishableKey: process.env.MEDUSA_PUBLISHABLE_KEY,
        medusaSalesChannelId: process.env.MEDUSA_SALES_CHANNEL_ID,
        // Shipping profile ids used to pick which shipping options to show at checkout (see server/api/checkout/shipping-options.get.ts)
        medusaBrievenbusShippingProfileId: process.env.MEDUSA_BRIEVENBUS_SHIPPING_PROFILE_ID,
        medusaPakketShippingProfileId: process.env.MEDUSA_PAKKET_SHIPPING_PROFILE_ID,
        // SMTP server for the /support forms
        smtpHost: process.env.SMTP_HOST,
        smtpPort: Number(process.env.SMTP_PORT) || 587,
        smtpUser: process.env.SMTP_USER,
        smtpPass: process.env.SMTP_PASS,
        public: {
            supportEmail: 'info@animenl.nl',
            // Lets the cookie consent banner know whether there is anything to ask consent for
            gaEnabled: process.env.NODE_ENV === 'production' && !!process.env.GA_MEASUREMENT_ID
        }
    }
})
