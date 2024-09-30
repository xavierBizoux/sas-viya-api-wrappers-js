import basicSsl from '@vitejs/plugin-basic-ssl'
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
    resolve: {
        alias: { src: resolve('src/') },
    },
    server: {
        port: 3000,
        https: true,
    },
    plugins: [basicSsl()],
    build: {
        lib: { entry: [resolve(__dirname, 'src/ComputeSession.ts')], formats: ['es'] },
        target: 'esnext',
    },
    preview: {
        port: 3000,
        https: true,
    },
})
