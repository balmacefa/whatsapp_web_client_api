// wrappers/WhatsAppClientWrapper.ts

import axios from 'axios';
import * as fs from 'fs';
import path from 'path';
import * as qrcode from 'qrcode';
import WAWebJS, { Client, Events, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js';
import { convertToOggOpus } from './AudioconvertToOggOpus';
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
    private qrCodes: Map<string, string>; // Stores QR codes in base64
    private clientRepository: ClientRepository;

    constructor(clientRepository: ClientRepository) {
        this.clients = new Map();
        this.qrCodes = new Map();
        this.clientRepository = clientRepository;
    }

    /**
     * Initializes the client table and restores existing sessions.
     */
    async initialize(): Promise<void> {
        await this.clientRepository.initializeClientsTable();
        const clients = await this.clientRepository.listAllClients();
        for (const client of clients) {
            await this.createClient(client.id);
        }
    }

    /**
     * Adds a new client: saves it to the DB and initializes it.
     * @param config - Client configuration including ID and webhookUrl.
     */
    async addClient(config: ClientConfig): Promise<void> {
        const { id, webhookUrl } = config;

        // Check if the client already exists in the DB
        const existingClient = await this.clientRepository.getClientById(id);
        if (existingClient) {
            throw new Error(`El cliente con ID ${id} ya existe en la base de datos.`);
        }

        // Save the client in the DB
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

        // Initialize the client
        try {
            await this.createClient(id);
            console.log(`Cliente ${id} inicializado correctamente.`);
        } catch (error) {
            console.error(`Error al inicializar el cliente ${id}:`, error);
            // Optionally: remove the client from the DB if initialization fails
            await this.clientRepository.deleteClient(id);
            throw error;
        }
    }

    /**
     * Creates and initializes a WhatsApp client for the given ID.
     * @param id - The unique identifier for the client.
     */
    private async createClient(id: string): Promise<void> {
        if (this.clients.has(id)) {
            console.warn(`El cliente con ID ${id} ya está inicializado.`);
            return;
        }

        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: id,
                dataPath: './data/wwebjs_auth'
            }),
            puppeteer: {
                args: ["--no-sandbox", '--disable-setuid-sandbox'],
                headless: true,
            }
        });

        client.on('qr', async (qr) => {
            console.log(`QR RECIBIDO para el cliente ${id}`);
            // Convert the QR code to base64
            const qrBase64 = await qrcode.toDataURL(qr);
            this.qrCodes.set(id, qrBase64);

            await this.sendWebhook(id, {
                type: 'qr',
                payload: {
                    clientId: id,
                    qr: qrBase64,
                },
            });
        });

        client.on('ready', async () => {
            console.log(`Cliente ${id} está listo!`);
            this.qrCodes.delete(id); // Remove QR code once client is ready

            // Notify webhook that the client is ready
            await this.sendWebhook(id, {
                type: 'ready',
                payload: {
                    clientId: id,
                },
            });
        });

        client.on(Events.MESSAGE_RECEIVED, async (msg: Message) => {
            console.log(`Mensaje recibido del cliente ${id}:`, msg.body);

            const payload: any = {
                from: msg.from,
                body: msg.body,
                timestamp: msg.timestamp,
                msg,
                clientId: id,
            };

            // If the message has media, download it and add to the payload
            if (msg.hasMedia) {
                const media = await msg.downloadMedia();
                if (media) {
                    payload.media = {
                        mimetype: media.mimetype,
                        data_base_64: media.data,
                        filename: media.filename,
                    };
                }
            }

            await this.sendWebhook(id, {
                type: Events.MESSAGE_RECEIVED,
                payload,
            });

        });

        client.on('disconnected', async (reason) => {
            console.log(`Cliente ${id} desconectado. Motivo: ${reason}`);

            // Notify webhook that the client is disconnected
            await this.sendWebhook(id, {
                type: 'disconnected',
                payload: {
                    clientId: id,
                    reason,
                },
            });
        });

        client.on('auth_failure', async (msg) => {
            console.error(`Error de autenticación para el cliente ${id}:`, msg);

            // Notify webhook about authentication failure
            await this.sendWebhook(id, {
                type: 'auth_failure',
                payload: {
                    clientId: id,
                    message: msg,
                },
            });
        });

        client.on('change_state', async (state) => {
            console.log(`Estado del cliente ${id}:`, state);
            // Notify webhook about state change
            await this.sendWebhook(id, {
                type: 'change_state',
                payload: {
                    clientId: id,
                    state,
                },
            });
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
     * Restores multiple sessions from an array of client configurations.
     * Assumes the clients already exist in the database.
     * @param configs - Array of client configurations with ID and webhookUrl.
     */
    async restoreSessions(configs: ClientConfig[]): Promise<void> {
        for (const config of configs) {
            const { id, webhookUrl } = config;
            try {
                // Check if the client already exists in the DB
                const existingClient = await this.clientRepository.getClientById(id);
                if (!existingClient) {
                    // If not, create and save the client
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
     * Returns a list of all clients with their respective webhooks.
     * @returns Array of objects containing client ID and webhookUrl.
     */
    async getClientsInfo(): Promise<ClientInfo[]> {
        const clients = await this.clientRepository.listAllClients();
        return clients.map(client => ({
            id: client.id,
            webhookUrl: client.webhook_url,
        }));
    }

    /**
     * Configures the webhook for a specific client and updates the database.
     * @param id - The unique identifier for the client.
     * @param url - The webhook URL.
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
     * Gets the webhook URL for a specific client.
     * @param id - The unique identifier for the client.
     * @returns The webhook URL or undefined if not configured.
     */
    async getWebhookUrl(id: string): Promise<string | undefined> {
        const client = await this.clientRepository.getClientById(id);
        return client?.webhook_url;
    }

    /**
     * Sends a text message to a specific recipient.
     * @param id - The unique identifier for the client.
     * @param to - The recipient's phone number in international format.
     * @param message - The message content.
     */
    async sendMessage(id: string, to: string, message: string): Promise<void> {
        const client = this.clients.get(id);
        if (!client) {
            throw new Error(`Cliente con ID ${id} no encontrado.`);
        }

        // If the status is "qr", the client is not ready yet
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
     * Sends a media message to a specific recipient.
     * @param id - The unique identifier for the client.
     * @param to - The recipient's phone number in international format.
     * @param media - The media content to send.
     * @param caption - (Optional) A caption for the media.
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
     * Retrieves the QR code in base64 for a specific client.
     * @param id - The unique identifier for the client.
     * @returns The QR code in base64 or undefined if not available.
     */
    getQRCode(id: string): string | undefined {
        return this.qrCodes.get(id);
    }

    /**
     * Removes a client: destroys the session and removes DB records.
     * @param id - The unique identifier for the client.
     */
    async removeClient(id: string): Promise<void> {
        const client = this.clients.get(id);
        const executionPath = process.cwd();
        const sessionPath = path.join(executionPath, 'data', 'wwebjs_auth', `session-${id}`);
        // `${executionPath}/data/wwebjs_auth/session-${id}`;

        // data\wwebjs_auth\session-me
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
     * Lists all clients with their webhook URL, QR code (if available), and status.
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
     * Retrieves the status of a specific client.
     * @param id - The unique identifier for the client.
     * @returns The client status ('listo' or 'inicializando').
     */
    getClientStatus(id: string): string {
        const client = this.clients.get(id);
        if (!client) {
            throw new Error(`Cliente con ID ${id} no encontrado.`);
        }
        // If there is a QR code, the client is not ready (still in QR stage)
        if (this.qrCodes.has(id)) {
            return 'qr';
        }
        return client.info ? 'listo' : 'inicializando';
    }

    /**
     * Retrieves contacts.
     */
    async getContacts(id: string): Promise<WAWebJS.Contact[]> {
        const client = this.clients.get(id);
        if (!client) {
            throw new Error(`Cliente con ID ${id} no encontrado.`);
        }
        return await client.getContacts();
    }

    /**
     * Retrieves chat messages history.
     */
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

    // this send an audio base64 to a contact
    public async sendAudioAsVoice(id: string, to: string, mimeType: string, base64: string): Promise<void> {
        const client = this.clients.get(id);
        if (!client) {
            throw new Error(`Cliente con ID ${id} no encontrado.`);
        }
        try {

            // Convertimos cualquier audio recibido a formato OGG usando el códec Opus.
            const convertedBase64 = await convertToOggOpus(base64, mimeType);
            // Definimos el mimetype de salida. Aunque se muestra "audio/ogg", la conversión usa Opus.
            const newMimeType = 'audio/ogg';

            const media = new MessageMedia(newMimeType, convertedBase64);
            await client.sendMessage(to, media, { sendAudioAsVoice: true });

            console.log(`Audio enviado a ${to} desde el cliente ${id}`);
        } catch (error) {
            console.error(`Error al enviar el audio desde el cliente ${id}:`, error);
            throw error;
        }
    }


    /**
     * Centralized function to send a webhook notification.
     * Uses a try/catch with an auto-retry mechanism up to 5 times.
     * @param url - The webhook URL.
     * @param data - The payload to send.
     */
    private async sendWebhook(id: string, data: any): Promise<void> {
        try {

            const client = this.clients.get(id);
            if (!client) {
                throw new Error(`Cliente con ID ${id} no encontrado.`);
            }

            const webhookUrl = await this.getWebhookUrl(id);

            if (!webhookUrl) {
                throw new Error(`Webhook no configurado para el cliente ${id}.`);
            }

            const urls = webhookUrl.split('|');

            urls.forEach(async (url) => {
                try {
                    const response = await axios.post(url, data);
                    console.log(`Webhook POST response for ${url}:`, response.data);
                } catch (error) {
                    console.error(`Intento fallido para enviar webhook POST a ${id}:`, error);
                }
            });

            return; // Success: exit the function
        } catch (error) {
            console.error(`Intento fallido para enviar webhook POST a ${id}:`, error);

        }

    }

    public async reactToMessage(args: {
        id: string,
        contactId: string,
        messageId: string,
        reaction: string
    }): Promise<void> {
        try {

            const { id, contactId, messageId, reaction } = args;
            const client = this.clients.get(id);
            if (!client) {
                throw new Error(`Cliente con ID ${id} no encontrado.`);
            }

            try {
                const chat = await client.getChatById(contactId);

                if (!chat) {
                    throw new Error(`No se encontró el chat con el ID ${contactId}`);
                }

                const messages = (await chat.fetchMessages({ limit: 50, })).find(msg => {
                    if (msg.id._serialized === messageId) {
                        return true
                    }
                });


                if (!messages) {
                    throw new Error(`messages con ID ${messageId} no encontrado.`);
                }

                try {
                    await messages.react(reaction);

                } catch (error) {
                    throw new Error(`EROR REACTING TO messages con ID ${messageId}.`, error);
                }

            } catch (error) {
                console.error(`Error al obtener el chat con el ID ${contactId}:`, error);
                throw error;
            }

        } catch (error) {
            console.error(`Intento fallido`, error);
        }

    }
}
