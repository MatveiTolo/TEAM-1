import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { env } from 'process';

const baseFolder =
    env.APPDATA !== undefined && env.APPDATA !== ''
        ? `${env.APPDATA}/ASP.NET/https`
        : `${env.HOME}/.aspnet/https`;

const certificateName = "caesar.client";
const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

if (!fs.existsSync(baseFolder)) {
    fs.mkdirSync(baseFolder, { recursive: true });
}

// Пытаемся выпустить дев-сертификат через dotnet. Если dotnet недоступен
// (CI, контейнер, контрибьютор без .NET SDK) — не падаем, а откатываемся на http.
let httpsEnabled = true;
if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
    try {
        const result = child_process.spawnSync('dotnet', [
            'dev-certs',
            'https',
            '--export-path',
            certFilePath,
            '--format',
            'Pem',
            '--no-password',
        ], { stdio: 'inherit' });
        if (result.status !== 0) {
            httpsEnabled = false;
            console.warn('[vite] Не удалось выпустить HTTPS-сертификат — dev-сервер будет работать по HTTP.');
        }
    } catch {
        httpsEnabled = false;
        console.warn('[vite] dotnet dev-certs недоступен — dev-сервер будет работать по HTTP.');
    }
}

const httpsConfig = httpsEnabled && fs.existsSync(certFilePath) && fs.existsSync(keyFilePath)
    ? { key: fs.readFileSync(keyFilePath), cert: fs.readFileSync(certFilePath) }
    : undefined;

const target = env.ASPNETCORE_HTTPS_PORT ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}` :
    env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : 'https://localhost:7217';

export default defineConfig({
    plugins: [plugin()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        proxy: {
            '^/weatherforecast': {
                target,
                secure: false
            },
            '/api': {
                target: 'http://localhost:5254',  // ← вот это добавили
                changeOrigin: true,
                secure: false,
            }
        },
        port: parseInt(env.DEV_SERVER_PORT || '51203'),
        https: httpsConfig
    }
})