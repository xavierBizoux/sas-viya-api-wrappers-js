import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
    resolve: {
        alias: {
            '@/': new URL('./src/', import.meta.url).pathname,
        },
    },
    plugins: [],
    server: { 
        port: 3000,
    },
    build: {
        manifest: true,
        minify: true,
        reportCompressedSize: true,
        outDir: 'dist',
        lib: {
            entry: [resolve(__dirname, 'src/index.ts')],
            name: 'sas-viya-api-wrappers-js',
            fileName: (format) => `sas-viya-api-wrappers-js.${format}.js`,
        },
        target: 'esnext',
        rollupOptions: {
            external: ['@sassoftware/sas-auth-browser'],
            output: {
                globals: {
                    '@sassoftware/sas-auth-browser': 'SASAuthBrowser',
                },
            },
        },
    },
    preview: {
        port: 3000,
    },
})
