import { Server } from "@hapi/hapi";
import { ENV } from "../server/global_variables";
import { WhatsAppClientDefineRoutes } from "./WA/WA_routes";


export const defineRoutes = async (server: Server) => {
    await WhatsAppClientDefineRoutes(server);
    server.route({
        method: 'GET',
        path: '/',
        handler: async (request, h) => {
            return {
                ok: true
            }
        }
    });

    // Route /health
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

    // Route /ready
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