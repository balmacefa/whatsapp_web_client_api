// route.ts
import { Server } from "@hapi/hapi";
import { ENV } from "../server/global_variables";
import { WhatsAppClientDefineRoutes } from "./WA/WA_routes";

export const defineRoutes = async (server: Server) => {
    await WhatsAppClientDefineRoutes(server);

    // Ruta raíz "/"
    server.route({
        method: 'GET',
        path: '/',
        options: {
            description: 'Página de Bienvenida',
            notes: 'Retorna una página HTML de bienvenida con enlace a la documentación de Swagger.',
            tags: ['api'],
            // No requiere validación ya que es una página estática
        },
        handler: async (request, h) => {
            const htmlContent = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Bienvenido a la API de WhatsApp Client</title>
                <!-- Bootstrap CSS -->
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-ENjdO4Dr2bkBIFxQpeo6QwCUPib1t1Lg1ZlN4JNpG1S5Q5V2lXKgn5qLAzN6A8Q+" crossorigin="anonymous">
            </head>
            <body>
                <div class="container mt-5">
                    <div class="jumbotron text-center">
                        <h1 class="display-4">¡Bienvenido a la API de WhatsApp Client!</h1>
                        <p class="lead">Esta API te permite gestionar clientes de WhatsApp de manera eficiente.</p>
                        <hr class="my-4">
                        <p>Para ver la documentación completa y probar los endpoints, visita la interfaz de Swagger.</p>
                        <a class="btn btn-primary btn-lg" href="/documentation" role="button">Ir a la Documentación de Swagger</a>
                    </div>
                </div>
                <!-- Bootstrap JS y dependencias -->
                <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" integrity="sha384-kenU1KFdBIe4zVF0s0G1M5b4hcpxyD9F7jL+V9KK0Mkx0hi+4zDk87C9+u5dE9uM" crossorigin="anonymous"></script>
            </body>
            </html>
            `;

            return h.response(htmlContent).type('text/html');
        }
    });

    // Ruta /health
    server.route({
        method: 'GET',
        path: '/health',
        handler: (request, h) => {
            if (ENV.server_isHealthy) {
                return {
                    status: 'OK',
                    message: 'The server is healthy and running normally.',
                };
            }
            return h
                .response({
                    status: 'DOWN',
                    message: 'The server is currently unhealthy.',
                })
                .code(503);
        },
    });

    // Ruta /ready
    server.route({
        method: 'GET',
        path: '/ready',
        handler: (request, h) => {
            if (ENV.server_isReady) {
                return {
                    status: 'READY',
                    message: 'The server is ready to accept requests.',
                };
            }
            return h
                .response({
                    status: 'NOT READY',
                    message: 'The server is not ready to accept requests yet.',
                })
                .code(503);

        },
    });
}
