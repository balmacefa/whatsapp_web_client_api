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
        res.send(
            `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>API Documentation</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body class="bg-light">
            <div class="container text-center mt-5">
            <div class="row">
                <div class="col">
                    <h1 class="mb-4">Welcome to the WhatsApp API</h1>
                    <p class="lead">Version: ${packageJson.version}</p>
                    <p class="lead">This API provides several functionalities to manage WhatsApp clients and messages:</p>
                    <ul class="list-group list-group-flush text-start d-inline-block">
                        <li class="list-group-item"><strong>Client Management:</strong> Create, list, delete, and update clients.</li>
                        <li class="list-group-item"><strong>Messaging:</strong> Send text and media messages.</li>
                        <li class="list-group-item"><strong>QR Code:</strong> Retrieve QR codes for authentication.</li>
                        <li class="list-group-item"><strong>Contacts:</strong> Fetch contact lists.</li>
                        <li class="list-group-item"><strong>Chats:</strong> Retrieve chat history.</li>
                    </ul>
                </div>
                    
                <div class="col">
                    <h2 class="mt-4">API Documentation</h2>
                    <p class="lead">You can find the API documentation below:</p>
                    <a href="/swagger" class="btn btn-primary mt-4">Go to Swagger UI</a>
                </div>
            </div>
            </div>
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
        </body>
        </html>
        `);
    });


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