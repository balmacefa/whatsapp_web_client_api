import { Server } from '@hapi/hapi';
import { MessageMedia } from 'whatsapp-web.js';
import { WhatsAppClientWrapper } from './WhatsAppClientWrapper';

export const WhatsAppClientDefineRoutes = async (server: Server) => {

    const wrapper = new WhatsAppClientWrapper();

    // Endpoint para crear un nuevo cliente
    server.route({
        method: 'POST',
        path: '/clients',
        handler: (request, h) => {
            const { id } = request.payload as { id: string };
            try {
                wrapper.createClient(id);
                return h.response({ message: `Client ${id} created successfully.` }).code(201);
            } catch (error: any) {
                return h.response({ error: error.message }).code(400);
            }
        },
    });

    // Endpoint para listar todos los clientes
    server.route({
        method: 'GET',
        path: '/clients',
        handler: (request, h) => {
            const clients = wrapper.listClients();
            return h.response({ clients });
        },
    });

    // Endpoint para obtener el estado de un cliente
    server.route({
        method: 'GET',
        path: '/clients/{id}/status',
        handler: (request, h) => {
            const { id } = request.params;
            try {
                const status = wrapper.getClientStatus(id);
                return h.response({ id, status });
            } catch (error: any) {
                return h.response({ error: error.message }).code(404);
            }
        },
    });

    // Endpoint para eliminar un cliente
    server.route({
        method: 'DELETE',
        path: '/clients/{id}',
        handler: (request, h) => {
            const { id } = request.params;
            try {
                wrapper.removeClient(id);
                return h.response({ message: `Client ${id} removed successfully.` });
            } catch (error: any) {
                return h.response({ error: error.message }).code(404);
            }
        },
    });

    // Endpoint para configurar el webhook de un cliente
    server.route({
        method: 'POST',
        path: '/clients/{id}/webhook',
        handler: (request, h) => {
            const { id } = request.params;
            const { url } = request.payload as { url: string };
            try {
                wrapper.setWebhook(id, url);
                return h.response({ message: `Webhook set for client ${id}.` });
            } catch (error: any) {
                return h.response({ error: error.message }).code(400);
            }
        },
    });

    // Endpoint para enviar un mensaje desde un cliente
    server.route({
        method: 'POST',
        path: '/clients/{id}/send-message',
        handler: async (request, h) => {
            const { id } = request.params;
            const { to, message } = request.payload as { to: string; message: string };
            try {
                await wrapper.sendMessage(id, to, message);
                return h.response({ message: `Message sent to ${to} from client ${id}.` });
            } catch (error: any) {
                return h.response({ error: error.message }).code(400);
            }
        },
    });

    // Endpoint para enviar un archivo desde un cliente
    server.route({
        method: 'POST',
        path: '/clients/{id}/send-media',
        handler: async (request, h) => {
            const { id } = request.params;
            const { to, file, caption } = request.payload as { to: string; file: string; caption?: string };
            try {
                const media = MessageMedia.fromFilePath(file); // Leer el archivo local
                await wrapper.sendMedia(id, to, media, caption);
                return h.response({ message: `Media sent to ${to} from client ${id}.` });
            } catch (error: any) {
                return h.response({ error: error.message }).code(400);
            }
        },
    });

    // Endpoint para obtener el QR de un cliente
    server.route({
        method: 'GET',
        path: '/clients/{id}/qr',
        handler: (request, h) => {
            const { id } = request.params;
            try {
                const qr = wrapper.getQRCode(id);
                if (qr) {
                    return h.response({ qr }).type('application/json');
                } else {
                    return h.response({ message: `No QR code available for client ${id}.` }).code(404);
                }
            } catch (error: any) {
                return h.response({ error: error.message }).code(404);
            }
        },
    });


};


