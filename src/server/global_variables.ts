import fs from 'fs';
import dotenv from 'dotenv';

if (fs.existsSync('.env')) {
    dotenv.config();
    console.log('[ENV] Archivo .env encontrado y cargado.');
} else {
    console.warn('[ENV] Archivo .env no encontrado. Usando variables de entorno existentes.');
}

export const ENV = {
    PORT: Number(process.env.PORT || 3000),
    PROD_HOST: process.env.PROD_HOST || 'http://localhost:3000',
    API_KEYS: (process.env.API_KEYS || 'secure_api_key,change_me').split(','),
    server_isHealthy: false,
    server_isReady: false,
};
