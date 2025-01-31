// wrappers/WhatsAppClientWrapper.ts

import axios from 'axios';
import * as fs from 'fs';
import path from 'path';
import * as qrcode from 'qrcode';
import WAWebJS, { Client, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js';
import { ClientModel, ClientRepository } from './items_db_repository';

export interface ClientConfig {
    id: string;
    webhookUrl: string;
}

export interface ClientInfo {
    id: string;
    webhookUrl: string | undefined;
}

export class WhatsAppClientWrapper {
    private clients: Map<string, Client>;
    private qrCodes: Map<string, string>; // Almacena los códigos QR en base64
    private clientRepository: ClientRepository;

    constructor(clientRepository: ClientRepository) {
        this.clients = new Map();
        this.qrCodes = new Map();
        this.clientRepository = clientRepository;
    }

    /**
     * Inicializa la tabla de clientes y restaura las sesiones existentes.
     */
    async initialize(): Promise<void> {
        await this.clientRepository.initializeClientsTable();
        const clients = await this.clientRepository.listAllClients();
        for (const client of clients) {
            await this.createClient(client.id);
        }
    }

    /**
     * Agrega un nuevo cliente: lo guarda en la DB y lo inicializa.
     * @param config - Configuración del cliente que incluye el ID y el webhookUrl.
     */
    async addClient(config: ClientConfig): Promise<void> {
        const { id, webhookUrl } = config;

        // Verificar si el cliente ya existe en la DB
        const existingClient = await this.clientRepository.getClientById(id);
        if (existingClient) {
            throw new Error(`El cliente con ID ${id} ya existe en la base de datos.`);
        }

        // Guardar el cliente en la base de datos
        const newClient: ClientModel = {
            id,
            webhook_url: webhookUrl,
        };

        try {
            await this.clientRepository.createClient(newClient);
            console.log(`Cliente ${id} guardado en la base de datos.`);
        } catch (error) {
            console.error(`Error al guardar el cliente ${id} en la base de datos:`, error);
            throw error;
        }

        // Inicializar el cliente
        try {
            await this.createClient(id);
            console.log(`Cliente ${id} inicializado correctamente.`);
        } catch (error) {
            console.error(`Error al inicializar el cliente ${id}:`, error);
            // Opcional: eliminar el cliente de la DB si la inicialización falla
            await this.clientRepository.deleteClient(id);
            throw error;
        }
    }

    /**
     * Crea e inicializa un cliente de WhatsApp para el ID proporcionado.
     * @param id - El identificador único para el cliente.
     */
    private async createClient(id: string): Promise<void> {
        if (this.clients.has(id)) {
            console.warn(`El cliente con ID ${id} ya está inicializado.`);
            return;
        }

        const client = new Client({
            authStrategy: new LocalAuth({ clientId: id, dataPath: './data/wwebjs_auth' }), // Usar LocalAuth para múltiples sesiones
        });

        client.on('qr', async (qr) => {
            console.log(`QR RECIBIDO para el cliente ${id}`);
            // Convertir el QR a base64
            const qrBase64 = await qrcode.toDataURL(qr);
            this.qrCodes.set(id, qrBase64);

            // Enviar el QR al webhook si está configurado
            const webhookUrl = await this.getWebhookUrl(id);
            if (webhookUrl) {
                axios.post(webhookUrl, {
                    type: 'qr',
                    payload: {
                        clientId: id,
                        qr: qrBase64,
                    },
                });
            }
        });

        client.on('ready', async () => {
            console.log(`Cliente ${id} está listo!`);
            this.qrCodes.delete(id); // Eliminar el QR una vez que el cliente esté listo

            // Enviar un mensaje al webhook para notificar que el cliente está listo
            const webhookUrl = await this.getWebhookUrl(id);
            if (webhookUrl) {
                axios.post(webhookUrl, {
                    type: 'ready',
                    payload: {
                        clientId: id,
                    },
                });
            }

        });

        client.on('message', async (msg: Message) => {
            console.log(`Mensaje recibido del cliente ${id}:`, msg.body);
            const webhookUrl = await this.getWebhookUrl(id);
            if (webhookUrl) {
                try {
                    const payload: any = {
                        from: msg.from,
                        body: msg.body,
                        timestamp: msg.timestamp,
                        clientId: id,
                    };

                    // Si el mensaje tiene medios, descargarlos y agregarlos al payload
                    if (msg.hasMedia) {
                        const media = await msg.downloadMedia();
                        if (media) {
                            payload.media = {
                                mimetype: media.mimetype,
                                data: media.data,
                                filename: media.filename,
                            };
                        }
                    }

                    await axios.post(webhookUrl, {
                        type: 'message',
                        payload,
                    });
                    console.log(`Mensaje enviado al webhook para el cliente ${id}`);
                } catch (error) {
                    console.error(`Error al enviar el mensaje al webhook para el cliente ${id}:`, error);
                }
            }
        });

        client.on('disconnected', async (reason) => {

            console.log(`Cliente ${id} desconectado. Motivo: ${reason}`);

            // Enviar un mensaje al webhook para notificar que el cliente está desconectado
            const webhookUrl = await this.getWebhookUrl(id);
            if (webhookUrl) {
                axios.post(webhookUrl, {
                    type: 'disconnected',
                    payload: {
                        clientId: id,
                        reason,
                    },
                });
            }

        });

        client.on('auth_failure', async (msg) => {
            console.error(`Error de autenticación para el cliente ${id}:`, msg);

            // Enviar un mensaje al webhook para notificar el error de autenticación
            const webhookUrl = await this.getWebhookUrl(id);
            if (webhookUrl) {
                axios.post(webhookUrl, {
                    type: 'auth_failure',
                    payload: {
                        clientId: id,
                        message: msg,
                    },
                });
            }

        });

        client.on('change_state', async (state) => {
            console.log(`Estado del cliente ${id}:`, state);
            // Enviar un mensaje al webhook para notificar el cambio de estado
            const webhookUrl = await this.getWebhookUrl(id);
            if (webhookUrl) {
                axios.post(webhookUrl, {
                    type: 'change_state',
                    payload: {
                        clientId: id,
                        state,
                    },
                });
            }
        });

        try {
            await client.initialize();
            this.clients.set(id, client);
        } catch (error) {
            console.error(`Error al inicializar el cliente ${id}:`, error);
            throw error;
        }
    }

    /**
     * Restaura múltiples sesiones a partir de un array de configuraciones de clientes.
     * Este método asume que los clientes ya existen en la base de datos.
     * @param configs - Array de configuraciones de clientes que contienen el ID y el webhookUrl.
     */
    async restoreSessions(configs: ClientConfig[]): Promise<void> {
        for (const config of configs) {
            const { id, webhookUrl } = config;
            try {
                // Verificar si el cliente ya existe en la DB
                const existingClient = await this.clientRepository.getClientById(id);
                if (!existingClient) {
                    // Si no existe, crear y guardar el cliente
                    const newClient: ClientModel = { id, webhook_url: webhookUrl };
                    await this.clientRepository.createClient(newClient);
                    console.log(`Cliente ${id} guardado en la base de datos.`);
                }
                await this.createClient(id);
                console.log(`Cliente ${id} iniciado correctamente con webhook ${webhookUrl}.`);
            } catch (error) {
                console.error(`Error al iniciar el cliente ${id}:`, error);
            }
        }
    }

    /**
     * Retorna una lista de todos los clientes con sus respectivos webhooks.
     * @returns Array de objetos que contienen el ID del cliente y su webhookUrl.
     */
    async getClientsInfo(): Promise<ClientInfo[]> {
        const clients = await this.clientRepository.listAllClients();
        return clients.map(client => ({
            id: client.id,
            webhookUrl: client.webhook_url,
        }));
    }

    /**
     * Configura el webhook para un cliente específico y actualiza la base de datos.
     * @param id - El identificador único para el cliente.
     * @param url - La URL del webhook.
     */
    async setWebhook(id: string, url: string): Promise<void> {
        const client = this.clients.get(id);
        if (!client) {
            throw new Error(`Cliente con ID ${id} no encontrado.`);
        }
        try {
            await this.clientRepository.updateWebhook(id, url);
            console.log(`Webhook configurado para el cliente ${id}: ${url}`);
        } catch (error) {
            console.error(`Error al actualizar el webhook para el cliente ${id}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene la URL del webhook para un cliente específico.
     * @param id - El identificador único para el cliente.
     * @returns La URL del webhook o undefined si no está configurada.
     */
    async getWebhookUrl(id: string): Promise<string | undefined> {
        const client = await this.clientRepository.getClientById(id);
        return client?.webhook_url;
    }

    /**
     * Envía un mensaje de texto a un destinatario específico.
     * @param id - El identificador único para el cliente.
     * @param to - El número de teléfono del destinatario en formato internacional.
     * @param message - El contenido del mensaje.
     */
    async sendMessage(id: string, to: string, message: string): Promise<void> {
        const client = this.clients.get(id);
        if (!client) {
            throw new Error(`Cliente con ID ${id} no encontrado.`);
        }

        // if the status is qr, the client is not ready yet
        if (this.getClientStatus(id) === 'qr') {
            throw new Error(`El cliente ${id} no está listo para enviar mensajes. Escanea el código QR primero.`);
        }

        try {
            await client.sendMessage(to, message);
            console.log(`Mensaje enviado a ${to} desde el cliente ${id}`);
        } catch (error) {
            console.error(`Error al enviar el mensaje desde el cliente ${id}:`, error);
            throw error;
        }
    }

    /**
     * Envía un mensaje de medios a un destinatario específico.
     * @param id - El identificador único para el cliente.
     * @param to - El número de teléfono del destinatario en formato internacional.
     * @param media - El contenido de medios a enviar.
     * @param caption - (Opcional) Una leyenda para el medio.
     */
    async sendMedia(id: string, to: string, media: MessageMedia, caption?: string): Promise<void> {
        const client = this.clients.get(id);
        if (!client) {
            throw new Error(`Cliente con ID ${id} no encontrado.`);
        }
        try {
            await client.sendMessage(to, media, { caption });
            console.log(`Medios enviados a ${to} desde el cliente ${id}`);
        } catch (error) {
            console.error(`Error al enviar medios desde el cliente ${id}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene el código QR en base64 para un cliente específico.
     * @param id - El identificador único para el cliente.
     * @returns El código QR en base64 o undefined si no está disponible.
     */
    getQRCode(id: string): string | undefined {
        return this.qrCodes.get(id);
    }

    /**
     * Elimina un cliente, destruye la sesión y elimina los registros de la base de datos.
     * @param id - El identificador único para el cliente.
     */
    async removeClient(id: string): Promise<void> {
        const client = this.clients.get(id);
        const executionPath = process.cwd();
        const sessionPath = path.join(executionPath, 'data', 'wwebjs_auth', `session-${id}`);
        // `${executionPath}/data/wwebjs_auth/session-${id}`;

        // data\wwebjs_auth \session-me
        function deleteFolder() {
            if (fs.existsSync(sessionPath)) {
                fs.rm(sessionPath, { recursive: true }, (err) => {
                    if (err) {
                        console.error(`Error al eliminar el directorio de la sesión ${id}:`, err);
                        throw err;
                    }
                });
                console.log(`Cliente ${id} eliminado.`);
            }
        }

        if (client) {
            try {
                // await client.logout();
                await client.destroy();
                this.clients.delete(id);
                await this.clientRepository.deleteClient(id);
                this.qrCodes.delete(id);

                deleteFolder();
                console.log(`Cliente ${id} eliminado.`);
            } catch (error) {
                console.error(`Error al eliminar el cliente ${id}:`, error);
                throw error;
            }
        } else {
            deleteFolder();
            throw new Error(`Cliente con ID ${id} no encontrado.`);
        }
    }

    /**
     * List all clients with their webhook URL, QR code (if available), and status.
     * @returns Array of client objects containing id, webhookUrl, qr, and status.
     */
    async listClients(): Promise<Array<{
        id: string;
        webhookUrl: string | undefined;
        qr: string | undefined;
        status: string;
    }>> {
        const clientsInfo = await this.getClientsInfo();
        return clientsInfo.map(client => ({
            id: client.id,
            webhookUrl: client.webhookUrl,
            qr: this.getQRCode(client.id),
            status: this.getClientStatus(client.id),
        }));
    }

    /**
     * Obtiene el estado de un cliente específico.
     * @param id - El identificador único para el cliente.
     * @returns El estado del cliente ('listo' o 'inicializando').
     */
    getClientStatus(id: string): string {
        const client = this.clients.get(id);
        if (!client) {
            throw new Error(`Cliente con ID ${id} no encontrado.`);
        }
        // if there is a qr code, the client is not ready yet is on QR code stage
        if (this.qrCodes.has(id)) {
            return 'qr';
        }
        return client.info ? 'listo' : 'inicializando';
    }

    // get contacts
    async getContacts(id: string): Promise<WAWebJS.Contact[]> {
        const client = this.clients.get(id);
        if (!client) {
            throw new Error(`Cliente con ID ${id} no encontrado.`);
        }
        return await client.getContacts();
    }

    // get chat messages history
    async getChatMessages(id: string, contactId: string, limit?: number): Promise<WAWebJS.Message[]> {
        const client = this.clients.get(id);
        if (!client) {
            throw new Error(`Cliente con ID ${id} no encontrado.`);
        }

        try {
            const chat = await client.getChatById(contactId);

            if (!chat) {
                throw new Error(`No se encontró el chat con el ID ${contactId}`);
            }

            const messages = await chat.fetchMessages({ limit });

            return messages;

        } catch (error) {
            console.error(`Error al obtener el chat con el ID ${contactId}:`, error);
            throw error;
        }

    }
}
