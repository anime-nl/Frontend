import {fileURLToPath} from 'node:url'
import {defineConfig} from 'vitest/config'
import {defineVitestProject} from '@nuxt/test-utils/config'

export default defineConfig({
    test: {
        // Every worker holds a Nuxt environment or a full Nuxt build in memory. The default (one worker
        // per core) exhausts the RAM of a typical dev machine
        maxWorkers: 4,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json-summary', 'html'],
            // The Medusa backend under medusa/ is a separate repository (git submodule), so it's excluded
            include: ['app/**', 'server/**', 'shared/**'],
            thresholds: {
                lines: 80,
                statements: 80,
                functions: 80,
                branches: 80
            }
        },
        // Vitest refuses projects with different worker counts in the same group, and the projects below
        // do not inherit maxWorkers (e2e runs one file at a time), so each one gets its own group
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
                    sequence: {groupOrder: 1},
                    include: ['test/nuxt/**/*.test.ts'],
                    environment: 'nuxt'
                }
            }),
            {
                test: {
                    name: 'e2e',
                    sequence: {groupOrder: 2},
                    include: ['test/e2e/**/*.test.ts'],
                    environment: 'node',
                    // Each file builds the whole app, so running them side by side multiplies the memory use
                    fileParallelism: false,
                    testTimeout: 60_000,
                    hookTimeout: 240_000
                }
            }
        ]
    }
})
