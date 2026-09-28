import {fileURLToPath} from 'node:url'
import {defineConfig} from 'vitest/config'
import {defineVitestProject} from '@nuxt/test-utils/config'

export default defineConfig({
    test: {
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json-summary', 'html'],
            // The Medusa backend under medusa/ isn't part of this app's deployment (see AGENTS.md), so it's excluded
            include: ['app/**', 'server/**', 'shared/**'],
            thresholds: {
                lines: 80,
                statements: 80,
                functions: 80,
                branches: 80
            }
        },
        projects: [
            {
                resolve: {
                    // Mirrors Nuxt's own `#shared` alias to the `shared/` directory, so server
                    // utils that import shared code can be unit-tested outside the Nuxt runtime
                    alias: {'#shared': fileURLToPath(new URL('./shared', import.meta.url))}
                },
                test: {
                    name: 'unit',
                    include: ['test/unit/**/*.test.ts'],
                    environment: 'node'
                }
            },
            await defineVitestProject({
                test: {
                    name: 'nuxt',
                    include: ['test/nuxt/**/*.test.ts'],
                    environment: 'nuxt'
                }
            }),
            {
                test: {
                    name: 'e2e',
                    include: ['test/e2e/**/*.test.ts'],
                    environment: 'node',
                    testTimeout: 60_000,
                    hookTimeout: 240_000
                }
            }
        ]
    }
})
