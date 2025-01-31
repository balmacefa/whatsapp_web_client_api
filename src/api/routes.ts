import { celebrate, Joi, Segments } from 'celebrate';
import { Request, Response, Router } from 'express';
import { MessageMedia } from 'whatsapp-web.js';
import { ClientRepository } from './WA/items_db_repository';
import { ClientConfig, WhatsAppClientWrapper } from './WA/WhatsAppClientWrapper';

const router = Router();
const clientRepository = new ClientRepository();
const whatsappWrapper = new WhatsAppClientWrapper(clientRepository);

// Initialize clients
whatsappWrapper.initialize();

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
 * @swagger
 * /clients:
 *   post:
 *     tags: [Clients]
 *     summary: Create a new client
 *     description: Create a new WhatsApp client instance
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - webhookUrl
 *             properties:
 *               id:
 *                 type: string
 *                 description: Unique client ID
 *               webhookUrl:
 *                 type: string
 *                 format: uri
 *                 description: Webhook URL for notifications
 *     responses:
 *       201:
 *         description: Client created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 webhookUrl:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or client creation failed
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
 * /clients:
 *   get:
 *     tags: [Clients]
 *     summary: List all clients
 *     description: Retrieve list of all registered clients
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
 * /clients/{id}/status:
 *   get:
 *     tags: [Clients]
 *     summary: Get client status
 *     description: Retrieve current status of a specific client
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
 * /clients/{id}:
 *   delete:
 *     tags: [Clients]
 *     summary: Delete a client
 *     description: Remove a specific client instance
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
 *       404:
 *         description: Client not found
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
 * /clients/{id}/webhook:
 *   post:
 *     tags: [Clients]
 *     summary: Set client webhook
 *     description: Update webhook URL for a specific client
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
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Webhook updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Client not found
 */
router.post(
    '/clients/:id/webhook',
    celebrate({
        [Segments.PARAMS]: Joi.object({
            id: Joi.string().required(),
        }),
        [Segments.BODY]: Joi.object({
            url: Joi.string().uri().required(),
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
 * /clients/{id}/send-message:
 *   post:
 *     tags: [Messages]
 *     summary: Send text message
 *     description: Send a text message through a specific client
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
 *             type: object
 *             required:
 *               - to
 *               - message
 *             properties:
 *               to:
 *                 type: string
 *                 description: Recipient phone number
 *               message:
 *                 type: string
 *                 description: Message content
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Validation error or sending failed
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
 * /clients/{id}/send-media:
 *   post:
 *     tags: [Media]
 *     summary: Send media file
 *     description: Send a media file through a specific client
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
 *             type: object
 *             required:
 *               - to
 *               - file
 *             properties:
 *               to:
 *                 type: string
 *                 description: Recipient phone number
 *               file:
 *                 type: string
 *                 description: Path to media file
 *               caption:
 *                 type: string
 *                 description: Optional media caption
 *     responses:
 *       200:
 *         description: Media sent successfully
 *       400:
 *         description: Validation error or sending failed
 */
router.post(
    '/clients/:id/send-media',
    celebrate({
        [Segments.PARAMS]: Joi.object({
            id: Joi.string().required(),
        }),
        [Segments.BODY]: Joi.object({
            to: Joi.string().required(),
            file: Joi.string().required(),
            caption: Joi.string().optional(),
        }),
    }),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { to, file, caption } = req.body;
            const media = MessageMedia.fromFilePath(file);
            await whatsappWrapper.sendMedia(id, to, media, caption);
            res.json({ message: `Media sent to ${to} from client ${id}.` });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
);

/**
 * @swagger
 * /clients/{id}/base64_qr:
 *   get:
 *     tags: [QR]
 *     summary: Get client QR code
 *     description: Retrieve current QR code for client authentication
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
 *               type: object
 *               properties:
 *                 qr:
 *                   type: string
 *       404:
 *         description: No QR code available
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

// list enpoint returns the qr code as an image instead of base64

/**
     * @swagger
     * /clients/{id}/qr:
     *   get:
     *     tags: [QR]
     *     summary: Get client QR code
     *     description: Retrieve current QR code for client authentication as PNG image
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

// get contacts endpoint
/**
 * @swagger
 * /clients/{id}/contacts:
 *   get:
 *     tags: [Clients]
 *     summary: Get client contacts
 *     description: Retrieve list of contacts for a specific client
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
 *               type: object
 *               properties:
 *                 contacts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *       404:
 *         description: Client not found or contacts not available
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

// getChatMessages endpoint, request id, contact id, and limit *optional*
/**
 * @swagger
 * /clients/{id}/chats/{contactId}:
 *   get:
 *     tags: [Messages]
 *     summary: Get chat messages
 *     description: Retrieve chat messages for a specific contact
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
 *               type: object
 *              properties:
 *                messages:
 *                 type: array
 *                items:
 *                type: object
 *               properties:
 *                id:
 *                type: string
 *               fromMe:
 *               type: boolean
 *              body:
 *              type: string
 *             type:
 *            type: string
 *           timestamp:
 *          type: string
 *      404:
 *        description: Client not found or chat messages not available
 *     400:
 *      description: Validation error
 *    */
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

export const defineRoutes = (app: any) => {
    app.use('/api', router);
};