# Changelog

Todas las modificaciones notables a este proyecto se documentan en este archivo.  
El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.0.0/) y usa [SemVer](https://semver.org/lang/es/).

## [1.0.5]
### Añadido
- Nuevas rutas para `healthz` (verificación de vida) y `readiness` (preparación para recibir tráfico), útiles para entornos con balanceadores o Kubernetes.
- Devcontainer git-graph plugin para visualizar el historial de commits de forma gráfica.

### Corregido
- Corrección en el sistema de **graceful shutdown** para cerrar conexiones y procesos de forma ordenada al terminar la app.
- Mejora en la obtención del **estado actual del cliente**: ahora se interpreta correctamente el estado `null` como `qr_ready`.
  
### Cambiado
- Actualización de dependencias NPM a sus últimas versiones compatibles.


## [1.0.4]
> ✅ Esta es la primera **versión estable** del sistema. Incluye todas las funcionalidades principales y solo presenta bugs menores conocidos sin impacto crítico.

### Añadido
- Opción para obtener QR como imagen PNG además de base64.
- Nueva propiedad para configurar reintentos de webhook hasta 5 veces.
- Soporte para `getWebhookUrl(id)`.

### Corregido
- Error al enviar mensajes con archivos multimedia grandes.
- Corrección en la detección del evento `disconnected` para ciertos navegadores headless.

## [1.0.3]
### Añadido
- Endpoint para obtener historial de chat (`getChatMessages(id, cid)`).
- Validación de parámetros de entrada con `celebrate` y `Joi`.

### Cambiado
- Refactor del manejo de errores HTTP en las rutas.
- Mejora en el manejo de sesiones inactivas.

## [1.0.2]
### Añadido
- Soporte para reacciones a mensajes (emoji reactions).
- Documentación Swagger generada automáticamente.

### Corregido
- Corrección en formato de payload del webhook para evento `message`.

## [1.0.1]
### Añadido
- Compatibilidad con envío de notas de voz mediante conversión a OGG/Opus.
- Persistencia de sesiones usando `LocalAuth`.

### Cambiado
- Separación de lógica en `WhatsAppClientWrapper.ts` para facilitar mantenimiento.

## [1.0.0]
### Añadido
- Versión inicial con:
  - Manejo de múltiples clientes WhatsApp.
  - Envío de mensajes y archivos multimedia.
  - Generación de QR para autenticación.
  - API protegida con API Key (`Bearer` token).
  - Webhooks configurables para eventos (`qr`, `ready`, `message`, `disconnected`, etc.).
  - Imagen Docker lista para producción.
