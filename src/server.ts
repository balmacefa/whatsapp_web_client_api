import cors from 'cors';
import express from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { defineRoutes } from './api/routes';
import { ENV } from './server/global_variables';

const swaggerOptions: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de WhatsApp Client',
            version: '1.0.0',
            description: 'Documentación de la API para gestionar clientes de WhatsApp',
        },
        servers: [{ url: `http://${ENV.HOST}:${ENV.PORT}/api` }],
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
    app.use(express.json());

    // Swagger setup
    const swaggerSpec = swaggerJSDoc(swaggerOptions);
    app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Define routes
    defineRoutes(app);

    return app;
};

export const startServer = async () => {
    const app = await createApp();
    const server = app.listen(ENV.PORT, () => {
        console.log(`Server running on http://${ENV.HOST}:${ENV.PORT}`);
        ENV.server_isReady = true;
        ENV.server_isHealthy = true;
    });

    return server;
};