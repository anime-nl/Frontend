import { ContainerRegistrationKeys, Modules, loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// The Mollie provider throws during startup if apiKey/redirectUrl/medusaUrl are missing, which fails
// the whole payment module's loader and crashes Medusa entirely (unlike auth-google, which fails to
// register but lets the rest of Medusa start). So it is only added when a key is actually configured.
const mollieConfigured = Boolean(process.env.MOLLIE_API_KEY)

// Order confirmation emails need an SMTP server; without one the notification module stays unregistered
// and the order.placed subscriber just logs a warning.
const smtpConfigured = Boolean(process.env.SMTP_HOST)

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    },
  },
  modules: [
    ...(smtpConfigured
      ? [
          {
            resolve: '@medusajs/medusa/notification',
            options: {
              providers: [
                {
                  resolve: './src/modules/smtp-notification',
                  id: 'smtp',
                  options: {
                    channels: ['email'],
                    host: process.env.SMTP_HOST,
                    port: Number(process.env.SMTP_PORT) || 587,
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                    from: process.env.SMTP_FROM || 'info@animenl.nl',
                  },
                },
              ],
            },
          },
        ]
      : []),
    {
      resolve: '@medusajs/medusa/file',
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/file-s3',
            id: 's3',
            options: {
              file_url: process.env.S3_FILE_URL,
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              region: process.env.S3_REGION || 'us-east-1',
              bucket: process.env.S3_BUCKET,
              endpoint: process.env.S3_ENDPOINT,
              additional_client_config: {
                forcePathStyle: true,
              },
            },
          },
        ],
      },
    },
    {
      // Keeping `auth-emailpass` is required for the admin dashboard's own login; the storefront
      // never offers it to customers, who only ever get the `google` provider (see shared/utils/auth.ts).
      resolve: '@medusajs/medusa/auth',
      dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER],
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/auth-emailpass',
            id: 'emailpass',
          },
          {
            resolve: '@medusajs/medusa/auth-google',
            id: 'google',
            options: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              callbackUrl: process.env.GOOGLE_CALLBACK_URL,
            },
          },
        ],
      },
    },
    // `pp_system_default` stays registered on the region too (see seed.ts), as a no-op fallback for
    // local dev without a Mollie key, and this module is only added at all once one is configured.
    ...(mollieConfigured
      ? [
          {
            resolve: '@medusajs/medusa/payment',
            options: {
              providers: [
                {
                  resolve: '@variablevic/mollie-payments-medusa/providers/mollie',
                  id: 'mollie',
                  options: {
                    apiKey: process.env.MOLLIE_API_KEY,
                    redirectUrl: process.env.MOLLIE_REDIRECT_URL,
                    medusaUrl: process.env.MEDUSA_URL,
                  },
                },
              ],
            },
          },
        ]
      : []),
  ],
})
