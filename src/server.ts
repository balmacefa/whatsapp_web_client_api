import cors from 'cors';
import express from 'express';
import { readFileSync } from "fs";
import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { defineRoutes } from './api/routes';
import { ENV } from './server/global_variables';



const executionPath = process.cwd();
const packageJsonPath = path.join(executionPath, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

const swaggerOptions: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de WhatsApp Client',
            version: packageJson.version,
            description: 'Documentación de la API para gestionar clientes de WhatsApp',
        },
        servers: [{ url: ENV.PROD_HOST }],
        tags: [
            { name: 'clients', description: 'Client operations' },
            { name: 'messages', description: 'Message operations' },
            { name: 'media', description: 'Media operations' },
            { name: 'qr', description: 'QR code operations' },
        ],
    },
    apis: ['./src/api/routes.*'], // Path to the API routes
};

export const createApp = async () => {
    const app = express();

    // Middleware
    app.use(cors());
    // Middleware
    app.use(cors());
    // Aumentamos el límite de la petición para JSON y urlencoded
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    // Swagger setup
    const swaggerSpec = swaggerJSDoc(swaggerOptions);
    app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    app.get('/', (req, res) => {
    res.redirect('/swagger');
    });

    // Define routes
    defineRoutes(app);

    return app;
};

export const startServer = async () => {
    const app = await createApp();
    const server = app.listen(ENV.PORT, () => {
        console.log(`Server running on ${ENV.PROD_HOST} , on Port: ${ENV.PORT}`);
        ENV.server_isReady = true;
        ENV.server_isHealthy = true;
    });

    return server;
};