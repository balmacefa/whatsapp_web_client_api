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
    <style>
        body {
            background-color: #f0f2f5;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .welcome-card {
            max-width: 600px;
            margin: auto;
            padding: 2rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            border-radius: 12px;
            background-color: #ffffff;
            transition: transform 0.3s;
        }
        .welcome-card:hover {
            transform: translateY(-10px);
        }
        .welcome-card h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            color: #25D366;
        }
        .welcome-card p.lead {
            font-size: 1.25rem;
            color: #4a4a4a;
        }
        .btn-custom {
            background-color: #25D366;
            border-color: #25D366;
            transition: background-color 0.3s, border-color 0.3s;
        }
        .btn-custom:hover {
            background-color: #1DA851;
            border-color: #1DA851;
        }
        @media (max-width: 576px) {
            .welcome-card {
                padding: 1.5rem;
            }
            .welcome-card h1 {
                font-size: 2rem;
            }
            .welcome-card p.lead {
                font-size: 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="container vh-100 d-flex justify-content-center align-items-center">
        <div class="welcome-card text-center">
            <h1>¡Bienvenido a la API de WhatsApp Client!</h1>
            <p class="lead">Esta API te permite gestionar clientes de WhatsApp de manera eficiente.</p>
            <hr class="my-4">
            <p>Para ver la documentación completa y probar los endpoints, visita la interfaz de Swagger.</p>
            <a class="btn btn-custom btn-lg mt-3" href="/documentation" role="button" aria-label="Ir a la Documentación de Swagger">Ir a la Documentación de Swagger</a>
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
