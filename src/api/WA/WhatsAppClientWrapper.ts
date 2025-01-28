import axios from 'axios';
import * as qrcode from 'qrcode';
import { Client, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js';

export class WhatsAppClientWrapper {
    private clients: Map<string, Client>;
    private webhooks: Map<string, string>;
    private qrCodes: Map<string, string>; // Almacena los códigos QR en base64

    constructor() {
        this.clients = new Map();
        this.webhooks = new Map();
        this.qrCodes = new Map();
    }

    createClient(id: string): void {
        if (this.clients.has(id)) {
            throw new Error(`Client with ID ${id} already exists.`);
        }

        const client = new Client({
            authStrategy: new LocalAuth({ clientId: id }), // Usar LocalAuth para múltiples sesiones
        });

        client.on('qr', async (qr) => {
            console.log(`QR RECEIVED for client ${id}`);
            // Convertir el QR a base64
            const qrBase64 = await qrcode.toDataURL(qr);
            this.qrCodes.set(id, qrBase64);
        });

        client.on('ready', () => {
            console.log(`Client ${id} is ready!`);
            this.qrCodes.delete(id); // Eliminar el QR una vez que el cliente esté listo
        });

        client.on('message', async (msg: Message) => {
            console.log(`Message received from client ${id}:`, msg.body);
            const webhookUrl = this.webhooks.get(id);
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

                    await axios.post(webhookUrl, payload);
                    console.log(`Message forwarded to webhook for client ${id}`);
                } catch (error) {
                    console.error(`Error sending message to webhook for client ${id}:`, error);
                }
            }
        });

        client.initialize();
        this.clients.set(id, client);
    }

    getClient(id: string): Client | undefined {
        return this.clients.get(id);
    }

    removeClient(id: string): void {
        const client = this.clients.get(id);
        if (client) {
            client.destroy();
            this.clients.delete(id);
            this.webhooks.delete(id);
            this.qrCodes.delete(id);
            console.log(`Client ${id} removed.`);
        } else {
            throw new Error(`Client with ID ${id} not found.`);
        }
    }

    listClients(): string[] {
        return Array.from(this.clients.keys());
    }

    getClientStatus(id: string): string {
        const client = this.clients.get(id);
        if (!client) {
            throw new Error(`Client with ID ${id} not found.`);
        }
        return client.info ? 'ready' : 'initializing';
    }

    setWebhook(id: string, url: string): void {
        if (!this.clients.has(id)) {
            throw new Error(`Client with ID ${id} not found.`);
        }
        this.webhooks.set(id, url);
        console.log(`Webhook set for client ${id}: ${url}`);
    }

    async sendMessage(id: string, to: string, message: string): Promise<void> {
        const client = this.clients.get(id);
        if (!client) {
            throw new Error(`Client with ID ${id} not found.`);
        }
        await client.sendMessage(to, message);
        console.log(`Message sent to ${to} from client ${id}`);
    }

    async sendMedia(id: string, to: string, media: MessageMedia, caption?: string): Promise<void> {
        const client = this.clients.get(id);
        if (!client) {
            throw new Error(`Client with ID ${id} not found.`);
        }
        await client.sendMessage(to, media, { caption });
        console.log(`Media sent to ${to} from client ${id}`);
    }

    getQRCode(id: string): string | undefined {
        return this.qrCodes.get(id);
    }
}
