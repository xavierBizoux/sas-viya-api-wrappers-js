import basicSsl from '@vitejs/plugin-basic-ssl'
import { resolve } from 'path'
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
        basicSsl(),
        dts({
            insertTypesEntry: true,
        }),
    ],
    server: {
        port: 3000,
        https: true,
    },
    build: {
        manifest: true,
        minify: true,
        reportCompressedSize: true,
        lib: {
            entry: [resolve(__dirname, 'src/main.ts')],
            name: 'sas-viya-api-wrappers-js',
            fileName: 'sas-viya-api-wrappers-js',
        },
    },
    preview: {
        port: 3000,
    },
})
