import typescript from '@rollup/plugin-typescript'
import { resolve } from 'path'
import { typescriptPaths } from 'rollup-plugin-typescript-paths'
import { defineConfig } from 'vite'

export default defineConfig({
    resolve: {
        alias: [
            {
                find: '~',
                replacement: resolve(__dirname, './src'),
            },
        ],
    },
    plugins: [],
    server: {
        port: 3000,
    },
    build: {
        manifest: true,
        minify: true,
        reportCompressedSize: true,
        lib: {
            entry: [resolve(__dirname, 'src/main.ts')],
            fileName: 'main',
            formats: ['es', 'cjs'],
        },
        rollupOptions: {
            external: [],
            plugins: [
                typescriptPaths({
                    preserveExtensions: true,
                }),
                typescript({
                    sourceMap: false,
                    declaration: true,
                    outDir: 'dist',
                }),
            ],
        },
    },
    preview: {
        port: 3000,
    },
})
