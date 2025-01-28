// route.ts
import { Server } from '@hapi/hapi';
import Joi from 'joi';
import { MessageMedia } from 'whatsapp-web.js';
import { ClientConfig, WhatsAppClientWrapper } from './WhatsAppClientWrapper';
import { ClientRepository } from './items_db_repository';

export const WhatsAppClientDefineRoutes = async (server: Server) => {
    const clientRepository = new ClientRepository();
    const whatsappWrapper = new WhatsAppClientWrapper(clientRepository);

    // Inicializar la tabla de clientes y restaurar sesiones existentes
    await whatsappWrapper.initialize();

    // Esquemas de validación con Joi
    const clientConfigSchema = Joi.object({
        id: Joi.string().required().description('ID único del cliente'),
        webhookUrl: Joi.string().uri().required().description('URL del webhook del cliente'),
    });

    const sendMessageSchema = Joi.object({
        to: Joi.string().required().description('Número de destino'),
        message: Joi.string().required().description('Contenido del mensaje'),
    });

    const sendMediaSchema = Joi.object({
        to: Joi.string().required().description('Número de destino'),
        file: Joi.string().required().description('Ruta del archivo a enviar'),
        caption: Joi.string().optional().description('Leyenda del archivo'),
    });

    const setWebhookSchema = Joi.object({
        url: Joi.string().uri().required().description('Nueva URL del webhook'),
    });

    // Endpoint para crear un nuevo cliente
    server.route({
        method: 'POST',
        path: '/clients',
        options: {
            description: 'Crear un nuevo cliente',
            notes: 'Este endpoint permite crear un nuevo cliente de WhatsApp.',
            tags: ['api', 'clients'],
            validate: {
                payload: clientConfigSchema,
            },
            response: {
                status: {
                    201: Joi.object({
                        id: Joi.string(),
                        webhookUrl: Joi.string().uri(),
                        message: Joi.string(),
                    }),
                    400: Joi.object({
                        error: Joi.string(),
                    }),
                },
            },
        },
        handler: (request, h) => {
            try {
                const { id, webhookUrl } = request.payload as ClientConfig;
                whatsappWrapper.addClient({ id, webhookUrl });
                return h
                    .response({
                        id,
                        webhookUrl,
                        message: `Client ${id} created successfully.`,
                    })
                    .code(201);
            } catch (error: any) {
                return h.response({ error: error.message }).code(400);
            }
        },
    });

    // Endpoint para listar todos los clientes
    server.route({
        method: 'GET',
        path: '/clients',
        options: {
            description: 'Listar todos los clientes',
            notes: 'Este endpoint retorna una lista de todos los clientes registrados.',
            tags: ['api', 'clients'],
            response: {
                status: {
                    200: Joi.object({
                        clients: Joi.array().items(
                            Joi.object({
                                id: Joi.string(),
                                webhookUrl: Joi.string().uri(),
                            })
                        ),
                    }),
                },
            },
        },
        handler: (request, h) => {
            try {
                const clients = whatsappWrapper.listClients();
                return h.response({ clients });

            } catch (error) {

                return h.response({ error: error.message }).code(400);
            }
        },
    });

    // Endpoint para obtener el estado de un cliente
    server.route({
        method: 'GET',
        path: '/clients/{id}/status',
        options: {
            description: 'Obtener el estado de un cliente',
            notes: 'Este endpoint retorna el estado actual de un cliente específico.',
            tags: ['api', 'clients'],
            validate: {
                params: Joi.object({
                    id: Joi.string().required().description('ID del cliente'),
                }),
            },
            response: {
                status: {
                    200: Joi.object({
                        id: Joi.string(),
                        status: Joi.string(),
                    }),
                    404: Joi.object({
                        error: Joi.string(),
                    }),
                },
            },
        },
        handler: (request, h) => {
            try {
                const { id } = request.params as { id: string };
                const status = whatsappWrapper.getClientStatus(id);
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
        options: {
            description: 'Eliminar un cliente',
            notes: 'Este endpoint elimina un cliente específico.',
            tags: ['api', 'clients'],
            validate: {
                params: Joi.object({
                    id: Joi.string().required().description('ID del cliente'),
                }),
            },
            response: {
                status: {
                    200: Joi.object({
                        message: Joi.string(),
                    }),
                    404: Joi.object({
                        error: Joi.string(),
                    }),
                },
            },
        },
        handler: (request, h) => {
            try {
                const { id } = request.params as { id: string };
                whatsappWrapper.removeClient(id);
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
        options: {
            description: 'Configurar webhook de un cliente',
            notes: 'Este endpoint actualiza la URL del webhook para un cliente específico.',
            tags: ['api', 'clients'],
            validate: {
                params: Joi.object({
                    id: Joi.string().required().description('ID del cliente'),
                }),
                payload: setWebhookSchema,
            },
            response: {
                status: {
                    200: Joi.object({
                        message: Joi.string(),
                    }),
                    400: Joi.object({
                        error: Joi.string(),
                    }),
                },
            },
        },
        handler: (request, h) => {
            try {
                const { id } = request.params as { id: string };
                const { url } = request.payload as { url: string };
                whatsappWrapper.setWebhook(id, url);
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
        options: {
            description: 'Enviar un mensaje desde un cliente',
            notes: 'Este endpoint permite enviar un mensaje de texto desde un cliente específico.',
            tags: ['api', 'clients', 'messages'],
            validate: {
                params: Joi.object({
                    id: Joi.string().required().description('ID del cliente'),
                }),
                payload: sendMessageSchema,
            },
            response: {
                status: {
                    200: Joi.object({
                        message: Joi.string(),
                    }),
                    400: Joi.object({
                        error: Joi.string(),
                    }),
                },
            },
        },
        handler: async (request, h) => {
            try {
                const { id } = request.params as { id: string };
                const { to, message } = request.payload as { to: string; message: string };
                await whatsappWrapper.sendMessage(id, to, message);
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
        options: {
            description: 'Enviar un archivo desde un cliente',
            notes: 'Este endpoint permite enviar un archivo multimedia desde un cliente específico.',
            tags: ['api', 'clients', 'media'],
            validate: {
                params: Joi.object({
                    id: Joi.string().required().description('ID del cliente'),
                }),
                payload: sendMediaSchema,
            },
            response: {
                status: {
                    200: Joi.object({
                        message: Joi.string(),
                    }),
                    400: Joi.object({
                        error: Joi.string(),
                    }),
                },
            },
        },
        handler: async (request, h) => {
            try {
                const { id } = request.params as { id: string };
                const { to, file, caption } = request.payload as { to: string; file: string; caption?: string };
                const media = MessageMedia.fromFilePath(file); // Leer el archivo local
                await whatsappWrapper.sendMedia(id, to, media, caption);
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
        options: {
            description: 'Obtener el QR de un cliente',
            notes: 'Este endpoint retorna el código QR para un cliente específico.',
            tags: ['api', 'clients', 'qr'],
            validate: {
                params: Joi.object({
                    id: Joi.string().required().description('ID del cliente'),
                }),
            },
            response: {
                status: {
                    200: Joi.object({
                        qr: Joi.string(),
                    }),
                    404: Joi.object({
                        message: Joi.string(),
                        error: Joi.string(),
                    }),
                },
            },
        },
        handler: (request, h) => {
            try {
                const { id } = request.params as { id: string };
                const qr = whatsappWrapper.getQRCode(id);
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
