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

To get up and running:

```bash
docker build -t whatsapp-api .
docker run -p 3000:3000 -e API_KEY=your_api_key whatsapp-api
```

## 🔐 API Authentication

All endpoints require a valid API key. Include it in your request header:


`Authorization: Bearer your_api_key`


## 📄 License

MIT
