import { celebrate, Joi, Segments } from 'celebrate';
import { NextFunction, Request, Response, Router } from 'express';
import { MessageMedia } from 'whatsapp-web.js';
import { ENV } from '../server/global_variables';
import { ClientRepository } from './WA/items_db_repository';
import { ClientConfig, WhatsAppClientWrapper } from './WA/WhatsAppClientWrapper';

const router = Router();
const clientRepository = new ClientRepository();
const whatsappWrapper = new WhatsAppClientWrapper(clientRepository);

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     ClientConfig:
 *       type: object
 *       required:
 *         - id
 *         - webhookUrl
 *       properties:
 *         id:
 *           type: string
 *           description: Unique client ID
 *         webhookUrl:
 *           type: string
 *           format: uri
 *           description: Webhook URL for notifications
 *     CreateClientResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         webhookUrl:
 *           type: string
 *         message:
 *           type: string
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *     WebhookUpdateRequest:
 *       type: object
 *       required:
 *         - url
 *       properties:
 *         url:
 *           type: string
 *           format: uri
 *     SendMessageRequest:
 *       type: object
 *       required:
 *         - to
 *         - message
 *       properties:
 *         to:
 *           type: string
 *           description: Recipient phone number
 *         message:
 *           type: string
 *           description: Message content
 *     SendMediaRequest:
 *       type: object
 *       required:
 *         - to
 *         - file
 *       properties:
 *         to:
 *           type: string
 *           description: Recipient phone number
 *         file:
 *           type: string
 *           description: Path to media file
 *         caption:
 *           type: string
 *           description: Optional media caption
 *     QRCodeResponse:
 *       type: object
 *       properties:
 *         base64_qr:
 *           type: string
 *     QRImageResponse:
 *       type: string
 *       format: binary
 *     ContactsResponse:
 *       type: object
 *       properties:
 *         contacts:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *     ChatMessagesResponse:
 *       type: object
 *       properties:
 *         messages:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               fromMe:
 *                 type: boolean
 *               body:
 *                 type: string
 *               type:
 *                 type: string
 *               timestamp:
 *                 type: string
 */

/**
 * @swagger
 * tags:
 *   - name: Clients
 *     description: WhatsApp client management
 *   - name: Messages
 *     description: Message operations
 *   - name: Media
 *     description: Media operations
 *   - name: QR
 *     description: QR code management
 */

/**
 * Middleware to validate API Key using the Authorization header.
 * Expected format: Authorization: Bearer <API_KEY>
 */
export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        res.status(401).json({ error: 'Authorization header missing' });
        return;
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.status(400).json({ error: 'Invalid Authorization header format. Format should be "Bearer <API_KEY>"' });
        return;
    }

    const apiKey = parts[1];

    if (!ENV.API_KEYS.includes(apiKey)) {
        res.status(403).json({ error: 'Invalid API key' });
        return;
    }

    next();
};

router.use(apiKeyMiddleware);

// Initialize clients
whatsappWrapper.initialize();

/**
 * @swagger
 * /api/clients:
 *   post:
 *     tags: [Clients]
 *     summary: Create a new client
 *     description: Create a new WhatsApp client instance
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientConfig'
 *     responses:
 *       201:
 *         description: Client created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateClientResponse'
 *       400:
 *         description: Validation error or client creation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
    '/clients',
    celebrate({
        [Segments.BODY]: Joi.object({
            id: Joi.string().required(),
            webhookUrl: Joi.string().uri().required(),
        }),
    }),
    async (req: Request, res: Response) => {
        try {
            const { id, webhookUrl } = req.body as ClientConfig;
            await whatsappWrapper.addClient({ id, webhookUrl });
            res.status(201).json({
                id,
                webhookUrl,
                message: `Client ${id} created successfully.`,
            });
        } catch (error) {
            console.error(error);
            res.status(400).json({ error: error.message });
        }
    }
);

/**
 * @swagger
 * /api/clients:
 *   get:
 *     tags: [Clients]
 *     summary: List all clients
 *     description: Retrieve list of all registered clients
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of clients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clients:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       webhookUrl:
 *                         type: string
 *       400:
 *         description: Error retrieving clients
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/clients', async (req: Request, res: Response) => {
    try {
        const clients = await whatsappWrapper.listClients();
        res.json({ clients });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/clients/{id}/status:
 *   get:
 *     tags: [Clients]
 *     summary: Get client status
 *     description: Retrieve current status of a specific client
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     responses:
 *       200:
 *         description: Client status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *       404:
 *         description: Client not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
    '/clients/:id/status',
    celebrate({
        [Segments.PARAMS]: Joi.object({
            id: Joi.string().required(),
        }),
    }),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const status = await whatsappWrapper.getClientStatus(id);
            res.json({ id, status });
        } catch (error: any) {
            res.status(404).json({ error: error.message });
        }
    }
);

/**
 * @swagger
 * /api/clients/{id}:
 *   delete:
 *     tags: [Clients]
 *     summary: Delete a client
 *     description: Remove a specific client instance
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     responses:
 *       200:
 *         description: Client removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Client not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
    '/clients/:id',
    celebrate({
        [Segments.PARAMS]: Joi.object({
            id: Joi.string().required(),
        }),
    }),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await whatsappWrapper.removeClient(id);
            res.json({ message: `Client ${id} removed successfully.` });
        } catch (error) {
            console.error(error);
            res.status(404).json({ error: error.message });
        }
    }
);

/**
 * @swagger
 * /api/clients/{id}/webhook:
 *   post:
 *     tags: [Clients]
 *     summary: Set client webhook
 *     description: Update webhook URL for a specific client
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WebhookUpdateRequest'
 *     responses:
 *       200:
 *         description: Webhook updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Client not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
    '/clients/:id/webhook',
    celebrate({
        [Segments.PARAMS]: Joi.object({
            id: Joi.string().required(),
        }),
        [Segments.BODY]: Joi.object({
            url: Joi.string().required(),
        }),
    }),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { url } = req.body;
            await whatsappWrapper.setWebhook(id, url);
            res.json({ message: `Webhook set for client ${id}.` });
        } catch (error: any) {
            const statusCode = error.message.includes('not found') ? 404 : 400;
            res.status(statusCode).json({ error: error.message });
        }
    }
);

/**
 * @swagger
 * /api/clients/{id}/send-message:
 *   post:
 *     tags: [Messages]
 *     summary: Send text message
 *     description: Send a text message through a specific client
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendMessageRequest'
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or sending failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
    '/clients/:id/send-message',
    celebrate({
        [Segments.PARAMS]: Joi.object({
            id: Joi.string().required(),
        }),
        [Segments.BODY]: Joi.object({
            to: Joi.string().required(),
            message: Joi.string().required(),
        }),
    }),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { to, message } = req.body;
            await whatsappWrapper.sendMessage(id, to, message);
            res.json({ message: `Message sent to ${to} from client ${id}.` });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
);

/**
 * @swagger
 * /api/clients/{id}/send-media:
 *   post:
 *     tags: [Media]
 *     summary: Send media file
 *     description: Send a media file through a specific client
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendMediaRequest'
 *     responses:
 *       200:
 *         description: Media sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or sending failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
    '/clients/:id/send-media',
    celebrate({
        [Segments.PARAMS]: Joi.object({
            id: Joi.string().required(),
        }),
        [Segments.BODY]: Joi.object({
            to: Joi.string().required(),
            mimetype: Joi.string().required(),
            base64: Joi.string().required(),
            caption: Joi.string().optional(),
        }),
    }),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { to, base64, caption, mimetype, } = req.body;
            const media = new MessageMedia(mimetype, base64,)



            await whatsappWrapper.sendMedia(id, to, media, caption);
            res.json({ message: `Media sent to ${to} from client ${id}.` });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
);

/**
 * @swagger
 * /api/clients/{id}/base64_qr:
 *   get:
 *     tags: [QR]
 *     summary: Get client QR code
 *     description: Retrieve current QR code for client authentication
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     responses:
 *       200:
 *         description: QR code data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QRCodeResponse'
 *       404:
 *         description: No QR code available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
    '/clients/:id/base64_qr',
    celebrate({
        [Segments.PARAMS]: Joi.object({
            id: Joi.string().required(),
        }),
    }),
    (req: Request, res: Response): void => {
        try {
            const { id } = req.params;
            const base64_qr = whatsappWrapper.getQRCode(id);

            if (!base64_qr) {
                res.status(404).json({
                    message: `No QR code available for client ${id}.`
                });
                return;
            }

            res.json({ base64_qr });
        } catch (error: any) {
            res.status(404).json({ error: error.message });
        }
    }
);

/**
 * @swagger
 * /api/clients/{id}/qr:
 *   get:
 *     tags: [QR]
 *     summary: Get client QR code
 *     description: Retrieve current QR code for client authentication as PNG image
 *     security:
 *       - BearerAuth: []
 *     produces:
 *       - image/png
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     responses:
 *       200:
 *         description: QR code image
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: No QR code available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
    '/clients/:id/qr',
    celebrate({
        [Segments.PARAMS]: Joi.object({
            id: Joi.string().required(),
        }),
    }),
    (req: Request, res: Response): void => {
        try {
            const { id } = req.params;
            const qr = whatsappWrapper.getQRCode(id);

            if (!qr) {
                res.status(404).json({
                    message: `No QR code available for client ${id}.`
                });
                return;
            }

            // Convert base64 to buffer
            const base64Data = qr.replace(/^data:image\/png;base64,/, "");
            const imgBuffer = Buffer.from(base64Data, 'base64');

            res.set('Content-Type', 'image/png');
            res.send(imgBuffer);

        } catch (error: any) {
            res.status(404).json({ error: error.message });
        }
    }
);

/**
 * @swagger
 * /api/clients/{id}/contacts:
 *   get:
 *     tags: [Clients]
 *     summary: Get client contacts
 *     description: Retrieve list of contacts for a specific client
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     responses:
 *       200:
 *         description: List of contacts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContactsResponse'
 *       404:
 *         description: Client not found or contacts not available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
    '/clients/:id/contacts',
    celebrate({
        [Segments.PARAMS]: Joi.object({
            id: Joi.string().required(),
        }),
    }),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const contacts = await whatsappWrapper.getContacts(id);
            res.json({ contacts });
        } catch (error: any) {
            res.status(404).json({ error: error.message });
        }
    }
);

/**
 * @swagger
 * /api/clients/{id}/chats/{contactId}:
 *   get:
 *     tags: [Messages]
 *     summary: Get chat messages
 *     description: Retrieve chat messages for a specific contact
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Number of messages to retrieve
 *     responses:
 *       200:
 *         description: List of chat messages
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatMessagesResponse'
 *       404:
 *         description: Client not found or chat messages not available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
    '/clients/:id/chats/:contactId',
    celebrate({
        [Segments.PARAMS]: Joi.object({
            id: Joi.string().required(),
            contactId: Joi.string().required(),
        }),
        [Segments.QUERY]: Joi.object({
            limit: Joi.number().optional(),
        }),
    }),
    async (req: Request, res: Response) => {
        try {
            const { id, contactId } = req.params;
            const limit = req.query.limit ? Number(req.query.limit) : undefined;
            const messages = await whatsappWrapper.getChatMessages(id, contactId, limit);
            res.json({ messages });
        } catch (error: any) {
            res.status(404).json({ error: error.message });
        }
    }
);


/**
 * @swagger
 * /api/clients/{id}/send-audio-as-voice:
 *   post:
 *     tags: [Media]
 *     summary: Send audio as voice message
 *     description: Send an audio file as voice message through a specific client
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendMediaRequest'
 *     responses:
 *       200:
 *         description: Audio sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or sending failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
    '/clients/:id/send-audio-as-voice',
    celebrate({
        [Segments.PARAMS]: Joi.object({
            id: Joi.string().required(),
        }),
        [Segments.BODY]: Joi.object({
            to: Joi.string().required(),
            mimeType: Joi.string().required(),
            audioBase64: Joi.string().required(),
        }),
    }),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { to, audioBase64, mimeType } = req.body;

            await whatsappWrapper.sendAudioAsVoice(id, to, audioBase64, mimeType);

            res.json({ message: `Audio sent to ${to} from client ${id}.` });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
);


export const defineRoutes = (app: any) => {
    app.use('/api', router);
};
