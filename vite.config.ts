import typescript from '@rollup/plugin-typescript'
import { resolve } from 'path'
import { typescriptPaths } from 'rollup-plugin-typescript-paths'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'


export default defineConfig({
    resolve: {
        alias: [
            {
                find: '~',
                replacement: resolve(__dirname, './src'),
            },
        ],
    },
    plugins: [
        dts({
            insertTypesEntry: true,
        }),
    ],
    server: {
        port: 3000,
    },
    build: {
        manifest: true,
        minify: true,
        reportCompressedSize: true,
        lib: {
            entry: [resolve(__dirname, 'src/main.ts')],
            name: 'sas-viya-api-wrappers-js',
            fileName: 'main',
        },
        rollupOptions: {
            external: ['@sassoftware/sas-auth-browser'],
            output: {
                globals: {
                    '@sassoftware/sas-auth-browser': 'SASAuth',
                },
            }
        },
    },
    preview: {
        port: 3000,
    },
})
