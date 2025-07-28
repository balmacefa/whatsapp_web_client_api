# WhatsApp Web Client API

A Dockerized Node.js wrapper around [wwebjs](https://wwebjs.dev/) to expose a simple and secure REST API for managing WhatsApp sessions and interactions.

## 🚀 Features

- **Client Management**  
  - Create, list, delete WhatsApp client instances  
  - Get client status  
  - Update webhook URLs for notifications  

- **Messaging**  
  - Send text messages and media (images, videos, documents)  
  - Send audio files as voice messages  
  - React to existing messages  

- **QR Code Authentication**  
  - Retrieve QR codes in base64 or PNG format for new sessions  

- **Contacts & Chats**  
  - Fetch contact list for a client  
  - Retrieve chat history with a contact  

- **Security**  
  - API key authentication using a `Bearer` token in the `Authorization` header  

- **Validation**  
  - Input validation using `celebrate` and `Joi` for body and parameter checks  

- **Documentation**  
  - Built-in Swagger (OpenAPI) annotations for auto-generated, interactive API docs  

## 🐳 Docker Support

This project includes a preconfigured Docker image, making it easy to run the service in a containerized environment.

## 📦 Getting Started

To get up and running, using local repository:

```bash
docker build -t whatsapp-api .
docker run -p 3000:3000 -e PORT=3000 -e API_KEYS=your_api_key -e PROD_HOST=https://subdomain.app.github.dev  -v ~/whatsapp-data:/app/data whatsapp-api
```


Using the Docker Hub Image:

```bash
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e API_KEYS=supersecretkey \
  -e PROD_HOST=http://localhost:3000 \
  -v ~/whatsapp-data:/app/data \
  balmacefa/whatsapp_web_client_api:1.0.5

```
https://hub.docker.com/r/balmacefa/whatsapp_web_client_api



## 🔐 API Authentication

All endpoints require a valid API key. Include it in your request header:


`Authorization: Bearer your_api_key`


# CODE
Please review the core file `src/api/WA/WhatsAppClientWrapper.ts`

# WhatsAppClientWrapper

This module provides a high-level wrapper for managing multiple WhatsApp Web sessions using [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js). It is designed to help backends manage multiple WhatsApp clients, send messages, receive events, and forward notifications using webhooks.

## Features

- 🔒 Supports multiple concurrent sessions with persistent auth (using `LocalAuth`)
- 🧠 Centralized client/session/QR management
- 📩 Send text messages, media, and voice notes (with audio conversion to OGG/Opus)
- 🪝 Configurable webhooks for events (QR, ready, messages, disconnect, etc.)
- 🗃️ Session storage and restore using a `ClientRepository`
- 🔁 Webhook retry mechanism (up to 5 times on failure)
- 📜 Supports retrieving contacts and chat history


## Events and Webhooks

The system will automatically send events to the configured webhook URL for each client.

### Event Types

| Event         | Description                             |
|---------------|-----------------------------------------|
| `qr`          | QR code generated, sent as base64       |
| `ready`       | Client is ready                         |
| `message`     | Message received (text or media)        |
| `disconnected`| Client disconnected                     |
| `auth_failure`| Authentication failed                   |
| `change_state`| WhatsApp client state changed           |

Each webhook receives a JSON payload with:

```json
{
  "type": "event_type",
  "payload": { ... }
}
```

## Available Methods

List of methods exposed by the system:

| Method                         | Description                                |
|--------------------------------|--------------------------------------------|
| `initialize()`                 | Restore all sessions                       |
| `addClient(config)`           | Add and initialize a new client           |
| `sendMessage(id, to, msg)`    | Send a text message                        |
| `sendMedia(id, to, media)`    | Send media (image, video, etc.)           |
| `sendAudioAsVoice(...)`       | Convert and send a voice note             |
| `getQRCode(id)`               | Get QR code as a base64 string             |
| `removeClient(id)`            | Delete a client completely                 |
| `getClientsInfo()`            | List all clients                           |
| `listClients()`               | List clients and their current states      |
| `getClientStatus(id)`         | Get client status (`qr`, `ready`, etc.)    |
| `getContacts(id)`             | Get client contacts                        |
| `getChatMessages(id, cid)`    | Get chat messages for a given chat ID      |
| `setWebhook(id, url)`         | Set or update the webhook URL              |
| `getWebhookUrl(id)`           | Get the current webhook URL                |



## 📄 License

MIT
